import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import User from "../models/User.js";
import Ticket from "../models/Ticket.js";

// ===============================
// GET DASHBOARD STATISTICS
// Admin + Employee
// Role-based Ticket Scoping
// ===============================

export const getDashboardStats = async (
  req,
  res
) => {
  try {
    // ===============================
    // CHECK AUTHENTICATED USER
    // ===============================

    if (!req.user?.userId) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    // ===============================
    // CUSTOMER COUNTS
    // ===============================

    const totalCustomers =
      await Customer.countDocuments();

    const activeCustomers =
      await Customer.countDocuments({
        status: "active"
      });

    const inactiveCustomers =
      await Customer.countDocuments({
        status: "inactive"
      });

    // ===============================
    // EMPLOYEE COUNTS
    // ===============================

    const totalEmployees =
      await User.countDocuments({
        role: "employee"
      });

    const activeEmployees =
      await User.countDocuments({
        role: "employee",
        status: "active"
      });

    const inactiveEmployees =
      await User.countDocuments({
        role: "employee",
        status: "inactive"
      });

    // ===============================
    // BUILD TICKET SCOPE
    // ===============================

    let ticketFilter = {};

    // ===============================
    // EMPLOYEE CAN ONLY SEE
    // HIS ASSIGNED TICKETS
    // ===============================

    if (req.user.role === "employee") {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.user.userId
        )
      ) {
        return res.status(401).json({
          message: "Unauthorized"
        });
      }

      ticketFilter = {
        assignedTo: req.user.userId
      };
    }

    // ===============================
    // TICKET COUNTS
    // ===============================

    const totalTickets =
      await Ticket.countDocuments(
        ticketFilter
      );

    const openTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        status: "open"
      });

    const inProgressTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        status: "in-progress"
      });

    const resolvedTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        status: "resolved"
      });

    const closedTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        status: "closed"
      });

    // ===============================
    // TICKET PRIORITY
    // ===============================

    const lowPriorityTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        priority: "low"
      });

    const mediumPriorityTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        priority: "medium"
      });

    const highPriorityTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        priority: "high"
      });

    const urgentPriorityTickets =
      await Ticket.countDocuments({
        ...ticketFilter,
        priority: "urgent"
      });

    // ===============================
    // ASSIGNMENT COUNTS
    // ===============================

    let assignedTickets = 0;
    let unassignedTickets = 0;

    // ===============================
    // ADMIN
    // ===============================

    if (req.user.role === "admin") {
      assignedTickets =
        await Ticket.countDocuments({
          assignedTo: {
            $ne: null
          }
        });

      unassignedTickets =
        await Ticket.countDocuments({
          assignedTo: null
        });
    }

    // ===============================
    // EMPLOYEE
    // ===============================
    // Since employee only gets
    // his assigned tickets,
    // every visible ticket is assigned.
    // ===============================

    if (req.user.role === "employee") {
      assignedTickets =
        totalTickets;

      unassignedTickets = 0;
    }

    // ===============================
    // SEND RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Dashboard statistics fetched successfully",

      role: req.user.role,

      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: inactiveCustomers
      },

      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees
      },

      tickets: {
        total: totalTickets,

        status: {
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets
        },

        priority: {
          low: lowPriorityTickets,
          medium: mediumPriorityTickets,
          high: highPriorityTickets,
          urgent: urgentPriorityTickets
        },

        assignment: {
          assigned: assignedTickets,
          unassigned:
            unassignedTickets
        }
      }
    });

  } catch (error) {
    console.error(
      "Dashboard Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};