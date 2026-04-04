const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");
const { emitToTenant, emitToKdsStation } = require("../../config/socket");

/**
 * Generate a unique order number: ORD-YYYYMMDD-XXXXX
 */
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `ORD-${date}-${random}`;
};

/**
 * Create an order with Prisma transaction.
 * Atomically: validate stock → deduct stock → create order + items.
 */
const createOrder = async (tenantId, cashierId, data) => {
  const { items, paymentMethod, customerId, discount = 0, note } = data;

  const order = await prisma.$transaction(async (tx) => {
    // 1. Fetch all products and validate they belong to this tenant
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, tenantId, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw ApiError.badRequest("One or more products are invalid or inactive");
    }

    // Build a lookup map
    const productMap = new Map(products.map((p) => [p.id, p]));

    // 2. Validate stock and calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (product.stock < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      subtotal += product.price * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price, // Lock the price at time of sale
      });
    }

    // 3. Get tenant settings for tax calculation
    const settings = await tx.settings.findUnique({ where: { tenantId } });
    const taxRate = settings?.taxRate || 0;
    const tax = (subtotal - discount) * (taxRate / 100);
    const totalAmount = subtotal - discount + tax;

    // 4. Deduct stock for each product
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 5. Create the order with items
    const createdOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        subtotal,
        discount,
        tax,
        totalAmount,
        paymentMethod,
        status: "PENDING", // Start in PENDING for Kitchen Display
        paymentStatus: "PAID",
        note,
        cashierId,
        customerId: customerId || null,
        tenantId,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true } } } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return createdOrder;
  });

  // Emit event to connected Socket.io clients (Kitchen Display)
  emitToTenant(tenantId, "order:new", order);

  // Emit to specific KDS stations based on order item categories
  try {
    const kdsStations = await prisma.kdsStation.findMany({
      where: { tenantId, isActive: true },
    });

    if (kdsStations.length > 0) {
      // Get category IDs from the order's products
      const orderProductIds = order.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: orderProductIds } },
        select: { id: true, categoryId: true },
      });
      const orderCategoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];

      for (const station of kdsStations) {
        // If station has no category filter, it gets all orders
        // Otherwise only orders with matching categories
        if (station.categoryIds.length === 0 || station.categoryIds.some((cid) => orderCategoryIds.includes(cid))) {
          emitToKdsStation(station.id, "order:new", order);
        }
      }
    }
  } catch (err) {
    // Don't fail the order if KDS emission fails
    console.error("KDS emission error:", err);
  }

  return order;
};

/**
 * List orders with filters (date range, status) and pagination.
 */
const listOrders = async (tenantId, { page = 1, limit = 20, status, startDate, endDate }) => {
  const skip = (page - 1) * limit;

  const where = { tenantId };

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
        cashier: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get single order with all items.
 */
const getOrderById = async (tenantId, id) => {
  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: {
      items: { include: { product: { select: { id: true, name: true, barcode: true } } } },
      cashier: { select: { id: true, name: true } },
      customer: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  return order;
};

/**
 * Update order status (e.g., mark as cancelled).
 */
const updateOrderStatus = async (tenantId, id, { status }) => {
  const order = await prisma.order.findFirst({ where: { id, tenantId } });
  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: { status },
    include: {
      items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
      cashier: { select: { id: true, name: true } },
    },
  });

  // Emit event to update KDS screens
  emitToTenant(tenantId, "order:updated", updatedOrder);

  // Also emit to specific KDS station rooms so station-filtered displays update in real-time
  try {
    const kdsStations = await prisma.kdsStation.findMany({
      where: { tenantId, isActive: true },
    });

    if (kdsStations.length > 0) {
      const orderProductIds = updatedOrder.items.map((i) => i.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: orderProductIds } },
        select: { id: true, categoryId: true },
      });
      const orderCategoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];

      for (const station of kdsStations) {
        if (station.categoryIds.length === 0 || station.categoryIds.some((cid) => orderCategoryIds.includes(cid))) {
          emitToKdsStation(station.id, "order:updated", updatedOrder);
        }
      }
    }
  } catch (err) {
    console.error("KDS station emission error:", err);
  }

  return updatedOrder;
};

/**
 * Refund an order: reverse stock and mark as refunded.
 */
const refundOrder = async (tenantId, id) => {
  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.status === "REFUNDED") {
    throw ApiError.badRequest("Order has already been refunded");
  }

  const refundedOrder = await prisma.$transaction(async (tx) => {
    // Restore stock for each item
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    // Mark order as refunded
    return tx.order.update({
      where: { id },
      data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
    });
  });

  emitToTenant(tenantId, "order:updated", refundedOrder);

  return refundedOrder;
};

module.exports = { createOrder, listOrders, getOrderById, updateOrderStatus, refundOrder };
