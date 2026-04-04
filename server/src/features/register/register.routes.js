const { Router } = require("express");
const auth = require("../../middleware/auth");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { openRegisterSchema, closeRegisterSchema } = require("./register.validation");
const controller = require("./register.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.post("/open", validate(openRegisterSchema), controller.openRegister);
router.get("/active", controller.getActiveSession);
router.get("/", controller.listSessions);
router.get("/:id/summary", controller.getSessionSummary);
router.post("/:id/close", validate(closeRegisterSchema), controller.closeRegister);

module.exports = router;
