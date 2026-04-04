const { z } = require("zod");

const createDiscountSchema = z.object({
  code: z.string().min(1, "Discount code is required").toUpperCase(),
  type: z.enum(["PERCENTAGE", "FLAT"]),
  value: z.number().positive("Discount value must be positive"),
  expiresAt: z.string().datetime().optional(),
});

const updateDiscountSchema = z.object({
  code: z.string().min(1).toUpperCase().optional(),
  type: z.enum(["PERCENTAGE", "FLAT"]).optional(),
  value: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const applyDiscountSchema = z.object({
  code: z.string().min(1, "Discount code is required"),
  subtotal: z.number().positive("Subtotal must be positive"),
});

module.exports = { createDiscountSchema, updateDiscountSchema, applyDiscountSchema };
