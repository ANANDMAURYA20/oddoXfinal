const { z } = require("zod");

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["TENANT_ADMIN", "CASHIER", "KDS_STAFF"]).default("CASHIER"),
  kdsStationId: z.preprocess((val) => (val === "" ? null : val), z.string().uuid().nullable().optional()),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(["TENANT_ADMIN", "CASHIER", "KDS_STAFF"]).optional(),
  isActive: z.boolean().optional(),
  kdsStationId: z.preprocess((val) => (val === "" ? null : val), z.string().uuid().nullable().optional()),
});

module.exports = { createUserSchema, updateUserSchema };
