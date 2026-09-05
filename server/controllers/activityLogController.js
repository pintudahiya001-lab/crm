import mongoose from "mongoose";
import ActivityLog from "../models/ActivityLog.js";

// ===============================
// GET ALL ACTIVITY LOGS
// Admin Only
// Search + Filters + Date Range + Pagination
// ===============================

export const getAllActivityLogs = async (req, res) => {
  try {
    const {
      search = "",
      action = "",
      entityType = "",
      userId = "",
      dateFrom = "",
      dateTo = "",
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

    const skip = (currentPage - 1) * perPage;

    // ===============================
    // BUILD FILTER
    // ===============================

    const filter = {};

    // ===============================
    // SEARCH FILTER
    // Action + Description + Entity
    // ===============================

    if (search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        "i"
      );

      filter.$or = [
        {
          action: searchRegex
        },
        {
          description: searchRegex
        },
        {
          entityType: searchRegex
        }
      ];
    }

    // ===============================
    // ACTION FILTER
    // Case-Insensitive
    // ===============================

    if (action.trim()) {
      const actionRegex = new RegExp(
        `^${escapeRegex(action.trim())}$`,
        "i"
      );

      filter.action = actionRegex;
    }

    // ===============================
    // ENTITY TYPE FILTER
    // Case-Insensitive
    // ===============================

    if (entityType.trim()) {
      const entityRegex = new RegExp(
        `^${escapeRegex(entityType.trim())}$`,
        "i"
      );

      filter.entityType = entityRegex;
    }

    // ===============================
    // USER FILTER
    // ===============================

    if (userId.trim()) {
      if (
        !mongoose.Types.ObjectId.isValid(
          userId.trim()
        )
      ) {
        return res.status(400).json({
          message: "Invalid user ID"
        });
      }

      filter.user = userId.trim();
    }

    // ===============================
    // DATE FROM FILTER
    // ===============================

    if (dateFrom.trim()) {
      const fromDate = new Date(
        `${dateFrom.trim()}T00:00:00.000Z`
      );

      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({
          message: "Invalid dateFrom"
        });
      }

      filter.createdAt = {
        ...(filter.createdAt || {}),
        $gte: fromDate
      };
    }

    // ===============================
    // DATE TO FILTER
    // ===============================

    if (dateTo.trim()) {
      const toDate = new Date(
        `${dateTo.trim()}T23:59:59.999Z`
      );

      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({
          message: "Invalid dateTo"
        });
      }

      filter.createdAt = {
        ...(filter.createdAt || {}),
        $lte: toDate
      };
    }

    // ===============================
    // DATE RANGE VALIDATION
    // ===============================

    if (
      dateFrom.trim() &&
      dateTo.trim()
    ) {
      const fromDate = new Date(
        `${dateFrom.trim()}T00:00:00.000Z`
      );

      const toDate = new Date(
        `${dateTo.trim()}T23:59:59.999Z`
      );

      if (fromDate > toDate) {
        return res.status(400).json({
          message:
            "dateFrom cannot be greater than dateTo"
        });
      }
    }

    // ===============================
    // TOTAL LOGS
    // ===============================

    const totalLogs =
      await ActivityLog.countDocuments(
        filter
      );

    // ===============================
    // FETCH LOGS
    // ===============================

    const logs = await ActivityLog.find(filter)
      .populate(
        "user",
        "name email role"
      )
      .populate(
        "customer",
        "name email"
      )
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(perPage);

    // ===============================
    // TOTAL PAGES
    // ===============================

    const totalPages = Math.ceil(
      totalLogs / perPage
    );

    // ===============================
    // RESPONSE
    // ===============================

    res.status(200).json({
      message:
        "Activity logs fetched successfully",

      count: logs.length,

      pagination: {
        currentPage,
        limit: perPage,
        totalLogs,
        totalPages,
        hasNextPage:
          currentPage < totalPages,
        hasPreviousPage:
          currentPage > 1
      },

      filters: {
        search: search.trim(),
        action: action.trim(),
        entityType: entityType.trim(),
        userId: userId.trim(),
        dateFrom: dateFrom.trim(),
        dateTo: dateTo.trim()
      },

      logs
    });

  } catch (error) {
    console.error(
      "Get Activity Logs Error:",
      error.message
    );

    res.status(500).json({
      message: "Server error"
    });
  }
};

// ===============================
// ESCAPE REGEX SPECIAL CHARACTERS
// ===============================

function escapeRegex(value) {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}