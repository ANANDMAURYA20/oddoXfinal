const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createTable = async (tenantId, data) => {
  const existing = await prisma.table.findUnique({
    where: { number_tenantId: { number: data.number, tenantId } },
  });
  if (existing) {
    throw ApiError.badRequest(`Table #${data.number} already exists`);
  }

  return prisma.table.create({
    data: {
      number: data.number,
      name: data.name || `Table ${data.number}`,
      seats: data.seats || 4,
      tenantId,
    },
  });
};

const listTables = async (tenantId) => {
  return prisma.table.findMany({
    where: { tenantId },
    orderBy: { number: "asc" },
  });
};

const getTableById = async (tenantId, id) => {
  const table = await prisma.table.findFirst({
    where: { id, tenantId },
  });
  if (!table) {
    throw ApiError.notFound("Table not found");
  }
  return table;
};

const updateTable = async (tenantId, id, data) => {
  const table = await prisma.table.findFirst({ where: { id, tenantId } });
  if (!table) {
    throw ApiError.notFound("Table not found");
  }
  return prisma.table.update({ where: { id }, data });
};

const updateTableStatus = async (tenantId, id, { status }) => {
  const table = await prisma.table.findFirst({ where: { id, tenantId } });
  if (!table) {
    throw ApiError.notFound("Table not found");
  }
  return prisma.table.update({ where: { id }, data: { status } });
};

const deleteTable = async (tenantId, id) => {
  const table = await prisma.table.findFirst({ where: { id, tenantId } });
  if (!table) {
    throw ApiError.notFound("Table not found");
  }
  return prisma.table.delete({ where: { id } });
};

const bulkCreateTables = async (tenantId, count) => {
  const lastTable = await prisma.table.findFirst({
    where: { tenantId },
    orderBy: { number: "desc" },
  });

  const startNum = (lastTable?.number || 0) + 1;
  const tables = [];

  for (let i = 0; i < count; i++) {
    const num = startNum + i;
    tables.push(
      prisma.table.create({
        data: { number: num, name: `Table ${num}`, tenantId },
      })
    );
  }

  return Promise.all(tables);
};

module.exports = { createTable, listTables, getTableById, updateTable, updateTableStatus, deleteTable, bulkCreateTables };
