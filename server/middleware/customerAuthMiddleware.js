import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const customerAuthMiddleware = (req, res, next) => {
  try {
    // ===============================
    // CHECK JWT SECRET
    // ===============================

    if (!process.env.JWT_SECRET) {
      console.error(
        "Customer Auth Error: JWT_SECRET is not configured"
      );

      return res.status(500).json({
        message: "Server configuration error"
      });
    }

    // ===============================
    // GET AUTHORIZATION HEADER
    // ===============================

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message:
          "Access denied. Customer token required."
      });
    }

    // ===============================
    // VALIDATE BEARER FORMAT
    // ===============================

    const parts =
      authHeader.trim().split(/\s+/);

    if (
      parts.length !== 2 ||
      parts[0].toLowerCase() !== "bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        message:
          "Invalid authorization format"
      });
    }

    const token = parts[1];

    // ===============================
    // VERIFY TOKEN
    // ===============================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ===============================
    // CHECK CUSTOMER ID
    // ===============================

    if (
      !decoded ||
      !decoded.customerId
    ) {
      return res.status(401).json({
        message:
          "Invalid customer token"
      });
    }

    // ===============================
    // VALIDATE CUSTOMER ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        decoded.customerId
      )
    ) {
      return res.status(401).json({
        message:
          "Invalid customer token"
      });
    }

    // ===============================
    // CHECK CUSTOMER ROLE
    // ===============================

    if (
      decoded.role !== "customer"
    ) {
      return res.status(403).json({
        message:
          "Access denied. Customer access only."
      });
    }

    // ===============================
    // ATTACH CONTROLLED CUSTOMER DATA
    // ===============================

    req.customer = {
      customerId:
        decoded.customerId.toString(),
      role: decoded.role
    };

    // ===============================
    // CONTINUE
    // ===============================

    next();

  } catch (error) {
    console.error(
      "Customer Auth Middleware Error:",
      error.message
    );

    return res.status(401).json({
      message:
        "Invalid or expired customer token"
    });
  }
};

export default customerAuthMiddleware;