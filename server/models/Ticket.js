import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    // ===============================
    // CUSTOMER
    // ===============================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Customer is required"]
    },

    // ===============================
    // TICKET DETAILS
    // ===============================

    subject: {
      type: String,
      required: [true, "Ticket subject is required"],
      trim: true,
      minlength: [3, "Ticket subject must be at least 3 characters"],
      maxlength: [200, "Ticket subject cannot exceed 200 characters"]
    },

    description: {
      type: String,
      required: [true, "Ticket description is required"],
      trim: true,
      minlength: [5, "Ticket description must be at least 5 characters"],
      maxlength: [5000, "Ticket description cannot exceed 5000 characters"]
    },

    // ===============================
    // PRIORITY
    // ===============================

    priority: {
      type: String,
      enum: {
        values: [
          "low",
          "medium",
          "high",
          "urgent"
        ],
        message: "Invalid ticket priority"
      },
      default: "medium"
    },

    // ===============================
    // STATUS
    // ===============================

    status: {
      type: String,
      enum: {
        values: [
          "open",
          "in-progress",
          "resolved",
          "closed"
        ],
        message: "Invalid ticket status"
      },
      default: "open"
    },

    // ===============================
    // ADMIN / EMPLOYEE REPLY
    // ===============================

    reply: {
      type: String,
      trim: true,
      maxlength: [5000, "Ticket reply cannot exceed 5000 characters"],
      default: ""
    },

    // ===============================
    // WHO HANDLED THE TICKET
    // ===============================

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

ticketSchema.index({
  customer: 1
});

ticketSchema.index({
  status: 1
});

ticketSchema.index({
  priority: 1
});

ticketSchema.index({
  assignedTo: 1
});

ticketSchema.index({
  createdAt: -1
});

const Ticket = mongoose.model(
  "Ticket",
  ticketSchema
);

export default Ticket;