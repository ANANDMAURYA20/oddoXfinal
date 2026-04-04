const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const orderService = require("./order.service");

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.tenantId, req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, order, "Order created successfully"));
});

const listOrders = asyncHandler(async (req, res) => {
  const { page, limit, status, startDate, endDate, cashierId } = req.query;
  const result = await orderService.listOrders(req.tenantId, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    startDate,
    endDate,
    cashierId,
  });
  res.status(200).json(new ApiResponse(200, result, "Orders fetched"));
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, order, "Order fetched"));
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, order, "Order status updated"));
});

const refundOrder = asyncHandler(async (req, res) => {
  const order = await orderService.refundOrder(req.tenantId, req.params.id);
  res.status(200).json(new ApiResponse(200, order, "Order refunded successfully"));
});

const addItemsToOrder = asyncHandler(async (req, res) => {
  const order = await orderService.addItemsToOrder(req.tenantId, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, order, "Items added to order"));
});

module.exports = { createOrder, listOrders, getOrderById, updateOrderStatus, refundOrder, addItemsToOrder };
