import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../config/api';

export default function ReportsPage() {
  const [dailySales, setDailySales] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [dailyRes, summaryRes] = await Promise.all([
        api.get('/reports/daily-sales'),
        api.get('/reports/sales-summary'),
      ]);
      setDailySales(dailyRes.data.data);
      setSummary(summaryRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Reports</h1>
        <p className="mt-0.5 text-sm text-slate-500">Sales analytics and insights</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                <TrendingUp size={20} className="text-brand-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Total Revenue</span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">
              ₹{(summary.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <BarChart3 size={20} className="text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Total Orders</span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">
              {summary.totalOrders || 0}
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">Today's Sales</span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-900">
              ₹{(summary.todaySales || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      )}

      {/* Daily Sales Bar Chart */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold text-slate-800 mb-4">Daily Sales (Last 30 days)</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={dailySales}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
            />
            <Bar dataKey="revenue" fill="#4f46e5" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
