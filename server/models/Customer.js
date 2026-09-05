import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    // ===============================
    // CUSTOMER LOGIN DETAILS
    // ===============================

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      minlength: [2, "Customer name must be at least 2 characters"],
      maxlength: [100, "Customer name cannot exceed 100 characters"]
    },

    email: {
      type: String,
      required: [true, "Customer email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Customer email cannot exceed 254 characters"],
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address"
      ]
    },

    password: {
      type: String,
      required: [true, "Customer password is required"]
    },

    // ===============================
    // CUSTOMER DETAILS
    // ===============================

    phone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
      minlength: [7, "Phone number is too short"],
      maxlength: [20, "Phone number cannot exceed 20 characters"]
    },

    company: {
      type: String,
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"]
    },

    address: {
      type: String,
      trim: true,
      maxlength: [500, "Address cannot exceed 500 characters"]
    },

    status: {
      type: String,
      enum: {
        values: ["active", "inactive"],
        message: "Invalid customer status"
      },
      default: "active"
    },

    // ===============================
    // CREATED BY ADMIN / EMPLOYEE
    // ===============================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by user is required"]
    }
  },
  {
    timestamps: true
  }
);

// ===============================
// INDEXES
// ===============================

customerSchema.index({
  status: 1
});

customerSchema.index({
  createdAt: -1
});

const Customer = mongoose.model(
  "Customer",
  customerSchema
);

export default Customer;