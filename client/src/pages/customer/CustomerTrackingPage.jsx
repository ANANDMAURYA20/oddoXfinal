import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, ChefHat, Bell, CheckCircle2, Plus, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import axios from 'axios';
import useCustomerStore from '../../stores/useCustomerStore';
import useThemeStore from '../../stores/useThemeStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const STATUS_FLOW = ['PENDING', 'PREPARING', 'READY', 'COMPLETED'];

const STATUS_CONFIG = {
  PENDING: {
    label: 'Order Received',
    sublabel: 'Waiting for kitchen to start',
    icon: Clock,
    color: 'text-amber-500',
    bg: 'bg-amber-500',
  },
  PREPARING: {
    label: 'Preparing',
    sublabel: 'Your food is being prepared',
    icon: ChefHat,
    color: 'text-blue-500',
    bg: 'bg-blue-500',
  },
  READY: {
    label: 'Ready to Serve',
    sublabel: 'Your order will be served shortly',
    icon: Bell,
    color: 'text-green-500',
    bg: 'bg-green-500',
  },
  COMPLETED: {
    label: 'Completed',
    sublabel: 'Enjoy your meal!',
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500',
  },
};

export default function CustomerTrackingPage() {
  const { tenantId, tableId, orderId } = useParams();
  const navigate = useNavigate();
  const store = useCustomerStore();
  const { mode } = useThemeStore();
  const dark = mode === 'dark';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${API}/customer-order/${tenantId}/order/${orderId}/track`);
      setOrder(data.data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const socket = io(SOCKET_URL, {
      auth: { isCustomer: true, tenantId, orderId },
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => {
      socket.emit('customer:track-order', orderId);
    });

    socket.on('order:status-changed', (data) => {
      if (data.orderId === orderId) {
        setOrder((prev) => (prev ? { ...prev, status: data.status, updatedAt: data.updatedAt } : prev));
      }
    });

    socketRef.current = socket;
  };

  const currentStatusIndex = order ? STATUS_FLOW.indexOf(order.status) : 0;
  const sym = store.currency === 'INR' ? '₹' : store.currency;

  const getTimeElapsed = () => {
    if (!order) return '';
    const mins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins === 1) return '1 min ago';
    return `${mins} mins ago`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="text-center">
          <p className="text-xl mb-2">Order not found</p>
          <button onClick={() => navigate(-1)} className="text-orange-500 font-semibold">Go back</button>
        </div>
      </div>
    );
  }

  const currentConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const CurrentIcon = currentConfig.icon;

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-30 ${dark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(`/order/${tenantId}/${tableId}/menu`)} className="p-1">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold">Track Order</h1>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {order.orderNumber} · {getTimeElapsed()}
            </p>
          </div>
          <button onClick={fetchOrder} className="ml-auto p-2">
            <RefreshCw size={18} className={dark ? 'text-gray-400' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Current status hero */}
        <motion.div
          key={order.status}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`text-center mb-8 p-6 rounded-3xl ${dark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
        >
          <div className={`w-20 h-20 mx-auto rounded-full ${currentConfig.bg} bg-opacity-20 flex items-center justify-center mb-4`}>
            <CurrentIcon className={`w-10 h-10 ${currentConfig.color}`} />
          </div>
          <h2 className="text-xl font-bold mb-1">{currentConfig.label}</h2>
          <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{currentConfig.sublabel}</p>
        </motion.div>

        {/* Status timeline */}
        <div className="mb-8">
          <h3 className="font-semibold mb-4">Order Progress</h3>
          <div className="space-y-0">
            {STATUS_FLOW.map((status, index) => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const isActive = index <= currentStatusIndex;
              const isCurrent = index === currentStatusIndex;

              return (
                <div key={status} className="flex items-start gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.2 : 1,
                        backgroundColor: isActive ? undefined : undefined,
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isActive ? config.bg : dark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : dark ? 'text-gray-500' : 'text-gray-400'} />
                    </motion.div>
                    {index < STATUS_FLOW.length - 1 && (
                      <div className={`w-0.5 h-10 ${isActive ? config.bg : dark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    )}
                  </div>

                  {/* Label */}
                  <div className="pt-2">
                    <p className={`font-medium text-sm ${isActive ? '' : dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {config.label}
                    </p>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}
                      >
                        {config.sublabel}
                      </motion.p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order items */}
        <div className={`p-4 rounded-2xl ${dark ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-6`}>
          <h3 className="font-semibold mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${dark ? 'bg-gray-700' : 'bg-orange-100 text-orange-600'}`}>
                    {item.quantity}
                  </span>
                  <span>{item.product?.name}</span>
                </div>
                <span className="font-medium">{sym} {(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className={`flex justify-between pt-2 mt-2 border-t font-bold ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
              <span>Total</span>
              <span className="text-orange-500">{sym} {order.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Order more */}
        <button
          onClick={() => navigate(`/order/${tenantId}/${tableId}/menu`)}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold border-2 ${
            dark ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-600'
          }`}
        >
          <Plus size={18} />
          Order More Items
        </button>
      </div>
    </div>
  );
}
