const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");
const { emitToTenant, emitToKdsStation, emitToOrder } = require("../../config/socket");

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
  const { items, paymentMethod, customerId, discount = 0, note, status = "PENDING" } = data;

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
        status, // Custom status (e.g. COMPLETED for checkout-only orders)
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
        items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
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
const listOrders = async (tenantId, { page = 1, limit = 20, status, startDate, endDate, cashierId }) => {
  const skip = (page - 1) * limit;

  const where = { tenantId };

  if (status) {
    where.status = status;
  }

  if (cashierId) {
    where.cashierId = cashierId;
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
 * Update order status or item statuses for a specific KDS station.
 */
const updateOrderStatus = async (tenantId, id, { status, stationId }) => {
  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  const updatedOrder = await prisma.$transaction(async (tx) => {
    // 1. If stationId is provided, update only items handled by that station
    if (stationId) {
      const station = await tx.kdsStation.findFirst({ where: { id: stationId, tenantId } });
      if (station) {
        // Find items matching station categories
        const itemIdsToUpdate = order.items
          .filter((item) => {
            const categoryId = item.product?.categoryId;
            return !station.categoryIds.length || station.categoryIds.includes(categoryId);
          })
          .map((item) => item.id);

        if (itemIdsToUpdate.length > 0) {
          await tx.orderItem.updateMany({
            where: { id: { in: itemIdsToUpdate } },
            data: { status },
          });
        }
      }
    } else {
      // 2. If no stationId, update all items to match the status (if it makes sense)
      // Map OrderStatus to OrderItemStatus where possible
      const itemStatusMap = {
        PENDING: "PENDING",
        PREPARING: "PREPARING",
        READY: "READY",
        COMPLETED: "COMPLETED",
      };

      const newItemStatus = itemStatusMap[status];
      if (newItemStatus) {
        await tx.orderItem.updateMany({
          where: { orderId: id },
          data: { status: newItemStatus },
        });
      }
    }

    // 3. Recalculate global Order status based on all items
    const allItems = await tx.orderItem.findMany({ where: { orderId: id } });
    let newOrderStatus = status; // Default to what was requested

    // Auto-calculate logic if this was a KDS move (status is one of PENDING, PREPARING, READY, COMPLETED)
    if (["PENDING", "PREPARING", "READY", "COMPLETED"].includes(status)) {
      if (allItems.every((i) => i.status === "COMPLETED")) {
        newOrderStatus = "COMPLETED";
      } else if (allItems.every((i) => i.status === "READY" || i.status === "COMPLETED")) {
        newOrderStatus = "READY";
      } else if (allItems.some((i) => i.status === "PREPARING" || i.status === "READY" || i.status === "COMPLETED")) {
        newOrderStatus = "PREPARING";
      } else {
        newOrderStatus = "PENDING";
      }
    }

    return tx.order.update({
      where: { id },
      data: { status: newOrderStatus },
      include: {
        items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
        cashier: { select: { id: true, name: true } },
      },
    });
  });

  // Emit event to update KDS screens
  emitToTenant(tenantId, "order:updated", updatedOrder);

  // Emit to customer tracking room (for QR orders)
  emitToOrder(id, "order:status-changed", {
    orderId: id,
    status: updatedOrder.status,
    updatedAt: updatedOrder.updatedAt,
  });

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

/**
 * Append new items to an existing order (used for KOT on held tables).
 */
const addItemsToOrder = async (tenantId, id, { items }) => {
  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: { items: true },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  // Calculate additional total from new items
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // 1. Fetch products and validate stock
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, tenantId, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw ApiError.badRequest("One or more products are invalid or inactive");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let additionalSubtotal = 0;
    const newOrderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (product.stock < item.quantity) {
        throw ApiError.badRequest(`Insufficient stock for "${product.name}"`);
      }
      additionalSubtotal += product.price * item.quantity;
      newOrderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: product.price,
      });

      // 2. Deduct stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // 3. Update existing order totals
    // Get current tax rate for the tenant
    const settings = await tx.settings.findUnique({ where: { tenantId } });
    const taxRate = settings?.taxRate || 0;

    const newSubtotal = order.subtotal + additionalSubtotal;
    const newTax = (newSubtotal - order.discount) * (taxRate / 100);
    const newTotal = newSubtotal - order.discount + newTax;

    return tx.order.update({
      where: { id },
      data: {
        subtotal: newSubtotal,
        tax: newTax,
        totalAmount: newTotal,
        items: {
          create: newOrderItems,
        },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
        cashier: { select: { id: true, name: true } },
      },
    });
  });

  // Emit event to update KDS screens with the expanded order
  emitToTenant(tenantId, "order:updated", updatedOrder);

  // KDS Station room emissions
  try {
    const kdsStations = await prisma.kdsStation.findMany({ where: { tenantId, isActive: true } });
    if (kdsStations.length > 0) {
      // Find categories of NEWLY added items for station routing
      const products = await prisma.product.findMany({
        where: { id: { in: items.map(i => i.productId) } },
        select: { categoryId: true },
      });
      const newCategoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];

      for (const station of kdsStations) {
        if (station.categoryIds.length === 0 || station.categoryIds.some(cid => newCategoryIds.includes(cid))) {
          emitToKdsStation(station.id, "order:updated", updatedOrder);
        }
      }
    }
  } catch (err) {
    console.error("KDS station update error:", err);
  }

  return updatedOrder;
};

