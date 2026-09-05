import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // ===============================
    // JISKO NOTIFICATION MILEGI
    // ===============================

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required"]
    },

    // ===============================
    // NOTIFICATION TYPE
    // ===============================

    type: {
      type: String,
      enum: {
        values: [
          "ticket-created",
          "ticket-assigned",
          "ticket-updated",
          "ticket-replied"
        ],
        message: "Invalid notification type"
      },
      required: [true, "Notification type is required"]
    },

    // ===============================
    // NOTIFICATION TITLE
    // ===============================

    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
      minlength: [
        2,
        "Notification title must be at least 2 characters"
      ],
      maxlength: [
        200,
        "Notification title cannot exceed 200 characters"
      ]
    },

    // ===============================
    // NOTIFICATION MESSAGE
    // ===============================

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
      minlength: [
        2,
        "Notification message must be at least 2 characters"
      ],
      maxlength: [
        1000,
        "Notification message cannot exceed 1000 characters"
      ]
    },

    // ===============================
    // RELATED TICKET
    // ===============================

    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      default: null
    },

    // ===============================
    // READ / UNREAD
    // ===============================

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// ===============================
// INDEXES
// ===============================

notificationSchema.index({
  recipient: 1
});

notificationSchema.index({
  isRead: 1
});

notificationSchema.index({
  createdAt: -1
});

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;