const { z } = require("zod");

const updateSettingsSchema = z.object({
  storeName: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxLabel: z.string().optional(),
  receiptNote: z.string().optional(),
  paymentMethods: z.array(z.string()).optional(),
  upiId: z.string().optional(),
  totalTables: z.number().int().min(0).optional(),
  onboardingCompleted: z.boolean().optional(),
  storeAddress: z.string().optional(),
  storePhone: z.string().optional(),
  gstNumber: z.string().optional(),
  fssaiNumber: z.string().optional(),
  storeLogo: z.string().optional(),
  qrOrderingEnabled: z.boolean().optional(),
  qrOrderingMode: z.enum(["order", "menu"]).optional(),
  geofenceEnabled: z.boolean().optional(),
  restaurantLat: z.number().nullable().optional(),
  restaurantLng: z.number().nullable().optional(),
  geofenceRadius: z.number().int().min(10).max(5000).optional(),
});

module.exports = { updateSettingsSchema };
