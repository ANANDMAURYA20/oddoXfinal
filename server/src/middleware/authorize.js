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

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        `Role '${req.user.role}' is not authorized to access this resource`
      );
    }

    next();
  };
};

module.exports = authorize;
