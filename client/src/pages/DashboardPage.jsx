import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingBag, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import api from '../config/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [revenueChart, setRevenueChart] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, chartRes, topRes] = await Promise.all([
        api.get('/reports/sales-summary'),
        api.get('/reports/revenue-chart'),
        api.get('/reports/top-products'),
      ]);
      setSummary(summaryRes.data.data);
      setRevenueChart(chartRes.data.data);
      setTopProducts(topRes.data.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = summary
    ? [
        {
          title: 'Total Revenue',
          value: `₹${(summary.totalRevenue || 0).toLocaleString('en-IN')}`,
          icon: DollarSign,
          trend: '+12.5%',
          up: true,
          color: 'brand',
        },
        {
          title: "Today's Sales",
          value: `₹${(summary.todaySales || 0).toLocaleString('en-IN')}`,
          icon: TrendingUp,
          trend: '+8.2%',
          up: true,
          color: 'emerald',
        },
        {
          title: 'Total Orders',
          value: summary.totalOrders || 0,
          icon: ShoppingBag,
          trend: '+5.1%',
          up: true,
          color: 'blue',
        },
        {
          title: 'Avg. Order Value',
          value: `₹${(summary.avgOrderValue || 0).toFixed(0)}`,
          icon: BarChart3,
          trend: '-2.3%',
          up: false,
          color: 'amber',
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">Overview of your store performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${card.color}-50`}>
                <card.icon size={20} className={`text-${card.color}-600`} />
              </div>
              <span
                className={`flex items-center gap-0.5 text-xs font-semibold ${
                  card.up ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {card.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {card.trend}
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-0.5 text-sm text-slate-400">{card.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h3 className="font-display text-base font-semibold text-slate-800 mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-brand-600)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--color-brand-600)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--color-brand-600)', strokeWidth: 2, stroke: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h3 className="font-display text-base font-semibold text-slate-800 mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.slice(0, 6).map((product, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 font-display text-sm font-bold text-brand-600">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{product.name}</p>
                  <p className="text-xs text-slate-400">{product.totalSold} sold</p>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  ₹{(product.totalRevenue || 0).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">No data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
