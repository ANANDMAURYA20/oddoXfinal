import { useState, useEffect } from 'react';
import { Clock, ChefHat, Bell, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, connectSocket } from '../config/socket';
import api from '../config/api';

const STATUS_COLUMNS = [
  { key: 'PENDING', label: 'New Orders', icon: Bell, color: 'amber' },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat, color: 'blue' },
  { key: 'READY', label: 'Ready to Serve', icon: CheckCircle2, color: 'emerald' },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle2, color: 'slate' },
];

const NEXT_STATUS = {
  PENDING: 'PREPARING',
  PREPARING: 'READY',
  READY: 'COMPLETED',
};

const ACTION_LABELS = {
  PENDING: 'Start Cooking',
  PREPARING: 'Mark Ready',
  READY: 'Complete',
};

export default function KDSPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();

    // Connect socket for real-time updates
    const token = localStorage.getItem('pos_token');
    if (token) {
      const socket = connectSocket(token);

      socket.on('order:new', (order) => {
        setOrders((prev) => [order, ...prev]);
      });

      socket.on('order:updated', (updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
        );
      });

      return () => {
        socket.off('order:new');
        socket.off('order:updated');
      };
    }
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/orders', { params: { limit: 50 } });
      setOrders(data.data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const moveOrder = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const getTimeSince = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-6 py-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-900">Kitchen Display</h1>
          <p className="text-xs text-slate-400">Real-time order tracking</p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Columns */}
      <div className="flex-1 grid grid-cols-4 gap-0 overflow-hidden">
        {STATUS_COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.key);
          return (
            <div
              key={col.key}
              className="flex flex-col border-r border-[var(--color-border)] last:border-r-0 overflow-hidden"
            >
              {/* Column Header */}
              <div className={`flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 bg-${col.color}-50`}>
                <col.icon size={18} className={`text-${col.color}-600`} />
                <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                <span className={`ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-${col.color}-100 text-xs font-bold text-${col.color}-700`}>
                  {columnOrders.length}
                </span>
              </div>

              {/* Order Tickets */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[var(--color-surface-raised)]">
                <AnimatePresence>
                  {columnOrders.map((order) => (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm"
                    >
                      {/* Ticket header */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-slate-800">
                          #{order.orderNumber?.slice(-5) || order.id.slice(0, 6)}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} />
                          {getTimeSince(order.createdAt)}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 mb-3">
                        {order.items?.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              {item.product?.name || 'Item'}
                            </span>
                            <span className="font-medium text-slate-800">x{item.quantity}</span>
                          </div>
                        )) || (
                          <p className="text-xs text-slate-400">
                            {order._count?.items || 0} item(s)
                          </p>
                        )}
                      </div>

                      {/* Note */}
                      {order.note && (
                        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                          {order.note}
                        </p>
                      )}

                      {/* Action Button */}
                      {NEXT_STATUS[col.key] && (
                        <button
                          onClick={() => moveOrder(order.id, NEXT_STATUS[col.key])}
                          className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-all ${
                            col.key === 'PENDING'
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : col.key === 'PREPARING'
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-slate-600 text-white hover:bg-slate-700'
                          }`}
                        >
                          {ACTION_LABELS[col.key]}
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {columnOrders.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                    <col.icon size={28} strokeWidth={1.5} />
                    <p className="mt-2 text-xs">No orders</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
