import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    // ===============================
    // USER WHO PERFORMED THE ACTION
    // ===============================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // ===============================
    // RELATED CUSTOMER
    // ===============================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },

    // ===============================
    // ACTION
    // ===============================

    action: {
      type: String,
      required: [true, "Activity action is required"],
      trim: true,
      minlength: [
        2,
        "Activity action must be at least 2 characters"
      ],
      maxlength: [
        50,
        "Activity action cannot exceed 50 characters"
      ]
    },

    // ===============================
    // ENTITY TYPE
    // ===============================

    entityType: {
      type: String,
      enum: {
        values: [
          "customer",
          "employee",
          "ticket",
          "notification"
        ],
        message: "Invalid activity entity type"
      },
      required: [true, "Activity entity type is required"]
    },

    // ===============================
    // ENTITY ID
    // ===============================

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Activity entity ID is required"]
    },

    // ===============================
    // DESCRIPTION
    // ===============================

    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
      minlength: [
        2,
        "Activity description must be at least 2 characters"
      ],
      maxlength: [
        1000,
        "Activity description cannot exceed 1000 characters"
      ]
    }
  },
  {
    timestamps: true
  }
);

// ===============================
// INDEXES
// ===============================

activityLogSchema.index({
  user: 1,
  createdAt: -1
});

activityLogSchema.index({
  entityType: 1,
  createdAt: -1
});

activityLogSchema.index({
  action: 1,
  createdAt: -1
});

activityLogSchema.index({
  customer: 1,
  createdAt: -1
});

activityLogSchema.index({
  createdAt: -1
});

const ActivityLog = mongoose.model(
  "ActivityLog",
  activityLogSchema
);

export default ActivityLog;