const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const validate = require("../../middleware/validate");
const { updateTenantSchema } = require("./tenant.validation");
const controller = require("./tenant.controller");

const router = Router();

// All routes: Super Admin only
router.use(auth, authorize("SUPER_ADMIN"));

router.get("/", controller.listTenants);
router.get("/:id", controller.getTenantById);
router.patch("/:id", validate(updateTenantSchema), controller.updateTenant);
router.delete("/:id", controller.deleteTenant);

module.exports = router;
