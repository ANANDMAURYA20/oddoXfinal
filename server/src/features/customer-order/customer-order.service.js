const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");
const { emitToTenant, emitToKdsStation } = require("../../config/socket");

/**
 * Generate a unique order number: QR-YYYYMMDD-XXXXX
 */
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `QR-${date}-${random}`;
};

/**
 * Get restaurant info for landing page (public).
 */
const getRestaurantInfo = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, isActive: true },
  });

  if (!tenant || !tenant.isActive) {
    throw ApiError.notFound("Restaurant not found or inactive");
  }

  const settings = await prisma.settings.findUnique({
    where: { tenantId },
    select: {
      storeName: true,
      currency: true,
      taxRate: true,
      taxLabel: true,
      qrOrderingEnabled: true,
      geofenceEnabled: true,
      restaurantLat: true,
      restaurantLng: true,
      geofenceRadius: true,
    },
  });

  if (!settings?.qrOrderingEnabled) {
    throw ApiError.badRequest("Online ordering is currently disabled");
  }

  return {
    tenantId: tenant.id,
    restaurantName: settings?.storeName || tenant.name,
    currency: settings?.currency || "INR",
    taxRate: settings?.taxRate || 0,
    taxLabel: settings?.taxLabel || "GST",
    geofence: settings?.geofenceEnabled
      ? {
          enabled: true,
          lat: settings.restaurantLat,
          lng: settings.restaurantLng,
          radius: settings.geofenceRadius,
        }
      : { enabled: false },
  };
};

/**
 * Validate table and create/get a customer session.
 */
const initSession = async (tenantId, tableId) => {
  const table = await prisma.table.findFirst({
    where: { id: tableId, tenantId, isActive: true },
  });

  if (!table) {
    throw ApiError.notFound("Table not found or inactive");
  }

  // Check for existing active session on this table
  const existingSession = await prisma.customerSession.findFirst({
    where: {
      tableId,
      tenantId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (existingSession) {
    return { session: existingSession, table };
  }

  // Create new session (expires in 3 hours)
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const session = await prisma.customerSession.create({
    data: { tableId, tenantId, expiresAt },
  });

  // Mark table as occupied
  await prisma.table.update({
    where: { id: tableId },
    data: { status: "OCCUPIED" },
  });

  return { session, table };
};

/**
 * Get menu with categories and products (public).
 */
const getMenu = async (tenantId) => {
  const categories = await prisma.category.findMany({
    where: { tenantId },
    include: {
      products: {
        where: { isActive: true, stock: { gt: 0 } },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          image: true,
          stock: true,
          vegType: true,
          categoryId: true,
          addons: {
            where: { isActive: true },
            select: { id: true, name: true, price: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.filter((c) => c.products.length > 0);
};

/**
 * Get single product with addons (public).
 */
const getProduct = async (tenantId, productId) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId, isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      addons: {
        where: { isActive: true },
        select: { id: true, name: true, price: true },
      },
    },
  });

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  return product;
};

/**
 * Place an order from QR (customer-facing, no auth).
 */
const placeOrder = async (tenantId, data) => {
  const { items, tableId, sessionToken, note } = data;

  // Validate session
  const session = await prisma.customerSession.findFirst({
    where: {
      sessionToken,
      tenantId,
      tableId,
      isActive: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    throw ApiError.unauthorized("Invalid or expired session. Please re-scan the QR code.");
  }

  // Prevent duplicate orders within 10 seconds
  const recentOrder = await prisma.order.findFirst({
    where: {
      sessionId: session.id,
      tableId,
      createdAt: { gt: new Date(Date.now() - 10000) },
    },
  });

  if (recentOrder) {
    throw ApiError.badRequest("Order already submitted. Please wait.");
  }

  const order = await prisma.$transaction(async (tx) => {
    // Validate products
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, tenantId, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw ApiError.badRequest("One or more items are unavailable");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = productMap.get(item.productId);

      if (product.stock < item.quantity) {
        throw ApiError.badRequest(
          `"${product.name}" is out of stock. Available: ${product.stock}`
        );
      }

      let itemPrice = product.price;
      // Add addon prices
      const addonTotal = (item.addons || []).reduce((sum, a) => sum + (a.price || 0), 0);
      itemPrice += addonTotal;

      subtotal += itemPrice * item.quantity;
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: itemPrice,
        addons: item.addons ? JSON.stringify(item.addons) : null,
        note: item.note || null,
      });
    }

    // Tax
    const settings = await tx.settings.findUnique({ where: { tenantId } });
    const taxRate = settings?.taxRate || 0;
    const tax = subtotal * (taxRate / 100);
    const totalAmount = subtotal + tax;

    // Deduct stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    // Create order
    return tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        subtotal,
        discount: 0,
        tax,
        totalAmount,
        paymentMethod: "CASH", // Will be paid at counter
        status: "PENDING",
        paymentStatus: "PENDING",
        note: note || null,
        tenantId,
        tableId,
        sessionId: session.id,
        orderSource: "QR",
        items: { create: orderItems },
      },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, categoryId: true } } },
        },
        table: { select: { id: true, number: true, name: true } },
      },
    });
  });

  // Emit to tenant (KDS + admin)
  emitToTenant(tenantId, "order:new", order);

  // Emit to KDS stations
  try {
    const kdsStations = await prisma.kdsStation.findMany({
      where: { tenantId, isActive: true },
    });

    const orderCategoryIds = [
      ...new Set(order.items.map((i) => i.product?.categoryId).filter(Boolean)),
    ];

    for (const station of kdsStations) {
      if (
        station.categoryIds.length === 0 ||
        station.categoryIds.some((cid) => orderCategoryIds.includes(cid))
      ) {
        emitToKdsStation(station.id, "order:new", order);
      }
    }
  } catch (err) {
    console.error("KDS emission error:", err);
  }

  return order;
};

/**
 * Track an order by ID (public).
 */
const trackOrder = async (tenantId, orderId) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId, orderSource: "QR" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      subtotal: true,
      tax: true,
      createdAt: true,
      updatedAt: true,
      table: { select: { number: true, name: true } },
      items: {
        select: {
          quantity: true,
          price: true,
          addons: true,
          product: { select: { name: true, image: true } },
        },
      },
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  return order;
};

/**
 * Get all orders for a session (customer can see their table's orders).
 */
const getSessionOrders = async (tenantId, sessionToken) => {
  const session = await prisma.customerSession.findFirst({
    where: { sessionToken, tenantId },
  });

  if (!session) {
    throw ApiError.notFound("Session not found");
  }

  return prisma.order.findMany({
    where: { sessionId: session.id, tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      items: {
        select: {
          quantity: true,
          price: true,
          product: { select: { name: true } },
        },
      },
    },
  });
};

module.exports = {
  getRestaurantInfo,
  initSession,
  getMenu,
  getProduct,
  placeOrder,
  trackOrder,
  getSessionOrders,
};
