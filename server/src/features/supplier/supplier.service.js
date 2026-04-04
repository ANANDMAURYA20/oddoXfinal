const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createSupplier = async (tenantId, data) => {
  return prisma.supplier.create({
    data: { ...data, tenantId },
  });
};

const listSuppliers = async (tenantId, { page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;
  const where = { tenantId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    suppliers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getSupplierById = async (tenantId, id) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id, tenantId },
  });
  if (!supplier) {
    throw ApiError.notFound("Supplier not found");
  }
  return supplier;
};

const updateSupplier = async (tenantId, id, data) => {
  const supplier = await prisma.supplier.findFirst({ where: { id, tenantId } });
  if (!supplier) {
    throw ApiError.notFound("Supplier not found");
  }
  return prisma.supplier.update({ where: { id }, data });
};

const deleteSupplier = async (tenantId, id) => {
  const supplier = await prisma.supplier.findFirst({ where: { id, tenantId } });
  if (!supplier) {
    throw ApiError.notFound("Supplier not found");
  }
  return prisma.supplier.delete({ where: { id } });
};

module.exports = { createSupplier, listSuppliers, getSupplierById, updateSupplier, deleteSupplier };
