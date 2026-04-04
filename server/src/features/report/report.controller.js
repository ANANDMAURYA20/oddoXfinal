const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const reportService = require("./report.service");

const getSalesSummary = asyncHandler(async (req, res) => {
  const data = await reportService.getSalesSummary(req.tenantId);
  res.status(200).json(new ApiResponse(200, data, "Sales summary fetched"));
});

const getDailySales = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const data = await reportService.getDailySales(req.tenantId, { days });
  res.status(200).json(new ApiResponse(200, data, "Daily sales fetched"));
});

const getTopProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const data = await reportService.getTopProducts(req.tenantId, { limit });
  res.status(200).json(new ApiResponse(200, data, "Top products fetched"));
});

const getRevenueChart = asyncHandler(async (req, res) => {
  const data = await reportService.getRevenueChart(req.tenantId);
  res.status(200).json(new ApiResponse(200, data, "Revenue chart fetched"));
});

module.exports = { getSalesSummary, getDailySales, getTopProducts, getRevenueChart };
