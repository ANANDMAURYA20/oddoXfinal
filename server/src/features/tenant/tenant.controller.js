const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const tenantService = require("./tenant.service");

const listTenants = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await tenantService.listTenants({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
  });
  res.status(200).json(new ApiResponse(200, result, "Tenants fetched"));
});

const getTenantById = asyncHandler(async (req, res) => {
  const tenant = await tenantService.getTenantById(req.params.id);
  res.status(200).json(new ApiResponse(200, tenant, "Tenant fetched"));
});

const updateTenant = asyncHandler(async (req, res) => {
  const tenant = await tenantService.updateTenant(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, tenant, "Tenant updated"));
});

const deleteTenant = asyncHandler(async (req, res) => {
  await tenantService.deleteTenant(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Tenant deactivated"));
});

const listTenantAdmins = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await tenantService.listTenantAdmins({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
  });
  res.status(200).json(new ApiResponse(200, result, "Tenant admins fetched"));
});

const hardDeleteTenant = asyncHandler(async (req, res) => {
  await tenantService.hardDeleteTenant(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Tenant permanently deleted"));
});

const toggleAdminStatus = asyncHandler(async (req, res) => {
  const admin = await tenantService.toggleAdminStatus(req.params.id);
  res.status(200).json(new ApiResponse(200, admin, `Admin ${admin.isActive ? "activated" : "deactivated"}`));
});

module.exports = { listTenants, getTenantById, updateTenant, deleteTenant, hardDeleteTenant, toggleAdminStatus, listTenantAdmins };
