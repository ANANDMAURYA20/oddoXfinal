const { z } = require("zod");

const orderItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  paymentMethod: z.enum(["CASH", "CARD", "UPI", "SPLIT"]),
  customerId: z.string().uuid().optional(),
  discount: z.number().min(0).default(0),
  note: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(["PENDING", "PREPARING", "READY", "COMPLETED", "CANCELLED"]),
});

module.exports = { createOrderSchema, updateOrderStatusSchema };
