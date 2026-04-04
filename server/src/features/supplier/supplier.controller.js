const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const supplierService = require("./supplier.service");

const createSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.createSupplier(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, supplier, "Supplier created"));
});

const listSuppliers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await supplierService.listSuppliers(req.tenantId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
  });
  res.status(200).json(new ApiResponse(200, result, "Suppliers fetched"));
});

const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await supplierService.getSupplierById(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, supplier, "Supplier fetched"));
});

const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await supplierService.updateSupplier(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, supplier, "Supplier updated"));
});

const deleteSupplier = asyncHandler(async (req, res) => {
  await supplierService.deleteSupplier(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Supplier deleted"));
});

module.exports = { createSupplier, listSuppliers, getSupplierById, updateSupplier, deleteSupplier };
