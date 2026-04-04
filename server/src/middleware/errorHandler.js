const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * Global error handler — catches everything.
 * Placed as the LAST middleware in app.js.
 */
const errorHandler = (err, _req, res, _next) => {
  // Log the error
  logger.error(err.message, { stack: err.stack });

  // If it's our custom ApiError, use its status code
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Prisma known errors
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
      errors: [],
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
      errors: [],
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
      errors: [],
    });
  }

  // Unknown errors — don't leak internals in production
  const message =
    process.env.NODE_ENV === "development"
      ? err.message
      : "Something went wrong";

  return res.status(500).json({
    success: false,
    message,
    errors: [],
  });
};

module.exports = errorHandler;
