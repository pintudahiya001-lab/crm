import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

// ===============================
// CREATE ACCESS TOKEN
// ===============================

const createAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m"
    }
  );
};

// ===============================
// CREATE REFRESH TOKEN
// ===============================

const createRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
};

// ===============================
// VALIDATE EMAIL
// ===============================

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ===============================
// REGISTER USER
// Public Registration
// ===============================

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body;

    // ===============================
    // CHECK REQUIRED FIELDS
    // ===============================

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      return res.status(400).json({
        message: "Name is required"
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        message: "Email is required"
      });
    }

    // ===============================
    // VALIDATE EMAIL
    // ===============================

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    // ===============================
    // VALIDATE PASSWORD
    // ===============================

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters"
      });
    }

    // ===============================
    // CHECK EXISTING USER
    // ===============================

    const existingUser = await User.findOne({
      email: cleanEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // ===============================
    // HASH PASSWORD
    // ===============================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // ===============================
    // CREATE USER
    // ===============================

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: "employee",
      status: "active"
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error(
      "Register Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// LOGIN USER
// ===============================

export const loginUser = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    // ===============================
    // CHECK INPUT TYPES
    // ===============================

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message:
          "Email and password are required"
      });
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    // ===============================
    // CHECK INPUT
    // ===============================

    if (!cleanEmail || !password) {
      return res.status(400).json({
        message:
          "Email and password are required"
      });
    }

    // ===============================
    // VALIDATE EMAIL
    // ===============================

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    // ===============================
    // FIND USER
    // ===============================

    const user = await User.findOne({
      email: cleanEmail
    });

    // ===============================
    // CHECK PASSWORD
    // ===============================

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // ===============================
    // CHECK USER STATUS
    // ===============================

    if (user.status !== "active") {
      return res.status(403).json({
        message:
          "Your account is inactive. Please contact admin."
      });
    }

    // ===============================
    // CREATE ACCESS TOKEN
    // ===============================

    const accessToken = createAccessToken(user);

    // ===============================
    // CREATE REFRESH TOKEN
    // ===============================

    const refreshToken = createRefreshToken(user);

    const refreshTokenExpiresAt = new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    // ===============================
    // SAVE REFRESH TOKEN
    // ===============================

    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt =
      refreshTokenExpiresAt;

    await user.save();

    // ===============================
    // SET HTTP-ONLY COOKIE
    // ===============================

    res.cookie(
      "refreshToken",
      refreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge:
          7 * 24 * 60 * 60 * 1000,
        path: "/api/auth"
      }
    );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message: "Login successful",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error(
      "Login Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// REFRESH ACCESS TOKEN
// ===============================

export const refreshAccessToken = async (
  req,
  res
) => {
  try {
    // ===============================
    // GET REFRESH TOKEN FROM COOKIE
    // ===============================

    const refreshToken =
      req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        message: "Refresh token is required"
      });
    }

    // ===============================
    // VERIFY REFRESH TOKEN
    // ===============================

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET
    );

    // ===============================
    // CHECK USER ID
    // ===============================

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        message: "Invalid refresh token"
      });
    }

    // ===============================
    // VALIDATE USER ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        decoded.userId
      )
    ) {
      return res.status(401).json({
        message: "Invalid refresh token"
      });
    }

    // ===============================
    // FIND USER
    // ===============================

    const user = await User.findById(
      decoded.userId
    );

    if (!user) {
      return res.status(401).json({
        message: "User account not found"
      });
    }

    // ===============================
    // CHECK USER STATUS
    // ===============================

    if (user.status !== "active") {
      return res.status(403).json({
        message:
          "Your account is inactive. Please contact admin."
      });
    }

    // ===============================
    // CHECK STORED REFRESH TOKEN
    // ===============================

    if (
      !user.refreshToken ||
      user.refreshToken !== refreshToken
    ) {
      return res.status(401).json({
        message:
          "Invalid or revoked refresh token"
      });
    }

    // ===============================
    // CHECK REFRESH TOKEN EXPIRY
    // ===============================

    if (
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt < new Date()
    ) {
      user.refreshToken = null;
      user.refreshTokenExpiresAt = null;

      await user.save();

      res.clearCookie(
        "refreshToken",
        {
          httpOnly: true,
          secure:
            process.env.NODE_ENV === "production",
          sameSite:
            process.env.NODE_ENV === "production"
              ? "none"
              : "lax",
          path: "/api/auth"
        }
      );

      return res.status(401).json({
        message:
          "Refresh token expired. Please login again."
      });
    }

    // ===============================
    // CREATE NEW ACCESS TOKEN
    // ===============================

    const newAccessToken =
      createAccessToken(user);

    // ===============================
    // ROTATE REFRESH TOKEN
    // ===============================

    const newRefreshToken =
      createRefreshToken(user);

    user.refreshToken = newRefreshToken;

    user.refreshTokenExpiresAt = new Date(
      Date.now() +
        7 * 24 * 60 * 60 * 1000
    );

    await user.save();

    // ===============================
    // UPDATE HTTP-ONLY COOKIE
    // ===============================

    res.cookie(
      "refreshToken",
      newRefreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        maxAge:
          7 * 24 * 60 * 60 * 1000,
        path: "/api/auth"
      }
    );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Access token refreshed successfully",
      token: newAccessToken
    });

  } catch (error) {
    console.error(
      "Refresh Token Error:",
      error.message
    );

    return res.status(401).json({
      message:
        "Invalid or expired refresh token"
    });
  }
};

// ===============================
// LOGOUT USER
// ===============================

export const logoutUser = async (req, res) => {
  try {
    // ===============================
    // FIND USER
    // ===============================

    if (
      !req.user?.userId ||
      !mongoose.Types.ObjectId.isValid(
        req.user.userId
      )
    ) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const user = await User.findById(
      req.user.userId
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // ===============================
    // REVOKE REFRESH TOKEN
    // ===============================

    user.refreshToken = null;
    user.refreshTokenExpiresAt = null;

    await user.save();

    // ===============================
    // CLEAR REFRESH COOKIE
    // ===============================

    res.clearCookie(
      "refreshToken",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite:
          process.env.NODE_ENV === "production"
            ? "none"
            : "lax",
        path: "/api/auth"
      }
    );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message: "Logout successful"
    });

  } catch (error) {
    console.error(
      "Logout Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET PROFILE
// ===============================

export const getProfile = async (req, res) => {
  try {
    // ===============================
    // VALIDATE USER ID
    // ===============================

    if (
      !req.user?.userId ||
      !mongoose.Types.ObjectId.isValid(
        req.user.userId
      )
    ) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    // ===============================
    // FIND USER
    // ===============================

    const user = await User.findById(
      req.user.userId
    ).select(
      "-password -refreshToken -refreshTokenExpiresAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Profile accessed successfully",
      user
    });

  } catch (error) {
    console.error(
      "Profile Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};