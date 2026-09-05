import mongoose from "mongoose";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import ActivityLog from "../models/ActivityLog.js";

// ===============================
// HELPERS
// ===============================

const allowedPriorities = [
  "low",
  "medium",
  "high",
  "urgent"
];

const allowedStatuses = [
  "open",
  "in-progress",
  "resolved",
  "closed"
];

const escapeRegex = (value) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

// ===============================
// CREATE TICKET
// Customer Only
// ===============================

export const createTicket = async (req, res) => {
  try {
    const {
      subject,
      description,
      priority
    } = req.body || {};

    // ===============================
    // INPUT TYPE VALIDATION
    // ===============================

    if (
      typeof subject !== "string" ||
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message:
          "Subject and description are required"
      });
    }

    const cleanSubject = subject.trim();
    const cleanDescription = description.trim();

    // ===============================
    // REQUIRED VALIDATION
    // ===============================

    if (
      !cleanSubject ||
      !cleanDescription
    ) {
      return res.status(400).json({
        message:
          "Subject and description are required"
      });
    }

    // ===============================
    // SUBJECT VALIDATION
    // ===============================

    if (cleanSubject.length < 3) {
      return res.status(400).json({
        message:
          "Ticket subject must be at least 3 characters"
      });
    }

    if (cleanSubject.length > 200) {
      return res.status(400).json({
        message:
          "Ticket subject cannot exceed 200 characters"
      });
    }

    // ===============================
    // DESCRIPTION VALIDATION
    // ===============================

    if (cleanDescription.length < 5) {
      return res.status(400).json({
        message:
          "Ticket description must be at least 5 characters"
      });
    }

    if (cleanDescription.length > 5000) {
      return res.status(400).json({
        message:
          "Ticket description cannot exceed 5000 characters"
      });
    }

    // ===============================
    // PRIORITY VALIDATION
    // ===============================

    const ticketPriority =
      priority === undefined ||
      priority === null ||
      priority === ""
        ? "medium"
        : priority;

    if (
      typeof ticketPriority !== "string" ||
      !allowedPriorities.includes(
        ticketPriority
      )
    ) {
      return res.status(400).json({
        message: "Invalid ticket priority"
      });
    }

    // ===============================
    // CUSTOMER ID VALIDATION
    // ===============================

    if (
      !req.customer?.customerId ||
      !mongoose.Types.ObjectId.isValid(
        req.customer.customerId
      )
    ) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    // ===============================
    // CREATE TICKET
    // ===============================

    const ticket = await Ticket.create({
      customer:
        req.customer.customerId,
      subject: cleanSubject,
      description: cleanDescription,
      priority: ticketPriority
    });

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      customer:
        req.customer.customerId,
      action: "create",
      entityType: "ticket",
      entityId: ticket._id,
      description:
        `Created ticket ${ticket.subject}`
    });

    // ===============================
    // CREATE ADMIN NOTIFICATIONS
    // ===============================

    const admins = await User.find({
      role: "admin",
      status: "active"
    }).select("_id");

    if (admins.length > 0) {
      const notifications =
        admins.map((admin) => ({
          recipient: admin._id,
          type: "ticket-created",
          title: "New Ticket Created",
          message:
            `A new ticket "${ticket.subject}" has been created.`,
          ticket: ticket._id,
          isRead: false
        }));

      await Notification.insertMany(
        notifications
      );
    }

    // ===============================
    // RESPONSE
    // ===============================

    res.status(201).json({
      message:
        "Ticket created successfully",
      ticket
    });

  } catch (error) {
    console.error(
      "Create Ticket Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET MY TICKETS
// Customer Only
// ===============================

export const getMyTickets = async (
  req,
  res
) => {
  try {
    // ===============================
    // VALIDATE CUSTOMER ID
    // ===============================

    if (
      !req.customer?.customerId ||
      !mongoose.Types.ObjectId.isValid(
        req.customer.customerId
      )
    ) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    // ===============================
    // GET TICKETS
    // ===============================

    const tickets =
      await Ticket.find({
        customer:
          req.customer.customerId
      })
        .populate(
          "customer",
          "name email phone company"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .sort({
          createdAt: -1
        });

    res.status(200).json({
      message:
        "Tickets fetched successfully",
      count: tickets.length,
      tickets
    });

  } catch (error) {
    console.error(
      "Get My Tickets Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET MY ASSIGNED TICKETS
// Employee Only
// ===============================

export const getMyAssignedTickets = async (
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
    // GET ASSIGNED TICKETS
    // ===============================

    const tickets =
      await Ticket.find({
        assignedTo:
          req.user.userId
      })
        .populate(
          "customer",
          "name email phone company"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .sort({
          createdAt: -1
        });

    res.status(200).json({
      message:
        "Assigned tickets fetched successfully",
      count: tickets.length,
      tickets
    });

  } catch (error) {
    console.error(
      "Get My Assigned Tickets Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET ALL TICKETS
// Admin / Employee Only
// Search + Filter + Pagination
// Search by Subject + Description +
// Priority + Employee Name + Employee Email
// ===============================

export const getAllTickets = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      status,
      priority,
      assignedTo,
      page = 1,
      limit = 10
    } = req.query;

    // ===============================
    // PAGINATION
    // ===============================

    const currentPage = Math.max(
      parseInt(page, 10) || 1,
      1
    );

    const perPage = Math.min(
      Math.max(
        parseInt(limit, 10) || 10,
        1
      ),
      100
    );

    const skip =
      (currentPage - 1) *
      perPage;

    // ===============================
    // BUILD FILTER
    // ===============================

    const filter = {};

    // ===============================
    // SEARCH
    // Subject + Description + Priority
    // + Employee Name + Employee Email
    // ===============================

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      const searchValue = search.trim();

      const searchRegex = new RegExp(
        escapeRegex(searchValue),
        "i"
      );

      // Find employees matching search text
      const matchingEmployees =
        await User.find({
          role: "employee",
          $or: [
            {
              name: searchRegex
            },
            {
              email: searchRegex
            }
          ]
        }).select("_id");

      const matchingEmployeeIds =
        matchingEmployees.map(
          (employee) => employee._id
        );

      filter.$or = [
        {
          subject: searchRegex
        },
        {
          description: searchRegex
        },
        {
          priority: searchRegex
        }
      ];

      // Add matching employee IDs
      if (
        matchingEmployeeIds.length > 0
      ) {
        filter.$or.push({
          assignedTo: {
            $in: matchingEmployeeIds
          }
        });
      }
    }

    // ===============================
    // STATUS FILTER
    // ===============================

    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid ticket status"
        });
      }

      filter.status = status;
    }

    // ===============================
    // PRIORITY FILTER
    // ===============================

    if (priority !== undefined) {
      if (
        typeof priority !== "string" ||
        !allowedPriorities.includes(
          priority
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid ticket priority"
        });
      }

      filter.priority = priority;
    }

    // ===============================
    // ASSIGNED EMPLOYEE FILTER
    // ===============================

    if (assignedTo !== undefined) {
      if (assignedTo === "unassigned") {
        filter.assignedTo = null;
      } else {
        // Validate employee ID
        if (
          typeof assignedTo !== "string" ||
          !mongoose.Types.ObjectId.isValid(
            assignedTo
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid employee ID"
          });
        }

        const employee =
          await User.findOne({
            _id: assignedTo,
            role: "employee"
          }).select("_id");

        if (!employee) {
          return res.status(400).json({
            message:
              "Employee not found"
          });
        }

        filter.assignedTo =
          assignedTo;
      }
    }

    // ===============================
    // TOTAL COUNT
    // ===============================

    const totalTickets =
      await Ticket.countDocuments(
        filter
      );

    // ===============================
    // GET TICKETS
    // ===============================

    const tickets =
      await Ticket.find(filter)
        .populate(
          "customer",
          "name email phone company"
        )
        .populate(
          "assignedTo",
          "name email role"
        )
        .sort({
          createdAt: -1
        })
        .skip(skip)
        .limit(perPage);

    // ===============================
    // PAGINATION INFO
    // ===============================

    const totalPages =
      Math.ceil(
        totalTickets /
          perPage
      );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "All tickets fetched successfully",

      count: tickets.length,

      pagination: {
        currentPage,
        limit: perPage,
        totalTickets,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1
      },

      filters: {
        search:
          typeof search === "string"
            ? search.trim()
            : "",
        status:
          status || null,
        priority:
          priority || null,
        assignedTo:
          assignedTo || null
      },

      tickets
    });

  } catch (error) {
    console.error(
      "Get All Tickets Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// UPDATE TICKET
// Admin / Employee Only
// ===============================

export const updateTicket = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ===============================
    // VALIDATE TICKET ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid ticket ID"
      });
    }

    const {
      reply,
      status,
      priority,
      assignedTo
    } = req.body || {};

    // ===============================
    // CHECK INPUT TYPES
    // ===============================

    if (
      reply !== undefined &&
      typeof reply !== "string"
    ) {
      return res.status(400).json({
        message:
          "Reply must be a string"
      });
    }

    if (
      status !== undefined &&
      typeof status !== "string"
    ) {
      return res.status(400).json({
        message:
          "Status must be a string"
      });
    }

    if (
      priority !== undefined &&
      typeof priority !== "string"
    ) {
      return res.status(400).json({
        message:
          "Priority must be a string"
      });
    }

    if (
      assignedTo !== undefined &&
      assignedTo !== null &&
      typeof assignedTo !== "string"
    ) {
      return res.status(400).json({
        message:
          "Assigned employee ID is invalid"
      });
    }

    // ===============================
    // FIND TICKET
    // ===============================

    const ticket =
      await Ticket.findById(id);

    if (!ticket) {
      return res.status(404).json({
        message:
          "Ticket not found"
      });
    }

    // ===============================
    // EMPLOYEE PERMISSION CHECK
    // ===============================

    if (
      req.user.role === "employee"
    ) {
      // Ticket not assigned
      if (!ticket.assignedTo) {
        return res.status(403).json({
          message:
            "Access denied. This ticket is not assigned to you."
        });
      }

      // Ticket assigned to another employee
      if (
        ticket.assignedTo.toString() !==
        req.user.userId
      ) {
        return res.status(403).json({
          message:
            "Access denied. This ticket is not assigned to you."
        });
      }

      // Employee cannot reassign
      if (assignedTo !== undefined) {
        return res.status(403).json({
          message:
            "Employees cannot reassign tickets."
        });
      }
    }

    // ===============================
    // SAVE OLD VALUES
    // ===============================

    const oldStatus =
      ticket.status;

    const oldPriority =
      ticket.priority;

    const oldAssignedTo =
      ticket.assignedTo
        ? ticket.assignedTo.toString()
        : null;

    const oldReply =
      ticket.reply;

    // ===============================
    // UPDATE REPLY
    // ===============================

    if (reply !== undefined) {
      const cleanReply =
        reply.trim();

      if (
        cleanReply.length > 5000
      ) {
        return res.status(400).json({
          message:
            "Ticket reply cannot exceed 5000 characters"
        });
      }

      ticket.reply =
        cleanReply;
    }

    // ===============================
    // UPDATE STATUS
    // ===============================

    if (status !== undefined) {
      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid ticket status"
        });
      }

      ticket.status =
        status;
    }

    // ===============================
    // UPDATE PRIORITY
    // ===============================

    if (priority !== undefined) {
      if (
        !allowedPriorities.includes(
          priority
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid ticket priority"
        });
      }

      ticket.priority =
        priority;
    }

    // ===============================
    // UPDATE ASSIGNED EMPLOYEE
    // Admin Only
    // ===============================

    if (assignedTo !== undefined) {
      if (
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message:
            "Only admin can assign tickets."
        });
      }

      // Unassign ticket
      if (assignedTo === null) {
        ticket.assignedTo =
          null;
      } else {
        // Validate employee ID
        if (
          !mongoose.Types.ObjectId.isValid(
            assignedTo
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid employee ID"
          });
        }

        // Check active employee
        const employee =
          await User.findOne({
            _id: assignedTo,
            role: "employee",
            status: "active"
          }).select(
            "_id name email"
          );

        if (!employee) {
          return res.status(400).json({
            message:
              "Invalid or inactive employee"
          });
        }

        ticket.assignedTo =
          assignedTo;
      }
    }

    // ===============================
    // SAVE UPDATED TICKET
    // ===============================

    await ticket.save();

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    const changes = [];

    if (
      status !== undefined &&
      status !== oldStatus
    ) {
      changes.push(
        `status changed from ${oldStatus} to ${status}`
      );
    }

    if (
      priority !== undefined &&
      priority !== oldPriority
    ) {
      changes.push(
        `priority changed from ${oldPriority} to ${priority}`
      );
    }

    if (
      assignedTo !== undefined &&
      String(assignedTo) !==
        oldAssignedTo
    ) {
      if (
        assignedTo === null
      ) {
        changes.push(
          "ticket unassigned"
        );
      } else {
        changes.push(
          `ticket assigned to employee ${assignedTo}`
        );
      }
    }

    if (
      reply !== undefined &&
      reply.trim() !== oldReply
    ) {
      changes.push(
        "reply updated"
      );
    }

    if (
      changes.length === 0
    ) {
      changes.push(
        "ticket updated"
      );
    }

    await ActivityLog.create({
      user: req.user.userId,
      customer: ticket.customer,
      action: "update",
      entityType: "ticket",
      entityId: ticket._id,
      description:
        `Updated ticket ${ticket.subject}: ${changes.join(
          ", "
        )}`
    });

    // ===============================
    // FETCH UPDATED TICKET
    // ===============================

    const updatedTicket =
      await Ticket.findById(
        ticket._id
      )
        .populate(
          "customer",
          "name email phone company"
        )
        .populate(
          "assignedTo",
          "name email role"
        );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Ticket updated successfully",
      ticket: updatedTicket
    });

  } catch (error) {
    console.error(
      "Update Ticket Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};