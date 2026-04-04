const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createCategory = async (tenantId, { name }) => {
  return prisma.category.create({
    data: { name, tenantId },
  });
};

const listCategories = async (tenantId) => {
  return prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
};

const updateCategory = async (tenantId, id, { name }) => {
  const category = await prisma.category.findFirst({ where: { id, tenantId } });
  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  return prisma.category.update({ where: { id }, data: { name } });
};

const deleteCategory = async (tenantId, id) => {
  const category = await prisma.category.findFirst({ where: { id, tenantId } });
  if (!category) {
    throw ApiError.notFound("Category not found");
  }

  return prisma.category.delete({ where: { id } });
};

module.exports = { createCategory, listCategories, updateCategory, deleteCategory };
