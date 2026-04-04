const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createCustomer = async (tenantId, data) => {
  return prisma.customer.create({
    data: { ...data, tenantId },
  });
};

const listCustomers = async (tenantId, { page = 1, limit = 20, search }) => {
  const skip = (page - 1) * limit;

  const where = { tenantId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

const getCustomerById = async (tenantId, id) => {
  const customer = await prisma.customer.findFirst({
    where: { id, tenantId },
    include: {
      orders: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { id: true, orderNumber: true, totalAmount: true, createdAt: true },
      },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) {
    throw ApiError.notFound("Customer not found");
  }

  return customer;
};

const updateCustomer = async (tenantId, id, data) => {
  const customer = await prisma.customer.findFirst({ where: { id, tenantId } });
  if (!customer) {
    throw ApiError.notFound("Customer not found");
  }

  return prisma.customer.update({ where: { id }, data });
};

module.exports = { createCustomer, listCustomers, getCustomerById, updateCustomer };
