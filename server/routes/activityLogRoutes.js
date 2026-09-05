import express from "express";

import {
  getAllActivityLogs
} from "../controllers/activityLogController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllActivityLogs
);

export default router;