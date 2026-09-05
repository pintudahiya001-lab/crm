import express from "express";

import {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicket,
  getMyAssignedTickets,
} from "../controllers/ticketController.js";

import customerAuthMiddleware from "../middleware/customerAuthMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ===============================
// CREATE TICKET
// Customer Login Required
// ===============================

router.post(
  "/",
  customerAuthMiddleware,
  createTicket
);

// ===============================
// GET MY TICKETS
// Customer Login Required
// ===============================

router.get(
  "/my-tickets",
  customerAuthMiddleware,
  getMyTickets
);

// ===============================
// GET MY ASSIGNED TICKETS
// Employee Only
// ===============================

router.get(
  "/my-assigned",
  authMiddleware,
  roleMiddleware(["employee"]),
  getMyAssignedTickets
);

// ===============================
// GET ALL TICKETS
// Admin / Employee Only
// ===============================

router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "employee"]),
  getAllTickets
);

// ===============================
// GET ALL TICKETS
// Alternative /all endpoint
// Admin / Employee Only
// ===============================

router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin", "employee"]),
  getAllTickets
);

// ===============================
// UPDATE TICKET
// Admin / Employee Only
// ===============================

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "employee"]),
  updateTicket
);

export default router;