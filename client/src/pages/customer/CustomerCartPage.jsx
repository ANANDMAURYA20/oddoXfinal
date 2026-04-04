import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, Minus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import axios from 'axios';
import useCustomerStore from '../../stores/useCustomerStore';
import useThemeStore from '../../stores/useThemeStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CustomerCartPage() {
  const { tenantId, tableId } = useParams();
  const navigate = useNavigate();
  const store = useCustomerStore();
  const { mode } = useThemeStore();
  const dark = mode === 'dark';

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  const sym = store.currency === 'INR' ? '₹' : store.currency;
  const subtotal = store.getSubtotal();
  const tax = store.getTax();
  const total = store.getTotal();

  const handlePlaceOrder = async () => {
    if (store.items.length === 0) return;
    setPlacing(true);
    setError(null);

    try {
      const payload = {
        tableId,
        sessionToken: store.sessionToken,
        items: store.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          addons: item.addons.map((a) => ({ id: a.id, name: a.name, price: a.price })),
          note: item.note || undefined,
        })),
      };

      const { data } = await axios.post(`${API}/customer-order/${tenantId}/order`, payload);
      const order = data.data;

      store.setCurrentOrder(order.id, order.orderNumber);
      store.addToHistory(order);
      store.clearCart();

      navigate(`/order/${tenantId}/${tableId}/confirmation/${order.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (store.items.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className={`flex items-center gap-3 px-4 py-3 border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
          <button onClick={() => navigate(-1)} className="p-1"><ChevronLeft size={24} /></button>
          <h1 className="text-lg font-bold">Your Cart</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <ShoppingBag className={`w-20 h-20 mb-4 ${dark ? 'text-gray-700' : 'text-gray-300'}`} />
          <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
          <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Add some delicious items from the menu</p>
          <button
            onClick={() => navigate(`/order/${tenantId}/${tableId}/menu`)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-30 ${dark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1"><ChevronLeft size={24} /></button>
          <div>
            <h1 className="text-lg font-bold">Your Cart</h1>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {store.items.length} item{store.items.length !== 1 ? 's' : ''} · Table {store.tableNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Cart items */}
      <div className="px-4 py-4 pb-56">
        <AnimatePresence>
          {store.items.map((item) => (
            <motion.div
              key={item.key}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className={`p-4 rounded-2xl mb-3 ${dark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
            >
              <div className="flex gap-3">
                {/* Item image */}
                <div className="w-16 h-16 rounded-xl bg-orange-50 shrink-0 overflow-hidden">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  )}
                </div>

                {/* Item details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
                    <button
                      onClick={() => store.removeItem(item.key)}
                      className="p-1 text-red-400 hover:text-red-500 shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Addons */}
                  {item.addons.length > 0 && (
                    <p className={`text-xs mt-0.5 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      + {item.addons.map((a) => a.name).join(', ')}
                    </p>
                  )}

                  {item.note && (
                    <p className={`text-xs italic mt-0.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                      "{item.note}"
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-orange-500">
                      {sym} {(item.price * item.quantity).toFixed(2)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => store.updateQuantity(item.key, item.quantity - 1)}
                        className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        onClick={() => store.updateQuantity(item.key, item.quantity + 1)}
                        className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add more items */}
        <button
          onClick={() => navigate(`/order/${tenantId}/${tableId}/menu`)}
          className={`w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium ${
            dark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
          }`}
        >
          + Add More Items
        </button>
      </div>

      {/* Bottom summary & checkout */}
      <div className={`fixed bottom-0 left-0 right-0 ${dark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-t ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="px-5 pt-4 pb-2">
          {/* Price breakdown */}
          <div className="space-y-1 text-sm mb-3">
            <div className="flex justify-between">
              <span className={dark ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
              <span>{sym} {subtotal.toFixed(2)}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between">
                <span className={dark ? 'text-gray-400' : 'text-gray-500'}>{store.taxLabel}</span>
                <span>{sym} {tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-1 border-t border-gray-200 dark:border-gray-700">
              <span>Total</span>
              <span className="text-orange-500">{sym} {total.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-xs text-center mb-2">{error}</div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
          >
            {placing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              `Confirm Order · ${sym} ${total.toFixed(2)}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
