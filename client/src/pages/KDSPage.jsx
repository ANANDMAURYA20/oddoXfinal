import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChefHat, Bell, CheckCircle2, ArrowRight, RefreshCw, LogOut, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, connectSocket } from '../config/socket';
import api from '../config/api';
import useAuthStore from '../stores/useAuthStore';

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
  const [station, setStation] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(null);

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
    fetchOrders();

    // Connect socket for real-time updates
    const token = localStorage.getItem('pos_token');
    if (token) {
      const socket = connectSocket(token);

      socket.on('order:new', (order) => {
        setOrders((prev) => {
          // Deduplicate: skip if order already exists (can arrive via both tenant + station rooms)
          if (prev.some((o) => o.id === order.id)) return prev;
          return [order, ...prev];
        });
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

  // When station is selected, join its socket room (and rejoin on reconnection)
  useEffect(() => {
    if (selectedStationId) {
      const socket = getSocket();
      if (socket) {
        socket.emit('kds:join-station', selectedStationId);

        const handleReconnect = () => {
          socket.emit('kds:join-station', selectedStationId);
        };
        socket.on('connect', handleReconnect);

        return () => {
          socket.off('connect', handleReconnect);
        };
      }
    }
  }, [selectedStationId]);

  // Set station from user's assignment or first available
  useEffect(() => {
    if (stations.length > 0) {
      if (user?.kdsStationId) {
        const assigned = stations.find((s) => s.id === user.kdsStationId);
        if (assigned) {
          setStation(assigned);
          setSelectedStationId(assigned.id);
          return;
        }
      }
      // Default to "All" (no filter)
      setStation(null);
      setSelectedStationId(null);
    }
  }, [stations, user]);

  const fetchStations = async () => {
    try {
      const { data } = await api.get('/kds-stations');
      setStations(data.data || []);
    } catch (err) {
      console.error('Failed to fetch KDS stations:', err);
    }
  };

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
      await api.patch(`/orders/${orderId}/status`, { 
        status: newStatus,
        stationId: selectedStationId 
      });
      // Handle the update locally to keep UI snappy, though socket will also broadcast
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          
          // Optimistically update items for this station
          const updatedItems = o.items.map(item => {
            const categoryId = item.product?.categoryId || item.product?.category?.id;
            if (!selectedStationId || (categoryId && station?.categoryIds.includes(categoryId))) {
              return { ...item, status: newStatus };
            }
            return item;
          });
          
          return { ...o, items: updatedItems };
        })
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleStationChange = (stationId) => {
    if (stationId === 'all') {
      setStation(null);
      setSelectedStationId(null);
    } else {
      const s = stations.find((st) => st.id === stationId);
      setStation(s || null);
      setSelectedStationId(stationId);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/kds-login');
  };

  // Filter orders based on selected station's categories
  const filterOrdersByStation = (ordersList) => {
    if (!station || station.categoryIds.length === 0) {
      return ordersList; // No filter = show all
    }
    return ordersList.filter((order) => {
      // Check if any item in the order belongs to a category this station handles
      if (order.items && order.items.length > 0) {
        return order.items.some((item) => {
          const categoryId = item.product?.categoryId || item.product?.category?.id;
          return categoryId && station.categoryIds.includes(categoryId);
        });
      }
      return true; // Show orders without item details (they'll load full data)
    });
  };

  // Filter items within an order to only show items for this station
  const filterOrderItems = (order) => {
    if (!station || station.categoryIds.length === 0 || !order.items) {
      return order.items || [];
    }
    return order.items.filter((item) => {
      const categoryId = item.product?.categoryId || item.product?.category?.id;
      return !categoryId || station.categoryIds.includes(categoryId);
    });
  };

  // Helper to determine the status of an order relative to a specific station
  const getOrderStationStatus = (order) => {
    if (!station || station.categoryIds.length === 0) {
      return order.status; // Global status if no station filter
    }

    const relevantItems = filterOrderItems(order);
    if (relevantItems.length === 0) return null;

    // Determine status based on the progress of relevant items
    if (relevantItems.every((i) => i.status === 'COMPLETED')) return 'COMPLETED';
    if (relevantItems.every((i) => i.status === 'READY' || i.status === 'COMPLETED')) return 'READY';
    if (relevantItems.some((i) => i.status === 'PREPARING' || i.status === 'READY' || i.status === 'COMPLETED')) return 'PREPARING';
    return 'PENDING';
  };

  const getTimeSince = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  const filteredOrders = filterOrdersByStation(orders);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
              <ChefHat size={20} />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-slate-900">Kitchen Display</h1>
              <p className="text-xs text-slate-400">
                {station ? station.name : 'All Stations'} &middot; Real-time orders
              </p>
            </div>
          </div>

          {/* Station Selector */}
          {stations.length > 0 && (
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 ml-4">
              <button
                onClick={() => handleStationChange('all')}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  !selectedStationId
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All
              </button>
              {stations.filter((s) => s.isActive).map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStationChange(s.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedStationId === s.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          {user?.role === 'KDS_STAFF' && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={15} />
              Logout
            </button>
          )}
          {user?.role === 'TENANT_ADMIN' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Monitor size={15} />
              Dashboard
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-4 gap-0 overflow-hidden">
        {STATUS_COLUMNS.map((col) => {
          const columnOrders = filteredOrders.filter((o) => {
            const stationStatus = getOrderStationStatus(o);
            return stationStatus === col.key;
          });
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
                  {columnOrders.map((order) => {
                    const stationItems = filterOrderItems(order);
                    return (
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

                        {/* Items - filtered by station */}
                        <div className="space-y-1.5 mb-3">
                          {stationItems.length > 0 ? stationItems.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">
                                {item.product?.name || 'Item'}
                              </span>
                              <span className="font-medium text-slate-800">x{item.quantity}</span>
                            </div>
                          )) : (
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
                    );
                  })}
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
