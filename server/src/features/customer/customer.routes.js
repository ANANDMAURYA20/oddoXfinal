const { Router } = require("express");
const auth = require("../../middleware/auth");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createCustomerSchema, updateCustomerSchema } = require("./customer.validation");
const controller = require("./customer.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.post("/", validate(createCustomerSchema), controller.createCustomer);
router.get("/", controller.listCustomers);
router.get("/:id", controller.getCustomerById);
router.patch("/:id", validate(updateCustomerSchema), controller.updateCustomer);

module.exports = router;
