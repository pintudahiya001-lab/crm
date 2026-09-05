import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
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
// CREATE CUSTOMER
// Admin + Employee
// ===============================

export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      company,
      address,
      status
    } = req.body || {};

    // ===============================
    // INPUT TYPE VALIDATION
    // ===============================

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof phone !== "string"
    ) {
      return res.status(400).json({
        message:
          "Name, email, password and phone are required"
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // ===============================
    // REQUIRED VALUE VALIDATION
    // ===============================

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !cleanPhone
    ) {
      return res.status(400).json({
        message:
          "Name, email, password and phone are required"
      });
    }

    // ===============================
    // NAME VALIDATION
    // ===============================

    if (cleanName.length < 2) {
      return res.status(400).json({
        message:
          "Customer name must be at least 2 characters"
      });
    }

    if (cleanName.length > 100) {
      return res.status(400).json({
        message:
          "Customer name cannot exceed 100 characters"
      });
    }

    // ===============================
    // EMAIL VALIDATION
    // ===============================

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    if (cleanEmail.length > 254) {
      return res.status(400).json({
        message:
          "Customer email cannot exceed 254 characters"
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
    // PHONE VALIDATION
    // ===============================

    if (cleanPhone.length < 7) {
      return res.status(400).json({
        message: "Phone number is too short"
      });
    }

    if (cleanPhone.length > 20) {
      return res.status(400).json({
        message:
          "Phone number cannot exceed 20 characters"
      });
    }

    // ===============================
    // OPTIONAL FIELD VALIDATION
    // ===============================

    const cleanCompany =
      typeof company === "string"
        ? company.trim()
        : undefined;

    const cleanAddress =
      typeof address === "string"
        ? address.trim()
        : undefined;

    if (
      cleanCompany &&
      cleanCompany.length > 150
    ) {
      return res.status(400).json({
        message:
          "Company name cannot exceed 150 characters"
      });
    }

    if (
      cleanAddress &&
      cleanAddress.length > 500
    ) {
      return res.status(400).json({
        message:
          "Address cannot exceed 500 characters"
      });
    }

    // ===============================
    // STATUS VALIDATION
    // ===============================

    const customerStatus =
      status === undefined ||
      status === null ||
      status === ""
        ? "active"
        : status;

    if (
      !["active", "inactive"].includes(
        customerStatus
      )
    ) {
      return res.status(400).json({
        message: "Invalid customer status"
      });
    }

    // ===============================
    // CHECK EXISTING CUSTOMER
    // ===============================

    const existingCustomer =
      await Customer.findOne({
        email: cleanEmail
      });

    if (existingCustomer) {
      return res.status(409).json({
        message:
          "Customer already exists with this email"
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
    // CREATE CUSTOMER
    // createdBy comes from authenticated user
    // ===============================

    const customer = await Customer.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      phone: cleanPhone,
      company: cleanCompany,
      address: cleanAddress,
      status: customerStatus,
      createdBy: req.user.userId
    });

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      customer: customer._id,
      action: "create",
      entityType: "customer",
      entityId: customer._id,
      description:
        `Created customer ${customer.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(201).json({
      message:
        "Customer created successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        status: customer.status,
        createdBy: customer.createdBy
      }
    });

  } catch (error) {
    console.error(
      "Create Customer Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET ALL CUSTOMERS
// Admin + Employee
// Search + Filter + Pagination
// ===============================

export const getAllCustomers = async (req, res) => {
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
      (currentPage - 1) * perPage;

    // ===============================
    // BUILD FILTER
    // ===============================

    const filter = {};

    // ===============================
    // SEARCH
    // ===============================

    const cleanSearch =
      typeof search === "string"
        ? search.trim()
        : "";

    if (cleanSearch) {
      const searchRegex =
        new RegExp(
          escapeRegex(cleanSearch),
          "i"
        );

      filter.$or = [
        {
          name: searchRegex
        },
        {
          email: searchRegex
        },
        {
          phone: searchRegex
        },
        {
          company: searchRegex
        }
      ];
    }

    // ===============================
    // STATUS FILTER
    // ===============================

    if (status !== undefined) {
      if (
        !["active", "inactive"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid customer status"
        });
      }

      filter.status = status;
    }

    // ===============================
    // TOTAL COUNT
    // ===============================

    const totalCustomers =
      await Customer.countDocuments(
        filter
      );

    // ===============================
    // GET CUSTOMERS
    // ===============================

    const customers =
      await Customer.find(filter)
        .select(
          "-password -__v"
        )
        .populate(
          "createdBy",
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
        totalCustomers /
          perPage
      );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Customers fetched successfully",

      count: customers.length,

      pagination: {
        currentPage,
        limit: perPage,
        totalCustomers,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1
      },

      filters: {
        search: cleanSearch,
        status:
          status || null
      },

      customers
    });

  } catch (error) {
    console.error(
      "Get All Customers Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET CUSTOMER BY ID
// Admin + Employee
// ===============================

export const getCustomerById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ===============================
    // VALIDATE MONGODB ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid customer ID"
      });
    }

    // ===============================
    // FIND CUSTOMER
    // ===============================

    const customer =
      await Customer.findById(id)
        .select(
          "-password -__v"
        )
        .populate(
          "createdBy",
          "name email role"
        );

    if (!customer) {
      return res.status(404).json({
        message:
          "Customer not found"
      });
    }

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Customer fetched successfully",
      customer
    });

  } catch (error) {
    console.error(
      "Get Customer Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// UPDATE CUSTOMER
// Admin + Employee
// ===============================

export const updateCustomer = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ===============================
    // VALIDATE MONGODB ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid customer ID"
      });
    }

    const {
      name,
      email,
      password,
      phone,
      company,
      address,
      status
    } = req.body || {};

    // ===============================
    // FIND CUSTOMER
    // ===============================

    const customer =
      await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        message:
          "Customer not found"
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
            "Customer name must be a string"
        });
      }

      const cleanName =
        name.trim();

      if (!cleanName) {
        return res.status(400).json({
          message:
            "Customer name cannot be empty"
        });
      }

      if (cleanName.length < 2) {
        return res.status(400).json({
          message:
            "Customer name must be at least 2 characters"
        });
      }

      if (cleanName.length > 100) {
        return res.status(400).json({
          message:
            "Customer name cannot exceed 100 characters"
        });
      }

      customer.name =
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
            "Customer email must be a string"
        });
      }

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          message:
            "Customer email cannot be empty"
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
            "Customer email cannot exceed 254 characters"
        });
      }

      const existingCustomer =
        await Customer.findOne({
          email: cleanEmail,
          _id: {
            $ne: id
          }
        });

      if (existingCustomer) {
        return res.status(409).json({
          message:
            "Email already exists"
        });
      }

      customer.email =
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

      customer.password =
        await bcrypt.hash(
          password,
          10
        );
    }

    // ===============================
    // UPDATE PHONE
    // ===============================

    if (phone !== undefined) {
      if (
        typeof phone !== "string"
      ) {
        return res.status(400).json({
          message:
            "Phone number must be a string"
        });
      }

      const cleanPhone =
        phone.trim();

      if (!cleanPhone) {
        return res.status(400).json({
          message:
            "Phone number cannot be empty"
        });
      }

      if (cleanPhone.length < 7) {
        return res.status(400).json({
          message:
            "Phone number is too short"
        });
      }

      if (cleanPhone.length > 20) {
        return res.status(400).json({
          message:
            "Phone number cannot exceed 20 characters"
        });
      }

      customer.phone =
        cleanPhone;
    }

    // ===============================
    // UPDATE COMPANY
    // ===============================

    if (company !== undefined) {
      if (
        typeof company !== "string"
      ) {
        return res.status(400).json({
          message:
            "Company must be a string"
        });
      }

      const cleanCompany =
        company.trim();

      if (
        cleanCompany.length > 150
      ) {
        return res.status(400).json({
          message:
            "Company name cannot exceed 150 characters"
        });
      }

      customer.company =
        cleanCompany;
    }

    // ===============================
    // UPDATE ADDRESS
    // ===============================

    if (address !== undefined) {
      if (
        typeof address !== "string"
      ) {
        return res.status(400).json({
          message:
            "Address must be a string"
        });
      }

      const cleanAddress =
        address.trim();

      if (
        cleanAddress.length > 500
      ) {
        return res.status(400).json({
          message:
            "Address cannot exceed 500 characters"
        });
      }

      customer.address =
        cleanAddress;
    }

    // ===============================
    // UPDATE STATUS
    // ===============================

    if (status !== undefined) {
      if (
        !["active", "inactive"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid customer status"
        });
      }

      customer.status =
        status;
    }

    // ===============================
    // SAVE CUSTOMER
    // ===============================

    await customer.save();

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      customer: customer._id,
      action: "update",
      entityType: "customer",
      entityId: customer._id,
      description:
        `Updated customer ${customer.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Customer updated successfully",

      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        status: customer.status,
        createdBy: customer.createdBy,
        updatedAt:
          customer.updatedAt
      }
    });

  } catch (error) {
    console.error(
      "Update Customer Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// ACTIVATE CUSTOMER
// Admin + Employee
// ===============================

export const activateCustomer = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ===============================
    // VALIDATE MONGODB ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid customer ID"
      });
    }

    // ===============================
    // ACTIVATE CUSTOMER
    // ===============================

    const customer =
      await Customer.findByIdAndUpdate(
        id,
        {
          status: "active"
        },
        {
          new: true,
          runValidators: true
        }
      )
        .select(
          "-password -__v"
        );

    if (!customer) {
      return res.status(404).json({
        message:
          "Customer not found"
      });
    }

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      customer: customer._id,
      action: "activate",
      entityType: "customer",
      entityId: customer._id,
      description:
        `Activated customer ${customer.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Customer activated successfully",
      customer
    });

  } catch (error) {
    console.error(
      "Activate Customer Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// DEACTIVATE CUSTOMER
// Admin + Employee
// ===============================

export const deactivateCustomer = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    // ===============================
    // VALIDATE MONGODB ID
    // ===============================

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          "Invalid customer ID"
      });
    }

    // ===============================
    // DEACTIVATE CUSTOMER
    // ===============================

    const customer =
      await Customer.findByIdAndUpdate(
        id,
        {
          status: "inactive"
        },
        {
          new: true,
          runValidators: true
        }
      )
        .select(
          "-password -__v"
        );

    if (!customer) {
      return res.status(404).json({
        message:
          "Customer not found"
      });
    }

    // ===============================
    // CREATE ACTIVITY LOG
    // ===============================

    await ActivityLog.create({
      user: req.user.userId,
      customer: customer._id,
      action: "deactivate",
      entityType: "customer",
      entityId: customer._id,
      description:
        `Deactivated customer ${customer.name}`
    });

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Customer deactivated successfully",
      customer
    });

  } catch (error) {
    console.error(
      "Deactivate Customer Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// CUSTOMER LOGIN
// ===============================

export const loginCustomer = async (
  req,
  res
) => {
  try {
    // ===============================
    // CHECK JWT SECRET
    // ===============================

    if (!process.env.JWT_SECRET) {
      console.error(
        "Customer Login Error: JWT_SECRET is not configured"
      );

      return res.status(500).json({
        message:
          "Server configuration error"
      });
    }

    const {
      email,
      password
    } = req.body || {};

    // ===============================
    // INPUT TYPE VALIDATION
    // ===============================

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message:
          "Email and password are required"
      });
    }

    const cleanEmail =
      email.trim().toLowerCase();

    if (
      !cleanEmail ||
      !password
    ) {
      return res.status(400).json({
        message:
          "Email and password are required"
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

    // ===============================
    // FIND CUSTOMER
    // ===============================

    const customer =
      await Customer.findOne({
        email: cleanEmail
      });

    if (!customer) {
      return res.status(401).json({
        message:
          "Invalid email or password"
      });
    }

    // ===============================
    // CHECK PASSWORD
    // ===============================

    const isPasswordMatch =
      await bcrypt.compare(
        password,
        customer.password
      );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message:
          "Invalid email or password"
      });
    }

    // ===============================
    // CHECK CUSTOMER STATUS
    // ===============================

    if (
      customer.status !== "active"
    ) {
      return res.status(403).json({
        message:
          "Your account is inactive. Please contact support."
      });
    }

    // ===============================
    // CREATE CUSTOMER TOKEN
    // ===============================

    const token = jwt.sign(
      {
        customerId:
          customer._id.toString(),
        role: "customer"
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Customer login successful",

      token,

      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        address: customer.address,
        status: customer.status
      }
    });

  } catch (error) {
    console.error(
      "Customer Login Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// GET CUSTOMER PROFILE
// ===============================

export const getCustomerProfile = async (
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
        message:
          "Unauthorized"
      });
    }

    // ===============================
    // FIND CUSTOMER
    // ===============================

    const customer =
      await Customer.findById(
        req.customer.customerId
      ).select(
        "-password -__v"
      );

    if (!customer) {
      return res.status(404).json({
        message:
          "Customer not found"
      });
    }

    // ===============================
    // CHECK CUSTOMER STATUS
    // ===============================

    if (
      customer.status !== "active"
    ) {
      return res.status(403).json({
        message:
          "Your account is inactive. Please contact support."
      });
    }

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Customer profile fetched successfully",
      customer
    });

  } catch (error) {
    console.error(
      "Customer Profile Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};