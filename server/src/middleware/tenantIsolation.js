const ApiError = require("../utils/ApiError");
const prisma = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Tenant Isolation Middleware.
 * - SUPER_ADMIN: skips tenant check (can access all tenants).
 * - TENANT_ADMIN / CASHIER: must have a valid, active tenantId.
 *
 * Sets req.tenantId for use in service layer queries.
 */
const tenantIsolation = asyncHandler(async (req, _res, next) => {
  const { role, tenantId } = req.user;

  // Super admin can bypass tenant isolation
  if (role === "SUPER_ADMIN") {
    // If super admin provides a tenantId in query/params, use it for scoped access
    const queryTenantId = req.query.tenantId || req.params.tenantId;
    if (queryTenantId) {
      req.tenantId = queryTenantId;
    } else {
      // For development/POS testing, default to the first available tenant if none provided
      const firstTenant = await prisma.tenant.findFirst({ select: { id: true } });
      req.tenantId = firstTenant ? firstTenant.id : null;
    }
    return next();
  }

  // Regular users must belong to a tenant
  if (!tenantId) {
    throw ApiError.forbidden("Your account is not associated with any tenant");
  }

  // Verify tenant is still active
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { isActive: true },
  });

  if (!tenant || !tenant.isActive) {
    throw ApiError.forbidden("Your tenant account has been deactivated");
  }

  req.tenantId = tenantId;
  next();
});

module.exports = tenantIsolation;
