const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  phone: z.string().optional(),
  otpCode: z.string().length(6, "Verification code must be 6 digits"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const requestOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  type: z.enum(["SIGNUP", "FORGOT_PASSWORD"]),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "Verification code must be 6 digits"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  requestOtpSchema,
  resetPasswordSchema,
};
