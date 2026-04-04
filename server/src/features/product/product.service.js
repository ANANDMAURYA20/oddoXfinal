const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");
const { cache } = require("../../config/redis");

/**
 * Helper to invalidate tenant product cache
 */
const invalidateProductCache = async (tenantId) => {
  await cache.invalidate(`tenant:${tenantId}:products_cache`);
};

/**
 * Create a product under the current tenant.
 */
const createProduct = async (tenantId, data) => {
  // If categoryId is provided, verify it belongs to the same tenant
  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, tenantId },
    });
    if (!category) {
      throw ApiError.badRequest("Category not found or doesn't belong to your store");
    }
  }

  const product = await prisma.product.create({
    data: { ...data, tenantId },
    include: { category: { select: { id: true, name: true } } },
  });

  await invalidateProductCache(tenantId);
  return product;
};

/**
 * List products with search, category filter, low stock filter, and pagination.
 */
const listProducts = async (tenantId, { page = 1, limit = 20, search, categoryId, lowStock, isActive }) => {
  const hashKey = `tenant:${tenantId}:products_cache`;
  const fieldKey = JSON.stringify({ page, limit, search, categoryId, lowStock, isActive });

  // 1. Check Redis Cache
  const cachedData = await cache.hGet(hashKey, fieldKey);
  if (cachedData) {
    return cachedData;
  }

  const skip = (page - 1) * limit;

  const where = { tenantId };

  // Filter by active status: "all" shows everything, "false" shows inactive, default shows active only
  if (isActive === "all") {
    // no filter — show all products
  } else if (isActive === "false") {
    where.isActive = false;
  } else {
    where.isActive = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (lowStock === "true") {
    where.stock = { lte: 5 };
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };

  // 2. Save to Cache (expires in 1 hour)
  await cache.hSet(hashKey, fieldKey, result, 3600);

  return result;
};

/**
 * Get single product by ID (tenant-scoped).
 */
const getProductById = async (tenantId, id) => {
  const product = await prisma.product.findFirst({
    where: { id, tenantId },
    include: { category: { select: { id: true, name: true } } },
  });

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  return product;
};

/**
 * Update a product.
 */
const updateProduct = async (tenantId, id, data) => {
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });

  await invalidateProductCache(tenantId);
  return updatedProduct;
};

/**
 * Delete a product (soft delete via isActive = false).
 */
const deleteProduct = async (tenantId, id) => {
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const deletedProduct = await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  await invalidateProductCache(tenantId);
  return deletedProduct;
};

/**
 * Manually update stock for a product.
 */
const updateStock = async (tenantId, id, { stock }) => {
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const updatedStock = await prisma.product.update({
    where: { id },
    data: { stock },
    select: { id: true, name: true, stock: true, lowStock: true },
  });

  await invalidateProductCache(tenantId);
  return updatedStock;
};

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct, updateStock };
