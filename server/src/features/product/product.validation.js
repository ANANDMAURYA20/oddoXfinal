const { z } = require("zod");

const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  lowStock: z.number().int().min(0).default(5),
  barcode: z.string().optional(),
  image: z.string().optional(),
  vegType: z.string().optional(),
  categoryId: z.string().uuid().optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).optional(),
  lowStock: z.number().int().min(0).optional(),
  barcode: z.string().optional(),
  image: z.string().nullable().optional(),
  vegType: z.string().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updateStockSchema = z.object({
  stock: z.number().int().min(0, "Stock cannot be negative"),
});

module.exports = { createProductSchema, updateProductSchema, updateStockSchema };
