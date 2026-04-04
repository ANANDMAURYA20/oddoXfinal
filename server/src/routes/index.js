const { Router } = require("express");

const authRoutes = require("../features/auth/auth.routes");
const tenantRoutes = require("../features/tenant/tenant.routes");
const userRoutes = require("../features/user/user.routes");
const categoryRoutes = require("../features/category/category.routes");
const productRoutes = require("../features/product/product.routes");
const orderRoutes = require("../features/order/order.routes");
const customerRoutes = require("../features/customer/customer.routes");
const reportRoutes = require("../features/report/report.routes");
const discountRoutes = require("../features/discount/discount.routes");
const settingsRoutes = require("../features/settings/settings.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/tenants", tenantRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/customers", customerRoutes);
router.use("/reports", reportRoutes);
router.use("/discounts", discountRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
