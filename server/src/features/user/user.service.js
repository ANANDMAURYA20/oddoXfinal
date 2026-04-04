const bcrypt = require("bcryptjs");
const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

/**
 * Create a staff member under the current tenant.
 */
const createUser = async (tenantId, data) => {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw ApiError.conflict("Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      tenantId,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  return user;
};

/**
 * List staff members for a tenant.
 */
const listUsers = async (tenantId, { page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const where = { tenantId };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get single user by ID (tenant-scoped).
 */
const getUserById = async (tenantId, userId) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  if (!user) {
    throw ApiError.notFound("Staff member not found");
  }

  return user;
};

/**
 * Update a staff member.
 */
const updateUser = async (tenantId, userId, data) => {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) {
    throw ApiError.notFound("Staff member not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });
};

/**
 * Delete (deactivate) a staff member.
 */
const deleteUser = async (tenantId, userId) => {
  const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
  if (!user) {
    throw ApiError.notFound("Staff member not found");
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
};

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };
