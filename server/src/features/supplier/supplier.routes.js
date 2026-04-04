const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createSupplierSchema, updateSupplierSchema } = require("./supplier.validation");
const controller = require("./supplier.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.get("/", controller.listSuppliers);
router.get("/:id", controller.getSupplierById);
router.post("/", authorize("TENANT_ADMIN"), validate(createSupplierSchema), controller.createSupplier);
router.patch("/:id", authorize("TENANT_ADMIN"), validate(updateSupplierSchema), controller.updateSupplier);
router.delete("/:id", authorize("TENANT_ADMIN"), controller.deleteSupplier);

module.exports = router;
