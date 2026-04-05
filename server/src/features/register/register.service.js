const prisma = require("../../config/db");
const ApiError = require("../../utils/ApiError");

/**
 * Open a new register session for the day.
 * Only one OPEN session per cashier at a time.
 */
const openRegister = async (tenantId, cashierId, { openingCash }) => {
  // Check if there's already an open session for this cashier
  const existing = await prisma.registerSession.findFirst({
    where: { tenantId, cashierId, status: "OPEN" },
  });

  if (existing) {
    throw ApiError.badRequest("You already have an open register session. Close it before opening a new one.");
  }

  const session = await prisma.registerSession.create({
    data: {
      openingCash,
      status: "OPEN",
      cashierId,
      tenantId,
    },
    include: {
      cashier: { select: { id: true, name: true } },
    },
  });

  return session;
};

/**
 * Get the current open register session for a cashier.
 */
const getActiveSession = async (tenantId, cashierId) => {
  const session = await prisma.registerSession.findFirst({
    where: { tenantId, cashierId, status: "OPEN" },
    include: {
      cashier: { select: { id: true, name: true } },
    },
  });

  return session;
};

/**
 * Get session summary: all orders created between session open and now,
 * broken down by payment method.
 */
const getSessionSummary = async (tenantId, cashierId, sessionId) => {
  const session = await prisma.registerSession.findFirst({
    where: { id: sessionId, tenantId, cashierId },
  });

  if (!session) {
    throw ApiError.notFound("Register session not found");
  }

  // Get all completed/paid orders by this cashier since the session was opened
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      cashierId,
      createdAt: { gte: session.openedAt },
      status: { in: ["COMPLETED", "PENDING", "PREPARING", "READY"] },
    },
  });

  let totalCashSales = 0;
  let totalCardSales = 0;
  let totalUpiSales = 0;
  let totalRevenue = 0;

  for (const order of orders) {
    totalRevenue += order.totalAmount;
    if (order.paymentMethod === "CASH") totalCashSales += order.totalAmount;
    else if (order.paymentMethod === "CARD") totalCardSales += order.totalAmount;
    else if (order.paymentMethod === "UPI") totalUpiSales += order.totalAmount;
  }

  const expectedCash = session.openingCash + totalCashSales;

  return {
    session,
    totalOrders: orders.length,
    totalCashSales,
    totalCardSales,
    totalUpiSales,
    totalRevenue,
    expectedCash,
    openingCash: session.openingCash,
  };
};

/**
 * Close the register session with actual closing cash count.
 * Snapshots all totals for historical record.
 */
const closeRegister = async (tenantId, cashierId, sessionId, { closingCash, closingNote }) => {
  const summary = await getSessionSummary(tenantId, cashierId, sessionId);

  if (!summary.session) {
    throw ApiError.notFound("Register session not found");
  }

  if (summary.session.status === "CLOSED") {
    throw ApiError.badRequest("This register session is already closed");
  }

  const cashDifference = closingCash - summary.expectedCash;

  const closed = await prisma.registerSession.update({
    where: { id: sessionId },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      closingCash,
      closingNote: closingNote || null,
      totalCashSales: summary.totalCashSales,
      totalCardSales: summary.totalCardSales,
      totalUpiSales: summary.totalUpiSales,
      totalOrders: summary.totalOrders,
      totalRevenue: summary.totalRevenue,
      expectedCash: summary.expectedCash,
      cashDifference,
    },
    include: {
      cashier: { select: { id: true, name: true } },
    },
  });

  return closed;
};

/**
 * List register session history for a tenant.
 */
const listSessions = async (tenantId, { page = 1, limit = 20, cashierId }) => {
  const skip = (page - 1) * limit;
  const where = { tenantId };
  if (cashierId) where.cashierId = cashierId;

  const [sessions, total] = await Promise.all([
    prisma.registerSession.findMany({
      where,
      skip,
      take: limit,
      orderBy: { openedAt: "desc" },
      include: {
        cashier: { select: { id: true, name: true } },
      },
    }),
    prisma.registerSession.count({ where }),
  ]);

  return {
    sessions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

module.exports = { openRegister, getActiveSession, getSessionSummary, closeRegister, listSessions };
