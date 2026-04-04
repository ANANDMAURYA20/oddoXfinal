const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");
const { cache } = require("../../config/redis");

const invalidateCategoryCache = async (tenantId) => {
  await cache.invalidate(`tenant:${tenantId}:categories_cache`);
};

const createCategory = async (tenantId, { name }) => {
  const category = await prisma.category.create({
    data: { name, tenantId },
  });
  await invalidateCategoryCache(tenantId);
  return category;
};

const listCategories = async (tenantId) => {
  const key = `tenant:${tenantId}:categories_cache`;
  
  const cachedData = await cache.get(key);
  if (cachedData) return cachedData;

  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  await cache.set(key, categories, 3600); // 1 hour TTL
  return categories;
};

const updateCategory = async (tenantId, id, { name }) => {
  const category = await prisma.category.findFirst({ where: { id, tenantId } });
  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  const updatedCategory = await prisma.category.update({ where: { id }, data: { name } });
  await invalidateCategoryCache(tenantId);
  return updatedCategory;
};

const deleteCategory = async (tenantId, id) => {
  const category = await prisma.category.findFirst({ where: { id, tenantId } });
  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  const deletedCategory = await prisma.category.delete({ where: { id } });
  await invalidateCategoryCache(tenantId);
  // Optional: Also invalidate product cache since products might lose this category
  await cache.invalidate(`tenant:${tenantId}:products_cache`); 
  return deletedCategory;
};

module.exports = { createCategory, listCategories, updateCategory, deleteCategory };
