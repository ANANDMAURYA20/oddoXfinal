const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const categoryService = require("./category.service");

const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, category, "Category created"));
});

const listCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories(req.tenantId);
  res.status(200).json(new ApiResponse(200, categories, "Categories fetched"));
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, category, "Category updated"));
});

const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Category deleted"));
});

module.exports = { createCategory, listCategories, updateCategory, deleteCategory };
