const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const customerService = require("./customer.service");

const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, customer, "Customer created"));
});

const listCustomers = asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const result = await customerService.listCustomers(req.tenantId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
  });
  res.status(200).json(new ApiResponse(200, result, "Customers fetched"));
});

const getCustomerById = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, customer, "Customer fetched"));
});

const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, customer, "Customer updated"));
});

module.exports = { createCustomer, listCustomers, getCustomerById, updateCustomer };
