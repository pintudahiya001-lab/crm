import express from "express";
import rateLimit from "express-rate-limit";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getProfile
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ===============================
// AUTH RATE LIMITER
// ===============================

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,

  message: {
    message:
      "Too many authentication attempts. Please try again later."
  },

  standardHeaders: true,
  legacyHeaders: false
});

// ===============================
// REGISTER
// ===============================

router.post(
  "/register",
  authLimiter,
  registerUser
);

// ===============================
// LOGIN
// ===============================

router.post(
  "/login",
  authLimiter,
  loginUser
);

// ===============================
// REFRESH ACCESS TOKEN
// ===============================

router.post(
  "/refresh",
  authLimiter,
  refreshAccessToken
);

// ===============================
// LOGOUT
// ===============================

router.post(
  "/logout",
  authMiddleware,
  logoutUser
);

// ===============================
// PROFILE
// Login required
// ===============================

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

// ===============================
// ADMIN ONLY TEST ROUTE
// ===============================

router.get(
  "/admin-test",
  authMiddleware,
  roleMiddleware(["admin"]),
  (req, res) => {
    res.status(200).json({
      message: "Welcome Admin! You have admin access."
    });
  }
);

export default router;