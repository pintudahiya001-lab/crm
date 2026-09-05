import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  try {
    // ===============================
    // CHECK JWT SECRET
    // ===============================

    if (!process.env.JWT_SECRET) {
      console.error(
        "Auth Middleware Error: JWT_SECRET is not configured"
      );

      return res.status(500).json({
        message: "Server configuration error"
      });
    }

    // ===============================
    // GET AUTHORIZATION HEADER
    // ===============================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    // ===============================
    // VALIDATE BEARER FORMAT
    // ===============================

    const parts = authHeader.trim().split(/\s+/);

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        message: "Invalid authorization format"
      });
    }

    const token = parts[1];

    // ===============================
    // VERIFY JWT
    // ===============================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ===============================
    // CHECK USER ID
    // ===============================

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        message: "Invalid authentication token"
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
        message: "Invalid authentication token"
      });
    }

    // ===============================
    // CHECK USER IN DATABASE
    // ===============================

    const user = await User.findById(
      decoded.userId
    ).select(
      "_id name email role status"
    );

    if (!user) {
      return res.status(401).json({
        message: "User account not found."
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
    // ATTACH USER TO REQUEST
    // ===============================

    req.user = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };

    next();

  } catch (error) {
    console.error(
      "Auth Middleware Error:",
      error.message
    );

    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

export default authMiddleware;