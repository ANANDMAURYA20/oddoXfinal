const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createTable = async (tenantId, data) => {
  return prisma.table.create({
    data: { ...data, tenantId },
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

module.exports = { createTable, listTables, getTableById, updateTable, updateTableStatus, deleteTable };
