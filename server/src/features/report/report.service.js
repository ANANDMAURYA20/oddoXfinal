const prisma = require("../../config/db");

/**
 * Sales summary: total orders, total revenue, average order value.
 */
const getSalesSummary = async (tenantId) => {
  const [totals, todayTotals] = await Promise.all([
    prisma.order.aggregate({
      where: { tenantId, status: "COMPLETED" },
      _sum: { totalAmount: true },
      _count: true,
      _avg: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        tenantId,
        status: "COMPLETED",
        createdAt: { gte: startOfDay(new Date()) },
      },
      _sum: { totalAmount: true },
      _count: true,
    }),
  ]);

  return {
    allTime: {
      totalOrders: totals._count,
      totalRevenue: totals._sum.totalAmount || 0,
      avgOrderValue: Math.round((totals._avg.totalAmount || 0) * 100) / 100,
    },
    today: {
      totalOrders: todayTotals._count,
      totalRevenue: todayTotals._sum.totalAmount || 0,
    },
  };
};

/**
 * Daily sales for the last N days (default 30).
 */
const getDailySales = async (tenantId, { days = 30 }) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      createdAt: { gte: startDate },
    },
    select: { totalAmount: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailyMap = new Map();
  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().slice(0, 10);
    const existing = dailyMap.get(dateKey) || { date: dateKey, revenue: 0, orders: 0 };
    existing.revenue += order.totalAmount;
    existing.orders += 1;
    dailyMap.set(dateKey, existing);
  }

  return Array.from(dailyMap.values());
};

/**
 * Top selling products by quantity sold.
 */
const getTopProducts = async (tenantId, { limit = 10 }) => {
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: { tenantId, status: "COMPLETED" },
    },
    _sum: { quantity: true, price: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: limit,
  });

  // Fetch product names
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p.name]));

  return topProducts.map((p) => ({
    productId: p.productId,
    productName: productMap.get(p.productId) || "Unknown",
    totalQuantity: p._sum.quantity,
    totalRevenue: p._sum.price,
  }));
};

/**
 * Revenue chart data (grouped by month for the current year).
 */
const getRevenueChart = async (tenantId) => {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      status: "COMPLETED",
      createdAt: { gte: startOfYear },
    },
    select: { totalAmount: true, createdAt: true },
  });

  // Group by month
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthlyData = months.map((month, i) => ({ month, revenue: 0, orders: 0 }));

  for (const order of orders) {
    const monthIndex = order.createdAt.getMonth();
    monthlyData[monthIndex].revenue += order.totalAmount;
    monthlyData[monthIndex].orders += 1;
  }

  return monthlyData;
};

// ── Helper ──────────────────────────────────────

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

module.exports = { getSalesSummary, getDailySales, getTopProducts, getRevenueChart };
