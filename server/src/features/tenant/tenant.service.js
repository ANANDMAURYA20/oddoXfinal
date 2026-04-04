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

module.exports = { listTenants, getTenantById, updateTenant, deleteTenant };
