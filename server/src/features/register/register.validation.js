const { z } = require("zod");

const openRegisterSchema = z.object({
  openingCash: z.number().min(0, "Opening cash must be 0 or more"),
});

const closeRegisterSchema = z.object({
  closingCash: z.number().min(0, "Closing cash must be 0 or more"),
  closingNote: z.string().optional(),
});

module.exports = { openRegisterSchema, closeRegisterSchema };
