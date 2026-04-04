const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createTableSchema, updateTableSchema, updateTableStatusSchema } = require("./table.validation");
const controller = require("./table.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.get("/", controller.listTables);
router.get("/:id", controller.getTableById);
router.post("/", authorize("TENANT_ADMIN"), validate(createTableSchema), controller.createTable);
router.patch("/:id", authorize("TENANT_ADMIN"), validate(updateTableSchema), controller.updateTable);
router.patch("/:id/status", validate(updateTableStatusSchema), controller.updateTableStatus);
router.delete("/:id", authorize("TENANT_ADMIN"), controller.deleteTable);
router.post("/bulk", authorize("TENANT_ADMIN"), controller.bulkCreateTables);

module.exports = router;
