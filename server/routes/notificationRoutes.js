import express from "express";

import {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ===============================
// ADMIN + EMPLOYEE AUTH
// ===============================

router.use(
  authMiddleware,
  roleMiddleware(["admin", "employee"])
);


// ===============================
// GET MY NOTIFICATIONS
// ===============================

router.get(
  "/",
  getMyNotifications
);


// ===============================
// GET UNREAD COUNT
// ===============================

router.get(
  "/unread-count",
  getUnreadNotificationCount
);


// ===============================
// MARK ONE AS READ
// ===============================

router.patch(
  "/:id/read",
  markNotificationAsRead
);


// ===============================
// MARK ALL AS READ
// ===============================

router.patch(
  "/read-all",
  markAllNotificationsAsRead
);

export default router;