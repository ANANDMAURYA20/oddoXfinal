const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { updateSettingsSchema } = require("./settings.validation");
const controller = require("./settings.controller");

const router = Router();

router.use(auth, tenantIsolation);

// All authenticated tenant users can read settings (cashiers need UPI ID, tax rate, etc.)
router.get("/", controller.getSettings);

// Only TENANT_ADMIN can update settings
router.patch("/", authorize("TENANT_ADMIN"), validate(updateSettingsSchema), controller.updateSettings);

module.exports = router;
