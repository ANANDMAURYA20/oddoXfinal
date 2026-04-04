import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Plus } from 'lucide-react';
import axios from 'axios';
import useCustomerStore from '../../stores/useCustomerStore';
import useThemeStore from '../../stores/useThemeStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CustomerConfirmationPage() {
  const { tenantId, tableNumber, orderId } = useParams();
  const navigate = useNavigate();
  const store = useCustomerStore();
  const { mode } = useThemeStore();
  const dark = mode === 'dark';

  const [order, setOrder] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const { data } = await axios.get(`${API}/customer-order/${tenantId}/order/${orderId}/track`);
      setOrder(data.data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    }
  };

  const sym = store.currency === 'INR' ? '₹' : store.currency;

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-6"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className={`text-sm mb-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
            Your order has been sent to the kitchen
          </p>

          {order && (
            <div className={`inline-block mt-4 px-6 py-3 rounded-2xl ${dark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
              <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Order Number</p>
              <p className="text-xl font-bold text-orange-500">{order.orderNumber}</p>
            </div>
          )}
        </motion.div>

        {/* Order summary */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`w-full max-w-sm mt-8 p-4 rounded-2xl ${dark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
          >
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className={dark ? 'text-gray-300' : 'text-gray-600'}>
                    {item.quantity}x {item.product?.name}
                  </span>
                  <span className="font-medium">{sym} {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className={`flex justify-between pt-2 mt-2 border-t font-bold ${dark ? 'border-gray-700' : 'border-gray-200'}`}>
                <span>Total</span>
                <span className="text-orange-500">{sym} {order.totalAmount?.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="w-full max-w-sm mt-8 space-y-3"
        >
          <button
            onClick={() => navigate(`/order/${tenantId}/${tableNumber}/tracking/${orderId}`)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold shadow-lg"
          >
            Track My Order
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => navigate(`/order/${tenantId}/${tableNumber}/menu`)}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold border-2 ${
              dark ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-600'
            }`}
          >
            <Plus size={18} />
            Order More Items
          </button>
        </motion.div>
      </div>
    </div>
  );
}
