const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createOrderSchema, updateOrderStatusSchema } = require("./order.validation");
const controller = require("./order.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.post("/", validate(createOrderSchema), controller.createOrder);
router.get("/", controller.listOrders);
router.get("/:id", controller.getOrderById);
router.patch("/:id/status", authorize("TENANT_ADMIN", "KDS_STAFF"), validate(updateOrderStatusSchema), controller.updateOrderStatus);
router.post("/:id/refund", authorize("TENANT_ADMIN"), controller.refundOrder);

module.exports = router;
