const ApiError = require("../utils/ApiError");

/**
 * Role-based authorization middleware.
 * Usage: authorize("SUPER_ADMIN", "TENANT_ADMIN")
 *
 * Must be placed AFTER auth middleware (requires req.user).
 */
const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized("Authentication required");
    }

    if (req.user.role === "SUPER_ADMIN" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    next();
  };
};

module.exports = authorize;
