const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const discountService = require("./discount.service");

const createDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.createDiscount(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, discount, "Discount created"));
});

const listDiscounts = asyncHandler(async (req, res) => {
  const discounts = await discountService.listDiscounts(req.tenantId);
  res.status(200).json(new ApiResponse(200, discounts, "Discounts fetched"));
});

const updateDiscount = asyncHandler(async (req, res) => {
  const discount = await discountService.updateDiscount(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, discount, "Discount updated"));
});

const deleteDiscount = asyncHandler(async (req, res) => {
  await discountService.deleteDiscount(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Discount deleted"));
});

const applyDiscount = asyncHandler(async (req, res) => {
  const result = await discountService.applyDiscount(req.tenantId, req.body);
  res.status(200).json(new ApiResponse(200, result, "Discount applied"));
});

module.exports = { createDiscount, listDiscounts, updateDiscount, deleteDiscount, applyDiscount };
