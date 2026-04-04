const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createUserSchema, updateUserSchema } = require("./user.validation");
const controller = require("./user.controller");

const router = Router();

// All routes: Tenant Admin only, tenant-scoped
router.use(auth, tenantIsolation, authorize("TENANT_ADMIN"));

router.post("/", validate(createUserSchema), controller.createUser);
router.get("/", controller.listUsers);
router.get("/:id", controller.getUserById);
router.patch("/:id", validate(updateUserSchema), controller.updateUser);
router.delete("/:id", controller.deleteUser);

module.exports = router;
