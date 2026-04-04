const { z } = require("zod");

const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Supplier name is required"),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
  }),
});

const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

module.exports = { createSupplierSchema, updateSupplierSchema };
