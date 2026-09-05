import express from "express";

import {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  activateEmployee,
  deactivateEmployee
} from "../controllers/employeeController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();


// ===============================
// ALL ROUTES ADMIN ONLY
// ===============================

router.use(
  authMiddleware,
  roleMiddleware(["admin"])
);


// CREATE EMPLOYEE
router.post(
  "/",
  createEmployee
);


// GET ALL EMPLOYEES
router.get(
  "/",
  getAllEmployees
);


// GET EMPLOYEE BY ID
router.get(
  "/:id",
  getEmployeeById
);


// UPDATE EMPLOYEE
router.put(
  "/:id",
  updateEmployee
);


// ACTIVATE EMPLOYEE
router.patch(
  "/:id/activate",
  activateEmployee
);


// DEACTIVATE EMPLOYEE
router.patch(
  "/:id/deactivate",
  deactivateEmployee
);


export default router;