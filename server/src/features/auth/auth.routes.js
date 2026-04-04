const { Router } = require("express");
const auth = require("../../middleware/auth");
const validate = require("../../middleware/validate");
const { authLimiter } = require("../../middleware/rateLimiter");
const { registerSchema, loginSchema, changePasswordSchema, requestOtpSchema, resetPasswordSchema } = require("./auth.validation");
const controller = require("./auth.controller");

const router = Router();

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/request-otp", authLimiter, validate(requestOtpSchema), controller.requestOTP);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), controller.resetPassword);

router.get("/me", auth, controller.getMe);
router.patch("/change-password", auth, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
