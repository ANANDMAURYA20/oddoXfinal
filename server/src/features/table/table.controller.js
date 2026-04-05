const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const tableService = require("./table.service");

const createTable = asyncHandler(async (req, res) => {
  const table = await tableService.createTable(req.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, table, "Table created"));
});

const listTables = asyncHandler(async (req, res) => {
  const tables = await tableService.listTables(req.tenantId);
  res.status(200).json(new ApiResponse(200, tables, "Tables fetched"));
});

const getTableById = asyncHandler(async (req, res) => {
  const table = await tableService.getTableById(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, table, "Table fetched"));
});

const updateTable = asyncHandler(async (req, res) => {
  const table = await tableService.updateTable(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, table, "Table updated"));
});

const updateTableStatus = asyncHandler(async (req, res) => {
  const table = await tableService.updateTableStatus(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, table, "Table status updated"));
});

const deleteTable = asyncHandler(async (req, res) => {
  await tableService.deleteTable(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Table deleted"));
});

const bulkCreateTables = asyncHandler(async (req, res) => {
  const tables = await tableService.bulkCreateTables(req.tenantId, req.body.count);
  res.status(201).json(new ApiResponse(201, tables, `${tables.length} tables created`));
});

module.exports = { createTable, listTables, getTableById, updateTable, updateTableStatus, deleteTable, bulkCreateTables };
