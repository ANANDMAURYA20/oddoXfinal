const { z } = require("zod");

const updateSettingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxLabel: z.string().optional(),
  receiptNote: z.string().optional(),
});

module.exports = { updateSettingsSchema };
