import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // ===============================
    // NAME
    // ===============================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"]
    },

    // ===============================
    // EMAIL
    // ===============================

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email cannot exceed 254 characters"]
    },

    // ===============================
    // PASSWORD
    // ===============================

    password: {
      type: String,
      required: [true, "Password is required"]
    },

    // ===============================
    // ROLE
    // ===============================

    role: {
      type: String,
      enum: {
        values: ["admin", "employee"],
        message: "Invalid user role"
      },
      default: "employee"
    },

    // ===============================
    // STATUS
    // ===============================

    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Invalid user status"
      },
      default: "active"
    },

    // ===============================
    // REFRESH TOKEN
    // ===============================

    refreshToken: {
      type: String,
      default: null
    },

    // ===============================
    // REFRESH TOKEN EXPIRY
    // ===============================

    refreshTokenExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// ===============================
// INDEXES
// ===============================

userSchema.index({
  role: 1
});

userSchema.index({
  status: 1
});

userSchema.index({
  createdAt: -1
});

const User = mongoose.model(
  "User",
  userSchema
);

export default User;