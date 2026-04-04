const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createDiscountSchema, updateDiscountSchema, applyDiscountSchema } = require("./discount.validation");
const controller = require("./discount.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.get("/", controller.listDiscounts);
router.post("/apply", validate(applyDiscountSchema), controller.applyDiscount);
router.post("/", authorize("TENANT_ADMIN"), validate(createDiscountSchema), controller.createDiscount);
router.patch("/:id", authorize("TENANT_ADMIN"), validate(updateDiscountSchema), controller.updateDiscount);
router.delete("/:id", authorize("TENANT_ADMIN"), controller.deleteDiscount);

module.exports = router;
