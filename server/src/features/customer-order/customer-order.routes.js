const { Router } = require("express");

const controller = require("./customer-order.controller");

const router = Router();

// All routes are PUBLIC (no auth required) — these are customer-facing endpoints
router.get("/:tenantId/info", controller.getRestaurantInfo);
router.post("/:tenantId/table/:tableNumber/session", controller.initSession);
router.get("/:tenantId/menu", controller.getMenu);
router.get("/:tenantId/product/:productId", controller.getProduct);
router.post("/:tenantId/order", controller.placeOrder);
router.get("/:tenantId/order/:orderId/track", controller.trackOrder);
router.get("/:tenantId/orders", controller.getSessionOrders);

module.exports = router;
