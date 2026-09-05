import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import ActivityLog from "../models/ActivityLog.js";

// ===============================
// HELPERS
// ===============================

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const escapeRegex = (value) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

// ===============================
// CREATE EMPLOYEE
// Admin Only
// ===============================

export const createEmployee = async (
  req,
  res
) => {
  try {
    const {
      name,
      email,
      password
    } = req.body || {};

    // ===============================
    // INPUT TYPE VALIDATION
    // ===============================

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required"
      });
    }

    const cleanName =
      name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    // ===============================
    // REQUIRED VALIDATION
    // ===============================

    if (
      !cleanName ||
      !cleanEmail ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Name, email and password are required"
      });
    }

    // ===============================
    // NAME VALIDATION
    // ===============================

    if (cleanName.length < 2) {
      return res.status(400).json({
        message:
          "Employee name must be at least 2 characters"
      });
    }

    if (cleanName.length > 100) {
      return res.status(400).json({
        message:
          "Employee name cannot exceed 100 characters"
      });
    }

    // ===============================
    // EMAIL VALIDATION
    // ===============================

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        message:
          "Please enter a valid email address"
      });
    }

    if (cleanEmail.length > 254) {
      return res.status(400).json({
        message:
          "Employee email cannot exceed 254 characters"
      });
    }

    // ===============================
    // PASSWORD VALIDATION
    // ===============================

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters"
      });
    }

    // ===============================
    // CHECK EXISTING USER
    // ===============================

    const existingUser =
      await User.findOne({
        email: cleanEmail
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "User already exists with this email"
      });
    }

    // ===============================
    // HASH PASSWORD
    // ===============================

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    // ===============================
    // CREATE EMPLOYEE
    // ===============================

    const employee =
      await User.create({
        name: cleanName,
        email: cleanEmail,
        password: hashedPassword,
        role: "employee",
        status: "active"
      });

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      action: "create",
      entityType: "employee",
      entityId: employee._id,
      description:
        `Created employee ${employee.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(201).json({
      message:
        "Employee created successfully",

      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        createdAt:
          employee.createdAt
      }
    });

  } catch (error) {
    console.error(
      "Create Employee Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET ALL EMPLOYEES
// Admin Only
// Search + Filter + Pagination
// Search by Employee ID + Name + Email
// ===============================

export const getAllEmployees = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      status,
      page = 1,
      limit = 10
    } = req.query;

    // ===============================
    // PAGINATION VALUES
    // ===============================

    const currentPage =
      Math.max(
        parseInt(page, 10) || 1,
        1
      );

    const perPage =
      Math.min(
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

    const filter = {
      role: "employee"
    };

    // ===============================
    // SEARCH BY ID / NAME / EMAIL
    // ===============================

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      const searchValue =
        search.trim();

      const searchRegex =
        new RegExp(
          escapeRegex(searchValue),
          "i"
        );

      const searchConditions = [
        {
          name: searchRegex
        },
        {
          email: searchRegex
        }
      ];

      // Search by MongoDB Employee ID
      if (
        mongoose.Types.ObjectId.isValid(
          searchValue
        )
      ) {
        searchConditions.push({
          _id: searchValue
        });
      }

      filter.$or =
        searchConditions;
    }

    // ===============================
    // FILTER BY STATUS
    // ===============================

    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !["active", "inactive"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid employee status"
        });
      }

      filter.status = status;
    }

    // ===============================
    // GET TOTAL COUNT
    // ===============================

    const totalEmployees =
      await User.countDocuments(
        filter
      );

    // ===============================
    // GET EMPLOYEES
    // ===============================

    const employees =
      await User.find(filter)
        .select(
          "-password -refreshToken -refreshTokenExpiresAt -__v"
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
        totalEmployees /
        perPage
      );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Employees fetched successfully",

      count:
        employees.length,

      pagination: {
        currentPage,
        limit: perPage,
        totalEmployees,
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
          status || null
      },

      employees
    });

  } catch (error) {
    console.error(
      "Get All Employees Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET EMPLOYEE BY ID
// Admin Only
// ===============================

export const getEmployeeById = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    // ===============================
    // VALIDATE MONGODB OBJECT ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid employee ID"
      });
    }

    // ===============================
    // FIND EMPLOYEE
    // ===============================

    const employee =
      await User.findOne({
        _id: id,
        role: "employee"
      })
        .select(
          "-password -refreshToken -refreshTokenExpiresAt -__v"
        );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found"
      });
    }

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Employee fetched successfully",
      employee
    });

  } catch (error) {
    console.error(
      "Get Employee Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// UPDATE EMPLOYEE
// Admin Only
// ===============================

export const updateEmployee = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    // ===============================
    // VALIDATE MONGODB OBJECT ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid employee ID"
      });
    }

    const {
      name,
      email,
      password,
      status
    } = req.body || {};

    // ===============================
    // FIND EMPLOYEE
    // ===============================

    const employee =
      await User.findOne({
        _id: id,
        role: "employee"
      });

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found"
      });
    }

    // ===============================
    // UPDATE NAME
    // ===============================

    if (name !== undefined) {
      if (
        typeof name !== "string"
      ) {
        return res.status(400).json({
          message:
            "Employee name must be a string"
        });
      }

      const cleanName =
        name.trim();

      if (!cleanName) {
        return res.status(400).json({
          message:
            "Employee name cannot be empty"
        });
      }

      if (cleanName.length < 2) {
        return res.status(400).json({
          message:
            "Employee name must be at least 2 characters"
        });
      }

      if (cleanName.length > 100) {
        return res.status(400).json({
          message:
            "Employee name cannot exceed 100 characters"
        });
      }

      employee.name =
        cleanName;
    }

    // ===============================
    // UPDATE EMAIL
    // ===============================

    if (email !== undefined) {
      if (
        typeof email !== "string"
      ) {
        return res.status(400).json({
          message:
            "Employee email must be a string"
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          message:
            "Employee email cannot be empty"
        });
      }

      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({
          message:
            "Please enter a valid email address"
        });
      }

      if (cleanEmail.length > 254) {
        return res.status(400).json({
          message:
            "Employee email cannot exceed 254 characters"
        });
      }

      const existingUser =
        await User.findOne({
          email: cleanEmail,
          _id: {
            $ne: id
          }
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "Email already exists"
        });
      }

      employee.email =
        cleanEmail;
    }

    // ===============================
    // UPDATE PASSWORD
    // ===============================

    if (password !== undefined) {
      if (
        typeof password !== "string"
      ) {
        return res.status(400).json({
          message:
            "Password must be a string"
        });
      }

      if (!password) {
        return res.status(400).json({
          message:
            "Password cannot be empty"
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message:
            "Password must be at least 6 characters"
        });
      }

      employee.password =
        await bcrypt.hash(
          password,
          10
        );
    }

    // ===============================
    // UPDATE STATUS
    // ===============================

    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !["active", "inactive"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid employee status"
        });
      }

      employee.status =
        status;
    }

    // ===============================
    // SAVE EMPLOYEE
    // ===============================

    await employee.save();

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      action: "update",
      entityType: "employee",
      entityId: employee._id,
      description:
        `Updated employee ${employee.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Employee updated successfully",

      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
        updatedAt:
          employee.updatedAt
      }
    });

  } catch (error) {
    console.error(
      "Update Employee Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// ACTIVATE EMPLOYEE
// Admin Only
// ===============================

export const activateEmployee = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    // ===============================
    // VALIDATE MONGODB OBJECT ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid employee ID"
      });
    }

    // ===============================
    // ACTIVATE EMPLOYEE
    // ===============================

    const employee =
      await User.findOneAndUpdate(
        {
          _id: id,
          role: "employee"
        },
        {
          status: "active"
        },
        {
          new: true,
          runValidators: true
        }
      )
        .select(
          "-password -refreshToken -refreshTokenExpiresAt -__v"
        );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found"
      });
    }

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      action: "activate",
      entityType: "employee",
      entityId: employee._id,
      description:
        `Activated employee ${employee.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Employee activated successfully",
      employee
    });

  } catch (error) {
    console.error(
      "Activate Employee Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// DEACTIVATE EMPLOYEE
// Admin Only
// ===============================

export const deactivateEmployee = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    // ===============================
    // VALIDATE MONGODB OBJECT ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid employee ID"
      });
    }

    // ===============================
    // DEACTIVATE EMPLOYEE
    // ===============================

    const employee =
      await User.findOneAndUpdate(
        {
          _id: id,
          role: "employee"
        },
        {
          status: "inactive"
        },
        {
          new: true,
          runValidators: true
        }
      )
        .select(
          "-password -refreshToken -refreshTokenExpiresAt -__v"
        );

    if (!employee) {
      return res.status(404).json({
        message:
          "Employee not found"
      });
    }

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      action: "deactivate",
      entityType: "employee",
      entityId: employee._id,
      description:
        `Deactivated employee ${employee.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Employee deactivated successfully",
      employee
    });

  } catch (error) {
    console.error(
      "Deactivate Employee Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};