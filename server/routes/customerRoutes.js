import express from "express";

import {
  createCustomer,
  loginCustomer,
  getCustomerProfile,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  activateCustomer,
  deactivateCustomer
} from "../controllers/customerController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import customerAuthMiddleware from "../middleware/customerAuthMiddleware.js";

import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

// ===============================
// CUSTOMER LOGIN
// Public
// ===============================

router.post(
  "/login",
  loginCustomer
);

// ===============================
// CUSTOMER PROFILE
// Customer Login Required
// ===============================

router.get(
  "/profile",
  customerAuthMiddleware,
  getCustomerProfile
);

// ===============================
// ADMIN / EMPLOYEE CUSTOMER MANAGEMENT
// ===============================

router.use(
  authMiddleware,
  roleMiddleware(["admin", "employee"])
);

// ===============================
// CREATE CUSTOMER
// Admin / Employee
// ===============================

router.post(
  "/",
  createCustomer
);

// ===============================
// GET ALL CUSTOMERS
// Admin / Employee
// ===============================

router.get(
  "/",
  getAllCustomers
);

// ===============================
// GET CUSTOMER BY ID
// Admin / Employee
// ===============================

router.get(
  "/:id",
  getCustomerById
);

// ===============================
// UPDATE CUSTOMER
// Admin / Employee
// ===============================

router.put(
  "/:id",
  updateCustomer
);

// ===============================
// ACTIVATE CUSTOMER
// Admin / Employee
// ===============================

router.patch(
  "/:id/activate",
  activateCustomer
);

// ===============================
// DEACTIVATE CUSTOMER
// Admin / Employee
// ===============================

router.patch(
  "/:id/deactivate",
  deactivateCustomer
);

export default router;