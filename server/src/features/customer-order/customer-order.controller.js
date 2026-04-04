const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const service = require("./customer-order.service");

const getRestaurantInfo = asyncHandler(async (req, res) => {
  const info = await service.getRestaurantInfo(req.params.tenantId);
  res.status(200).json(new ApiResponse(200, info, "Restaurant info fetched"));
});

const initSession = asyncHandler(async (req, res) => {
  const { tenantId, tableNumber } = req.params;
  const result = await service.initSession(tenantId, tableNumber);
  res.status(200).json(new ApiResponse(200, result, "Session initialized"));
});

const getMenu = asyncHandler(async (req, res) => {
  const menu = await service.getMenu(req.params.tenantId);
  res.status(200).json(new ApiResponse(200, menu, "Menu fetched"));
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await service.getProduct(req.params.tenantId, req.params.productId);
  res.status(200).json(new ApiResponse(200, product, "Product fetched"));
});

const placeOrder = asyncHandler(async (req, res) => {
  const order = await service.placeOrder(req.params.tenantId, req.body);
  res.status(201).json(new ApiResponse(201, order, "Order placed successfully"));
});

const trackOrder = asyncHandler(async (req, res) => {
  const order = await service.trackOrder(req.params.tenantId, req.params.orderId);
  res.status(200).json(new ApiResponse(200, order, "Order tracking info"));
});

const getSessionOrders = asyncHandler(async (req, res) => {
  const orders = await service.getSessionOrders(req.params.tenantId, req.query.sessionToken);
  res.status(200).json(new ApiResponse(200, orders, "Session orders fetched"));
});

module.exports = {
  getRestaurantInfo,
  initSession,
  getMenu,
  getProduct,
  placeOrder,
  trackOrder,
  getSessionOrders,
};
