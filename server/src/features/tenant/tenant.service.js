const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

/**
 * List all tenants (Super Admin only).
 */
const listTenants = async ({ page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true, orders: true } } },
    }),
    prisma.tenant.count({ where }),
  ]);

  return {
    tenants,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get tenant by ID with stats.
 */
const getTenantById = async (id) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      _count: { select: { users: true, products: true, orders: true } },
      settings: true,
    },
  });

  if (!tenant) {
    throw ApiError.notFound("Tenant not found");
  }

  return tenant;
};

/**
 * Update tenant (plan, status, info).
 */
const updateTenant = async (id, data) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    throw ApiError.notFound("Tenant not found");
  }

  return prisma.tenant.update({ where: { id }, data });
};

/**
 * Deactivate a tenant (soft delete).
 */
const deleteTenant = async (id) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    throw ApiError.notFound("Tenant not found");
  }

  return prisma.tenant.update({
    where: { id },
    data: { isActive: false },
  });
};

/**
 * Permanently delete a tenant and all related data.
 */
const hardDeleteTenant = async (id) => {
  const tenant = await prisma.tenant.findUnique({ where: { id } });
  if (!tenant) {
    throw ApiError.notFound("Tenant not found");
  }

  // Cascade delete is configured in the schema, so this removes everything
  await prisma.tenant.delete({ where: { id } });
};

/**
 * Toggle a tenant admin's active status.
 */
const toggleAdminStatus = async (adminId) => {
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  if (!user) {
    throw ApiError.notFound("Admin not found");
  }
  if (user.role !== "TENANT_ADMIN") {
    throw ApiError.badRequest("User is not a tenant admin");
  }

  return prisma.user.update({
    where: { id: adminId },
    data: { isActive: !user.isActive },
    select: { id: true, name: true, email: true, isActive: true },
  });
};

/**
 * List all tenant admins with their tenant info.
 */
const listTenantAdmins = async ({ page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;

  const where = {
    role: "TENANT_ADMIN",
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { tenant: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [admins, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            plan: true,
            isActive: true,
            createdAt: true,
            _count: { select: { users: true, orders: true, products: true } },
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    admins,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = { listTenants, getTenantById, updateTenant, deleteTenant, hardDeleteTenant, toggleAdminStatus, listTenantAdmins };
