import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, X, Delete, CreditCard, Banknote, Smartphone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import useCartStore from '../stores/useCartStore';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [numpadTarget, setNumpadTarget] = useState(null); // productId or null
  const [numpadValue, setNumpadValue] = useState('');

  const cart = useCartStore();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSettings();
  }, []);

  const fetchProducts = async (categoryId, searchTerm) => {
    try {
      const params = {};
      if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
      if (searchTerm) params.search = searchTerm;
      params.limit = 100;
      const { data } = await api.get('/products', { params });
      setProducts(data.data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      if (data.data?.taxRate) {
        cart.setTaxRate(data.data.taxRate);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    fetchProducts(catId, search);
  };

  const handleSearch = (value) => {
    setSearch(value);
    fetchProducts(activeCategory, value);
  };

  const handleNumpadPress = (key) => {
    if (key === 'C') {
      setNumpadValue('');
    } else if (key === 'DEL') {
      setNumpadValue((v) => v.slice(0, -1));
    } else if (key === 'OK') {
      if (numpadTarget && numpadValue) {
        const qty = parseInt(numpadValue, 10);
        if (qty > 0) cart.updateQuantity(numpadTarget, qty);
        setNumpadTarget(null);
        setNumpadValue('');
      }
    } else {
      setNumpadValue((v) => v + key);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[var(--color-border)] bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-bold text-slate-900">POS Terminal</h1>
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="pos-search"
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products or scan barcode..."
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Category Pills */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleCategoryClick('all')}
              className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {products.map((product) => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => cart.addItem(product)}
                disabled={product.stock <= 0}
                className={`group relative flex flex-col items-start rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md hover:border-brand-200 ${
                  product.stock <= 0
                    ? 'opacity-50 cursor-not-allowed border-slate-200'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {/* Product image placeholder */}
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-display font-bold text-lg">
                  {product.name.charAt(0)}
                </div>
                <h3 className="font-medium text-sm text-slate-800 leading-tight line-clamp-2">
                  {product.name}
                </h3>
                <p className="mt-1 font-display font-bold text-brand-600">
                  ₹{product.price.toFixed(2)}
                </p>
                <p className={`mt-0.5 text-xs ${product.stock <= 5 ? 'text-amber-500' : 'text-slate-400'}`}>
                  Stock: {product.stock}
                </p>
                {product.stock <= 0 && (
                  <span className="absolute top-2 right-2 rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                    Out
                  </span>
                )}
              </motion.button>
            ))}
          </div>
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Search size={40} strokeWidth={1.5} />
              <p className="mt-3 text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right — Cart Panel */}
      <div className="flex w-[380px] flex-col border-l border-[var(--color-border)] bg-white shrink-0">
        {/* Cart Header */}
        <div className="border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="font-display text-lg font-bold text-slate-900">Current Order</h2>
          <p className="text-xs text-slate-400">{cart.items.length} item(s)</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <AnimatePresence>
            {cart.items.map((item) => (
              <motion.div
                key={item.productId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">₹{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => cart.updateQuantity(item.productId, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setNumpadTarget(item.productId);
                      setNumpadValue(String(item.quantity));
                    }}
                    className="flex h-7 min-w-[32px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-sm font-medium text-slate-800"
                  >
                    {item.quantity}
                  </button>
                  <button
                    onClick={() => cart.updateQuantity(item.productId, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => cart.removeItem(item.productId)}
                  className="ml-1 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-300">
              <ShoppingCartIcon />
              <p className="mt-2 text-sm">Cart is empty</p>
            </div>
          )}
        </div>

        {/* Numpad */}
        <AnimatePresence>
          {numpadTarget && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[var(--color-border)] bg-slate-50 px-5 py-3 overflow-hidden"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Set Quantity</span>
                <button onClick={() => { setNumpadTarget(null); setNumpadValue(''); }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="mb-2 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-right font-mono text-lg font-bold text-slate-800">
                {numpadValue || '0'}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {['7','8','9','DEL','4','5','6','C','1','2','3','OK','0','00','.',''].map((key, i) => {
                  if (key === '') return <div key={i} />;
                  const isAction = ['DEL', 'C', 'OK'].includes(key);
                  return (
                    <button
                      key={i}
                      onClick={() => handleNumpadPress(key)}
                      className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                        key === 'OK'
                          ? 'bg-brand-600 text-white hover:bg-brand-700'
                          : key === 'DEL'
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : key === 'C'
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          : 'bg-white border border-[var(--color-border)] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {key === 'DEL' ? <Delete size={16} /> : key}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Totals */}
        <div className="border-t border-[var(--color-border)] bg-white px-5 py-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₹{cart.getSubtotal().toFixed(2)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-₹{cart.discount.toFixed(2)}</span>
            </div>
          )}
          {cart.taxRate > 0 && (
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax ({cart.taxRate}%)</span>
              <span>₹{cart.getTax().toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 font-display text-lg font-bold text-slate-900">
            <span>Total</span>
            <span>₹{cart.getTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.items.length === 0}
            className="mt-2 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            onClose={() => setShowCheckout(false)}
            cart={cart}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────── Shopping Cart Placeholder Icon ────── */
function ShoppingCartIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

/* ────── Checkout Modal ────── */
function CheckoutModal({ onClose, cart }) {
  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: Banknote, color: 'emerald' },
    { id: 'CARD', label: 'Card', icon: CreditCard, color: 'blue' },
    { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'purple' },
  ];

  const handleCheckout = async () => {
    if (!method) return;
    setProcessing(true);
    try {
      const payload = {
        items: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        paymentMethod: method,
        discount: cart.discount,
      };
      const { data } = await api.post('/orders', payload);
      setOrderNumber(data.data.orderNumber);
      setSuccess(true);
      cart.clearCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl"
      >
        {success ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">Payment Successful</h3>
            <p className="mt-1 text-sm text-slate-500">Order #{orderNumber}</p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              New Order
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900">Checkout</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 rounded-xl bg-[var(--color-surface-raised)] p-4">
              <div className="flex justify-between font-display text-xl font-bold text-slate-900">
                <span>Total</span>
                <span>₹{cart.getTotal().toFixed(2)}</span>
              </div>
            </div>

            <p className="mb-3 text-sm font-medium text-slate-600">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setMethod(pm.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                    method === pm.id
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-[var(--color-border)] text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <pm.icon size={24} />
                  <span className="text-xs font-medium">{pm.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleCheckout}
              disabled={!method || processing}
              className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                `Pay ₹${cart.getTotal().toFixed(2)}`
              )}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
