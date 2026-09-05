import mongoose from "mongoose";
import Notification from "../models/Notification.js";

// ===============================
// GET MY NOTIFICATIONS
// Admin + Employee
// ===============================

export const getMyNotifications = async (
  req,
  res
) => {
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
    // GET ONLY MY NOTIFICATIONS
    // ===============================

    const notifications =
      await Notification.find({
        recipient: req.user.userId
      })
        .populate(
          "ticket",
          "subject status priority"
        )
        .sort({
          createdAt: -1
        });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Notifications fetched successfully",
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error(
      "Get Notifications Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET UNREAD NOTIFICATION COUNT
// Admin + Employee
// ===============================

export const getUnreadNotificationCount =
  async (req, res) => {
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
      // COUNT ONLY MY UNREAD NOTIFICATIONS
      // ===============================

      const unreadCount =
        await Notification.countDocuments({
          recipient:
            req.user.userId,
          isRead: false
        });

      // ===============================
      // RESPONSE
      // ===============================

      res.status(200).json({
        message:
          "Unread notification count fetched successfully",
        unreadCount
      });

    } catch (error) {
      console.error(
        "Unread Notification Count Error:",
        error.message
      );

      res.status(500).json({
        message: "Server error"
      });
    }
  };

// ===============================
// MARK NOTIFICATION AS READ
// Admin + Employee
// ===============================

export const markNotificationAsRead =
  async (req, res) => {
    try {
      const { id } =
        req.params;

      // ===============================
      // VALIDATE NOTIFICATION ID
      // ===============================

      if (
        !mongoose.Types.ObjectId.isValid(
          id
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid notification ID"
        });
      }

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
      // FIND ONLY MY NOTIFICATION
      // ===============================

      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: id,
            recipient:
              req.user.userId
          },
          {
            isRead: true
          },
          {
            new: true,
            runValidators: true
          }
        )
          .populate(
            "ticket",
            "subject status priority"
          );

      // ===============================
      // NOT FOUND
      // ===============================

      if (!notification) {
        return res.status(404).json({
          message:
            "Notification not found"
        });
      }

      // ===============================
      // RESPONSE
      // ===============================

      res.status(200).json({
        message:
          "Notification marked as read",
        notification
      });

    } catch (error) {
      console.error(
        "Mark Notification Read Error:",
        error.message
      );

      res.status(500).json({
        message: "Server error"
      });
    }
  };

// ===============================
// MARK ALL NOTIFICATIONS AS READ
// Admin + Employee
// ===============================

export const markAllNotificationsAsRead =
  async (req, res) => {
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
      // MARK ONLY MY NOTIFICATIONS
      // ===============================

      const result =
        await Notification.updateMany(
          {
            recipient:
              req.user.userId,
            isRead: false
          },
          {
            isRead: true
          },
          {
            runValidators: true
          }
        );

      // ===============================
      // RESPONSE
      // ===============================

      res.status(200).json({
        message:
          "All notifications marked as read",
        updatedCount:
          result.modifiedCount
      });

    } catch (error) {
      console.error(
        "Mark All Notifications Read Error:",
        error.message
      );

      res.status(500).json({
        message: "Server error"
      });
    }
  };