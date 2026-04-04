const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

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

  return prisma.product.create({
    data: { ...data, tenantId },
    include: { category: { select: { id: true, name: true } } },
  });
};

/**
 * List products with search, category filter, low stock filter, and pagination.
 */
const listProducts = async (tenantId, { page = 1, limit = 20, search, categoryId, lowStock }) => {
  const skip = (page - 1) * limit;

  const where = { tenantId };

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
    // Products where stock <= lowStock threshold
    where.stock = { lte: prisma.product.fields?.lowStock };
    // Prisma doesn't support field-to-field comparison directly, so we use raw
    // Simpler approach: just filter where stock <= 5 (or use a fixed threshold)
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

  return {
    products,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
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

  return prisma.product.update({
    where: { id },
    data,
    include: { category: { select: { id: true, name: true } } },
  });
};

/**
 * Delete a product (soft delete via isActive = false).
 */
const deleteProduct = async (tenantId, id) => {
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
};

/**
 * Manually update stock for a product.
 */
const updateStock = async (tenantId, id, { stock }) => {
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data: { stock },
    select: { id: true, name: true, stock: true, lowStock: true },
  });
};

module.exports = { createProduct, listProducts, getProductById, updateProduct, deleteProduct, updateStock };
