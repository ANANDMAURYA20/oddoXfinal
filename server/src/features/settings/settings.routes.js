const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { updateSettingsSchema } = require("./settings.validation");
const controller = require("./settings.controller");

const router = Router();

router.use(auth, tenantIsolation, authorize("TENANT_ADMIN"));

router.get("/", controller.getSettings);
router.patch("/", validate(updateSettingsSchema), controller.updateSettings);

module.exports = router;