/**
 * Get active QR orders grouped by table number (for POS table sync).
 * Returns orders that are NOT COMPLETED/CANCELLED/REFUNDED on tables with active sessions.
 */
const getActiveQrTableOrders = async (tenantId) => {
  // Get all active customer sessions
  const sessions = await prisma.customerSession.findMany({
    where: {
      tenantId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, tableNumber: true, sessionToken: true },
  });

  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const sessionByTable = new Map(sessions.map((s) => [s.tableNumber, s]));

  // Fetch all non-completed QR orders for these sessions
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      sessionId: { in: sessionIds },
      orderSource: "QR",
      status: { notIn: ["COMPLETED", "CANCELLED", "REFUNDED"] },
    },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, image: true, categoryId: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by table number
  const tableMap = new Map();

  for (const order of orders) {
    const tNum = order.tableNumber;
    if (!tableMap.has(tNum)) {
      const session = sessionByTable.get(tNum);
      tableMap.set(tNum, {
        tableNumber: tNum,
        sessionToken: session?.sessionToken,
        orders: [],
        allItems: [],
        totalAmount: 0,
        status: 'PENDING', // overall status
      });
    }
    const entry = tableMap.get(tNum);
    entry.orders.push(order);
    entry.totalAmount += order.totalAmount;

    // Merge items across multiple QR orders on the same table
    for (const item of order.items) {
      const existing = entry.allItems.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice += item.price * item.quantity;
      } else {
        entry.allItems.push({
          productId: item.productId,
          name: item.product?.name || 'Item',
          image: item.product?.image,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
        });
      }
    }

    // If any order is PREPARING, the table status is PREPARING
    if (order.status === 'PREPARING') entry.status = 'PREPARING';
    if (order.status === 'READY' && entry.status !== 'PREPARING') entry.status = 'READY';
  }

  return Array.from(tableMap.values());
};

/**
 * Complete all QR orders on a table + close the session.
 * Called by POS cashier when printing the bill.
 */
const completeQrTable = async (tenantId, tableNumber, { paymentMethod = "CASH" }) => {
  const tableNum = parseInt(tableNumber);

  // Find active session
  const session = await prisma.customerSession.findFirst({
    where: { tenantId, tableNumber: tableNum, isActive: true, expiresAt: { gt: new Date() } },
  });

  if (!session) {
    throw ApiError.notFound("No active session on this table");
  }

  // Find all non-completed QR orders on this table
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      sessionId: session.id,
      orderSource: "QR",
      status: { notIn: ["COMPLETED", "CANCELLED", "REFUNDED"] },
    },
    include: {
      items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
    },
  });

  if (orders.length === 0) {
    throw ApiError.badRequest("No pending orders on this table");
  }

  // Complete all orders in a transaction
  const updatedOrders = await prisma.$transaction(async (tx) => {
    const results = [];
    for (const order of orders) {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED", paymentMethod, paymentStatus: "PAID" },
        include: {
          items: { include: { product: { select: { id: true, name: true, categoryId: true } } } },
        },
      });
      results.push(updated);
    }

    // Close the session
    await tx.customerSession.update({
      where: { id: session.id },
      data: { isActive: false },
    });

    return results;
  });

  // Emit updates
  for (const order of updatedOrders) {
    emitToTenant(tenantId, "order:updated", order);
    emitToOrder(order.id, "order:status-changed", {
      orderId: order.id,
      status: "COMPLETED",
      updatedAt: order.updatedAt,
    });
  }

  // Build a combined bill summary
  const combinedOrder = {
    ...updatedOrders[0],
    orderNumber: updatedOrders.map((o) => o.orderNumber).join(', '),
    subtotal: updatedOrders.reduce((s, o) => s + o.subtotal, 0),
    tax: updatedOrders.reduce((s, o) => s + o.tax, 0),
    discount: updatedOrders.reduce((s, o) => s + o.discount, 0),
    totalAmount: updatedOrders.reduce((s, o) => s + o.totalAmount, 0),
    items: updatedOrders.flatMap((o) => o.items),
    tableNumber: tableNum,
    note: orders[0]?.note || `Table ${tableNum}`,
    orderSource: "QR",
    paymentMethod,
  };

  return combinedOrder;
};

module.exports = { createOrder, listOrders, getOrderById, updateOrderStatus, refundOrder, addItemsToOrder, getActiveQrTableOrders, completeQrTable };
