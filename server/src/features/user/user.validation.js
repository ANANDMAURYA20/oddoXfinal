const { z } = require("zod");

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["TENANT_ADMIN", "CASHIER"]).default("CASHIER"),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["TENANT_ADMIN", "CASHIER"]).optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createUserSchema, updateUserSchema };
