const errorMiddleware = (err, req, res, next) => {
  // ===============================
  // LOG ERROR
  // ===============================

  console.error(
    "Global Error:",
    err.message
  );

  // ===============================
  // HEADERS ALREADY SENT
  // ===============================

  if (res.headersSent) {
    return next(err);
  }

  // ===============================
  // MONGOOSE DUPLICATE KEY ERROR
  // ===============================

  if (err.code === 11000) {
    const duplicateField = Object.keys(
      err.keyPattern || {}
    )[0];

    return res.status(409).json({
      message: duplicateField
        ? `${duplicateField} already exists`
        : "Duplicate value already exists"
    });
  }

  // ===============================
  // MONGOOSE VALIDATION ERROR
  // ===============================

  if (
    err.name === "ValidationError"
  ) {
    const messages = Object.values(
      err.errors || {}
    ).map(
      (validationError) =>
        validationError.message
    );

    return res.status(400).json({
      message:
        messages.length > 0
          ? messages.join(", ")
          : "Validation failed"
    });
  }

  // ===============================
  // MONGOOSE CAST ERROR
  // ===============================

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid request data"
    });
  }

  // ===============================
  // INVALID JSON BODY
  // ===============================

  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  // ===============================
  // STATUS CODE
  // ===============================

  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode < 600
      ? err.statusCode
      : 500;

  // ===============================
  // SAFE ERROR MESSAGE
  // ===============================

  const message =
    statusCode === 500
      ? "Server error"
      : err.message ||
        "Request failed";

  // ===============================
  // RESPONSE
  // ===============================

  return res.status(statusCode).json({
    message
  });
};

export default errorMiddleware;