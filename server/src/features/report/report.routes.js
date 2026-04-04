const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const controller = require("./report.controller");

const router = Router();

router.use(auth, tenantIsolation, authorize("TENANT_ADMIN"));

router.get("/sales-summary", controller.getSalesSummary);
router.get("/daily-sales", controller.getDailySales);
router.get("/top-products", controller.getTopProducts);
router.get("/revenue-chart", controller.getRevenueChart);

module.exports = router;
