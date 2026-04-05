const { z } = require("zod");

const createKdsStationSchema = z.object({
  name: z.string().min(1, "Station name is required"),
  categoryIds: z.array(z.string().uuid()).default([]),
});

const updateKdsStationSchema = z.object({
  name: z.string().min(1).optional(),
  categoryIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

module.exports = { createKdsStationSchema, updateKdsStationSchema };
