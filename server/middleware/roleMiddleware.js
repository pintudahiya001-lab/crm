const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // ===============================
    // VALIDATE ALLOWED ROLES
    // ===============================

    if (
      !Array.isArray(allowedRoles) ||
      allowedRoles.length === 0
    ) {
      return res.status(500).json({
        message: "Role configuration error"
      });
    }

    // ===============================
    // CHECK AUTHENTICATED USER
    // ===============================

    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    // ===============================
    // CHECK USER ROLE
    // ===============================

    if (
      typeof req.user.role !== "string" ||
      !req.user.role.trim()
    ) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    // ===============================
    // CHECK ROLE PERMISSION
    // Exact Match
    // ===============================

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message:
          "Access denied. You do not have permission."
      });
    }

    // ===============================
    // ACCESS GRANTED
    // ===============================

    next();
  };
};

export default roleMiddleware;