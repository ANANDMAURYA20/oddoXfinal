const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createProductSchema, updateProductSchema, updateStockSchema } = require("./product.validation");
const controller = require("./product.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.get("/", controller.listProducts);
router.get("/:id", controller.getProductById);
router.post("/", authorize("TENANT_ADMIN"), validate(createProductSchema), controller.createProduct);
router.patch("/:id", authorize("TENANT_ADMIN"), validate(updateProductSchema), controller.updateProduct);
router.delete("/:id", authorize("TENANT_ADMIN"), controller.deleteProduct);
router.patch("/:id/stock", authorize("TENANT_ADMIN"), validate(updateStockSchema), controller.updateStock);

module.exports = router;
