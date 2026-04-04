const { z } = require("zod");

const createTableSchema = z.object({
  body: z.object({
    number: z.number().int().min(1, "Table number is required"),
    name: z.string().optional(),
    seats: z.number().int().min(1).optional(),
  }),
});

const updateTableSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    seats: z.number().int().min(1).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateTableStatusSchema = z.object({
  body: z.object({
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]),
  }),
});

module.exports = { createTableSchema, updateTableSchema, updateTableStatusSchema };
