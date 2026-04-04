const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createKdsStationSchema, updateKdsStationSchema } = require("./kds.validation");
const controller = require("./kds.controller");

const router = Router();

router.use(auth, tenantIsolation);

// KDS_STAFF can list and get stations, TENANT_ADMIN can manage them
router.get("/", controller.listStations);
router.get("/:id", controller.getStationById);
router.post("/", authorize("TENANT_ADMIN"), validate(createKdsStationSchema), controller.createStation);
router.patch("/:id", authorize("TENANT_ADMIN"), validate(updateKdsStationSchema), controller.updateStation);
router.delete("/:id", authorize("TENANT_ADMIN"), controller.deleteStation);

module.exports = router;
