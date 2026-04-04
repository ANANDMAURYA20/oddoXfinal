import { useState, useEffect } from 'react';
import { Package, Eye, Search, Filter, ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../config/api';
import BillModal from '../components/BillModal';

const STATUS_BADGE = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PREPARING: 'bg-blue-50 text-blue-700 border-blue-200',
  READY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-slate-50 text-slate-600 border-slate-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  REFUNDED: 'bg-purple-50 text-purple-600 border-purple-200',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billOrder, setBillOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { page: pagination.page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/orders', { params });
      setOrders(data.data.orders);
      setPagination((prev) => ({ ...prev, ...data.data.pagination }));
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (orderId) => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setSelectedOrder(data.data);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Orders</h1>
          <p className="mt-0.5 text-sm text-slate-500">Track and manage all orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {['', 'PENDING', 'PREPARING', 'READY', 'COMPLETED', 'REFUNDED'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                statusFilter === s
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order #</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-sm font-mono font-medium text-slate-800">
                  {order.orderNumber || order.id.slice(0, 8)}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">
                  {order.customer?.name || 'Walk-in'}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">
                  {order._count?.items || 0} items
                </td>
                <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                  ₹{order.totalAmount?.toFixed(2)}
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[order.status] || ''}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-400">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => viewOrder(order.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-300">
            <Package size={36} strokeWidth={1.5} />
            <p className="mt-2 text-sm">No orders found</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3">
            <p className="text-xs text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-[var(--color-border)] p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-[var(--color-border)] p-1.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-slate-900 mb-4">
              Order #{selectedOrder.orderNumber}
            </h3>
            <div className="space-y-2 mb-4">
              {selectedOrder.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-slate-600">{item.product?.name} x{item.quantity}</span>
                  <span className="font-medium text-slate-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-slate-200 pt-3 space-y-1">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span><span>₹{selectedOrder.subtotal?.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span><span>-₹{selectedOrder.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-500">
                <span>Tax</span><span>₹{selectedOrder.tax?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span><span>₹{selectedOrder.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setBillOrder(selectedOrder); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-brand-200 py-2.5 text-sm font-medium text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <Receipt size={14} />
                View Bill
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bill Modal */}
      {billOrder && (
        <BillModal order={billOrder} onClose={() => setBillOrder(null)} />
      )}
    </div>
  );
}
