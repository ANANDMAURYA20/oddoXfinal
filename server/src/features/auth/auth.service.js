const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../../config/db");
const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const { sendOtpEmail } = require("../../utils/mail.service");

/**
 * Register a new tenant + admin user.
 * Creates: Tenant → User (TENANT_ADMIN) → Default Settings
 */
const register = async ({ name, email, password, businessName, phone, otpCode }) => {
  // Verify OTP first
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      code: otpCode,
      type: "SIGNUP",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw ApiError.badRequest("Invalid or expired verification code");
  }

  // Check if email already taken (redundant but safe)
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

  // Delete the OTP once verified and registration is complete
  await prisma.otp.deleteMany({
    where: { email, type: "SIGNUP" },
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
 * Request OTP for SIGNUP or FORGOT_PASSWORD
 */
const requestOTP = async ({ email, type }) => {
  // If signup, check if email exists
  if (type === "SIGNUP") {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw ApiError.conflict("Email is already registered");
    }
  } else if (type === "FORGOT_PASSWORD") {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      throw ApiError.notFound("Email not found");
    }
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Upsert OTP
  await prisma.otp.create({
    data: {
      email,
      code: otp,
      type,
      expiresAt,
    },
  });

  // Send Email
  await sendOtpEmail(email, otp, type);

  return { message: "OTP sent successfully" };
};

/**
 * Reset password using OTP
 */
const resetPassword = async ({ email, otp, newPassword }) => {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      email,
      code: otp,
      type: "FORGOT_PASSWORD",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    throw ApiError.badRequest("Invalid or expired OTP");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  // Cleanup OTPs
  await prisma.otp.deleteMany({ where: { email, type: "FORGOT_PASSWORD" } });

  return { success: true };
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
      kdsStation: { select: { id: true, name: true, categoryIds: true } },
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
    { id: user.id, role: user.role, tenantId: user.tenantId, kdsStationId: user.kdsStationId || null },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

module.exports = { register, login, getMe, changePassword, requestOTP, resetPassword };
