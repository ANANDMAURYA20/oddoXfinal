const { z } = require("zod");

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  plan: z.enum(["TRIAL", "BASIC", "PRO"]).optional(),
  isActive: z.boolean().optional(),
});

module.exports = { updateTenantSchema };
