const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");

/**
 * Register a new tenant + admin user.
 * Creates: Tenant → User (TENANT_ADMIN) → Default Settings
 */
const register = async ({ name, email, password, businessName, phone }) => {
  // Check if email already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Transaction: create tenant + user + default settings atomically
  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: businessName,
        email,
        phone,
      },
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "TENANT_ADMIN",
        tenantId: tenant.id,
      },
    });

    // Create default settings for this tenant
    await tx.settings.create({
      data: {
        tenantId: tenant.id,
        storeName: businessName,
      },
    });

    return { user, tenant };
  });

  const token = generateToken(result.user);

  return {
    token,
    user: sanitizeUser(result.user),
    tenant: { id: result.tenant.id, name: result.tenant.name },
    onboardingCompleted: false,
  };
};

/**
 * Login with email + password.
 */
const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      tenant: {
        select: { id: true, name: true, isActive: true, settings: { select: { onboardingCompleted: true } } },
      },
    },
  });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  if (!user.isActive) {
    throw ApiError.forbidden("Your account has been deactivated");
  }

  // If user belongs to a tenant, check tenant is active
  if (user.tenant && !user.tenant.isActive) {
    throw ApiError.forbidden("Your organization has been deactivated");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = generateToken(user);

  const onboardingCompleted = user.tenant?.settings?.onboardingCompleted ?? true;

  return {
    token,
    user: sanitizeUser(user),
    tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name } : null,
    onboardingCompleted,
  };
};

/**
 * Get current user profile.
 */
const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenant: { select: { id: true, name: true, plan: true } } },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return { user: sanitizeUser(user), tenant: user.tenant };
};

/**
 * Change password.
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw ApiError.badRequest("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
};

// ── Helpers ──────────────────────────────────────

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, tenantId: user.tenantId },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

module.exports = { register, login, getMe, changePassword };
