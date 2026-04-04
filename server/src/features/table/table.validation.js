const { z } = require("zod");

const createTableSchema = z.object({
  body: z.object({
    number: z.string().min(1, "Table number is required"),
    seats: z.number().int().min(1).optional(),
  }),
});

const updateTableSchema = z.object({
  body: z.object({
    number: z.string().min(1).optional(),
    seats: z.number().int().min(1).optional(),
  }),
});

const updateTableStatusSchema = z.object({
  body: z.object({
    status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED"]),
  }),
});

module.exports = { createTableSchema, updateTableSchema, updateTableStatusSchema };
