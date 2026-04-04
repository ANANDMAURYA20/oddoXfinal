import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Utensils, CheckCircle, QrCode, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../config/api';
import BillReceipt from '../components/BillReceipt';
import { getImageUrl } from '../utils/imageUrl';

export default function CustomerDisplayPage() {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [orderType, setOrderType] = useState('takeaway');
  const [activeTable, setActiveTable] = useState(null);

  // Checkout state
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Settings
  const [settings, setSettings] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const billRef = useRef(null);

  useEffect(() => {
    fetchSettings();

    // Clock
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    // Listen to POS via BroadcastChannel
    const channel = new BroadcastChannel('pos_customer_display');
    channel.onmessage = (event) => {
      const msg = event.data;

      if (msg.type === 'cart_update') {
        setItems(msg.items || []);
        setSubtotal(msg.subtotal || 0);
        setTax(msg.tax || 0);
        setTotal(msg.total || 0);
        setTaxRate(msg.taxRate || 0);
        setOrderType(msg.orderType || 'takeaway');
        setActiveTable(msg.activeTable || null);
        // If cart has items, exit success state
        if (msg.items?.length > 0) {
          setCheckoutSuccess(false);
          setCompletedOrder(null);
        }
      }

      if (msg.type === 'checkout_success') {
        setCheckoutSuccess(true);
        setCompletedOrder(msg.order || null);
        // Auto-clear after 30 seconds
        setTimeout(() => {
          setCheckoutSuccess(false);
          setCompletedOrder(null);
          setItems([]);
          setSubtotal(0);
          setTax(0);
          setTotal(0);
        }, 30000);
      }
    };

    return () => {
      clearInterval(clockInterval);
      channel.close();
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setSettings(data.data);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const sym = settings?.currency === 'INR' ? '₹' : settings?.currency || '₹';
  const upiId = settings?.upiId || '';
  const storeName = settings?.storeName || 'Store';
  const upiLink = total > 0 ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${total.toFixed(2)}&cu=INR` : '';

  const formatTime = (d) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const formatDate = (d) =>
    d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Checkout Success / Bill View ──
  if (checkoutSuccess && completedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-black/20">
          {settings?.storeLogo && (
            <img src={getImageUrl(settings.storeLogo)} alt="Logo" className="h-10 object-contain" />
          )}
          <h1 className="text-xl font-bold tracking-wide">{storeName}</h1>
          <span className="text-emerald-300 text-sm">{formatTime(currentTime)}</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-12 px-8">
          {/* Success message */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-32 h-32 mx-auto mb-6 rounded-full bg-emerald-500/30 flex items-center justify-center"
            >
              <CheckCircle className="w-16 h-16 text-emerald-300" />
            </motion.div>
            <h2 className="text-4xl font-bold mb-2">Thank You!</h2>
            <p className="text-emerald-300 text-lg mb-4">Payment Successful</p>
            <div className="inline-block bg-white/10 rounded-2xl px-8 py-4 backdrop-blur-sm">
              <p className="text-sm text-emerald-300">Order Number</p>
              <p className="text-3xl font-bold">{completedOrder.orderNumber}</p>
            </div>
            <div className="mt-6 text-emerald-400 text-lg font-bold">
              Total: {sym}{completedOrder.totalAmount?.toFixed(2)}
            </div>
          </motion.div>

          {/* Mini bill */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto"
          >
            <BillReceipt ref={billRef} order={completedOrder} settings={settings} />
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Idle State (no items) ──
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 bg-black/20">
          {settings?.storeLogo && (
            <img src={getImageUrl(settings.storeLogo)} alt="Logo" className="h-10 object-contain" />
          )}
          <h1 className="text-xl font-bold tracking-wide">{storeName}</h1>
          <div className="flex items-center gap-2 text-blue-300 text-sm">
            <Clock size={14} />
            {formatTime(currentTime)}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-8">
              <Utensils className="w-16 h-16 text-blue-300" />
            </div>
          </motion.div>
          <h2 className="text-4xl font-bold mb-3">Welcome to {storeName}</h2>
          <p className="text-blue-300 text-lg">{formatDate(currentTime)}</p>

          {settings?.storeAddress && (
            <p className="text-blue-400/60 text-sm mt-4 text-center max-w-md">{settings.storeAddress}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/20 text-center text-sm text-blue-400/50">
          {settings?.gstNumber && <span>GSTIN: {settings.gstNumber}</span>}
          {settings?.gstNumber && settings?.fssaiNumber && <span className="mx-3">|</span>}
          {settings?.fssaiNumber && <span>FSSAI: {settings.fssaiNumber}</span>}
        </div>
      </div>
    );
  }

  // ── Active Cart View ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 flex flex-col text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 bg-black/30">
        <div className="flex items-center gap-4">
          {settings?.storeLogo && (
            <img src={getImageUrl(settings.storeLogo)} alt="Logo" className="h-10 object-contain" />
          )}
          <h1 className="text-xl font-bold tracking-wide">{storeName}</h1>
        </div>
        <div className="flex items-center gap-4">
          {activeTable && (
            <span className="bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-sm font-medium">
              Table {activeTable}
            </span>
          )}
          <span className="bg-white/10 text-gray-300 px-3 py-1 rounded-full text-sm capitalize">
            {orderType === 'dine-in' ? 'Dine In' : 'Takeaway'}
          </span>
          <span className="text-gray-400 text-sm">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Main content: Items + QR */}
      <div className="flex-1 flex gap-6 px-8 py-6 overflow-hidden">
        {/* Items list */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold">Your Order</h2>
            <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full ml-2">
              {items.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.productId + '_' + index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  layout
                  className="flex items-center gap-4 bg-white/5 rounded-xl p-3 border border-white/10"
                >
                  {/* Item image */}
                  <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden shrink-0">
                    {item.image ? (
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">
                        {item.name?.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{sym}{item.price?.toFixed(2)} each</p>
                  </div>

                  {/* Qty */}
                  <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm font-bold">
                    x{item.quantity}
                  </div>

                  {/* Amount */}
                  <div className="text-right w-20 shrink-0">
                    <p className="font-bold text-sm">{sym}{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Totals bar */}
          <div className="mt-4 bg-white/5 rounded-2xl border border-white/10 p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>{sym}{subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>{settings?.taxLabel || 'Tax'} ({settings?.taxRate || taxRate}%)</span>
                  <span>{sym}{tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-2 mt-2" />
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total</span>
                <motion.span
                  key={total}
                  initial={{ scale: 1.3, color: '#60a5fa' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  className="text-3xl font-bold"
                >
                  {sym}{total.toFixed(2)}
                </motion.span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: QR Code */}
        {upiId && total > 0 && (
          <div className="w-72 shrink-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <QrCode size={18} className="text-purple-600" />
                <h3 className="font-bold text-gray-800 text-sm">Scan to Pay</h3>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3 mb-4">
                <QRCodeSVG
                  value={upiLink}
                  size={180}
                  level="H"
                  fgColor="#1a1a1a"
                  includeMargin={false}
                />
              </div>

              <div className="bg-purple-50 rounded-xl p-3 mb-2">
                <p className="text-xs text-purple-500 font-medium">Amount</p>
                <p className="text-2xl font-bold text-purple-700">{sym}{total.toFixed(2)}</p>
              </div>

              <p className="text-[10px] text-gray-400 font-mono break-all">{upiId}</p>
            </motion.div>

            <p className="text-gray-500 text-xs mt-4 text-center">
              Pay via any UPI app
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-8 py-3 bg-black/30 flex items-center justify-between text-xs text-gray-500">
        <span>{storeName}</span>
        <div>
          {settings?.gstNumber && <span>GSTIN: {settings.gstNumber}</span>}
          {settings?.gstNumber && settings?.fssaiNumber && <span className="mx-2">|</span>}
          {settings?.fssaiNumber && <span>FSSAI: {settings.fssaiNumber}</span>}
        </div>
      </div>
    </div>
  );
}
