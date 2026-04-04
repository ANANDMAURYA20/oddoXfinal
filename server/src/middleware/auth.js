const jwt = require("jsonwebtoken");
const env = require("../config/env");
const prisma = require("../config/db");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Verifies JWT from Authorization header.
 * Attaches full user object (with role & tenantId) to req.user.
 */
const auth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Access token is missing");
  }

  const token = header.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      tenantId: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("User account is deactivated or not found");
  }

  req.user = user;
  next();
});

module.exports = auth;
