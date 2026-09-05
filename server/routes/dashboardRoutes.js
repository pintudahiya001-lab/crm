import express from "express";

import {
  getDashboardStats
} from "../controllers/dashboardController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ===============================
// DASHBOARD
// Admin + Employee
// ===============================

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "employee"]),
  getDashboardStats
);

export default router;