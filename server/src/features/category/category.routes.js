const { Router } = require("express");
const auth = require("../../middleware/auth");
const authorize = require("../../middleware/authorize");
const tenantIsolation = require("../../middleware/tenantIsolation");
const validate = require("../../middleware/validate");
const { createCategorySchema, updateCategorySchema } = require("./category.validation");
const controller = require("./category.controller");

const router = Router();

router.use(auth, tenantIsolation);

router.get("/", controller.listCategories);
router.post("/", authorize("TENANT_ADMIN"), validate(createCategorySchema), controller.createCategory);
router.patch("/:id", authorize("TENANT_ADMIN"), validate(updateCategorySchema), controller.updateCategory);
router.delete("/:id", authorize("TENANT_ADMIN"), controller.deleteCategory);

module.exports = router;
