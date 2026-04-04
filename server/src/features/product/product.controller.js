const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const productService = require("./product.service");

const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, product, "Product created"));
});

const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, search, categoryId, lowStock } = req.query;
  const result = await productService.listProducts(req.tenantId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    search,
    categoryId,
    lowStock,
  });
  res.status(200).json(new ApiResponse(200, result, "Products fetched"));
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, product, "Product fetched"));
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, product, "Product updated"));
});

const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Product deleted"));
});

const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.updateStock(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, product, "Stock updated"));
});

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct, updateStock };
