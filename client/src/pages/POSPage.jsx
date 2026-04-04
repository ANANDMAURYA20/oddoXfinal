import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Trash2, X, Delete, CreditCard, Banknote, Smartphone, Check, ArrowLeft, LogOut, UtensilsCrossed, ShoppingBag, PauseCircle, ChefHat, Grid3X3, Receipt, BarChart3, Eye, IndianRupee, DoorOpen, DoorClosed, Clock, TrendingUp, Wallet, AlertTriangle, UserPlus, Phone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';
import { getImageUrl } from '../utils/imageUrl';
import useCartStore from '../stores/useCartStore';
import useAuthStore from '../stores/useAuthStore';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [showTableView, setShowTableView] = useState(false);
  const [totalTables, setTotalTables] = useState(0);
  const [numpadTarget, setNumpadTarget] = useState(null); // productId or null
  const [numpadValue, setNumpadValue] = useState('');
  const [showMyBills, setShowMyBills] = useState(false);
  const [showMyReport, setShowMyReport] = useState(false);

  // Register session state
  const [registerSession, setRegisterSession] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(true);
  const [showCloseRegister, setShowCloseRegister] = useState(false);

  const cart = useCartStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkRegisterSession();
  }, []);

  useEffect(() => {
    if (registerSession) {
      fetchProducts();
      fetchCategories();
      fetchSettings();
    }
  }, [registerSession]);

  const checkRegisterSession = async () => {
    try {
      setRegisterLoading(true);
      const { data } = await api.get('/register/active');
      setRegisterSession(data.data || null);
    } catch (err) {
      console.error('Failed to check register session:', err);
      setRegisterSession(null);
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleOpenRegister = async (openingCash) => {
    try {
      const { data } = await api.post('/register/open', { openingCash });
      setRegisterSession(data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open register');
    }
  };

  const handleCloseRegister = () => {
    setRegisterSession(null);
    setShowCloseRegister(false);
  };

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
      if (data.data?.totalTables) {
        setTotalTables(data.data.totalTables);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };

  const handleSendKot = async () => {
    if (!cart.activeTable || cart.items.length === 0) return;
    const tableNum = cart.activeTable;
    try {
      // Determine which items are NEW or have INCREASED quantity since last KOT
      const existing = cart.heldTables[tableNum];
      const previousKotItems = existing?.kotItems || [];
      const activeOrderId = existing?.activeOrderId;

      const newItems = [];
      for (const item of cart.items) {
        const prev = previousKotItems.find((k) => k.productId === item.productId);
        if (!prev) {
          newItems.push({ productId: item.productId, quantity: item.quantity });
        } else if (item.quantity > prev.quantity) {
          newItems.push({ productId: item.productId, quantity: item.quantity - prev.quantity });
        }
      }

      if (newItems.length === 0) {
        alert('No new items to send to kitchen');
        return;
      }

      let orderId = activeOrderId;

      if (activeOrderId) {
        // APPEND to existing order
        await api.patch(`/orders/${activeOrderId}/items`, { items: newItems });
      } else {
        // CREATE new order
        const payload = {
          items: newItems,
          paymentMethod: 'CASH',
          discount: cart.discount,
          note: `Dine-in | Table ${tableNum}`,
          status: 'PENDING',
        };
        const { data } = await api.post('/orders', payload);
        orderId = data.data.id;
      }

      // Mark KOT sent in store, then auto-hold the table
      cart.sendKot(orderId);
      cart.holdTable(tableNum, orderId);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send KOT');
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

  // Show loading while checking register
  if (registerLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
          <p className="mt-4 text-sm text-slate-500">Loading register...</p>
        </div>
      </div>
    );
  }

  // Show Open Register modal if no active session
  if (!registerSession) {
    return <OpenRegisterModal onOpen={handleOpenRegister} user={user} navigate={navigate} logout={logout} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left — Product Grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[var(--color-border)] bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            {user?.role === 'TENANT_ADMIN' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} />
                Dashboard
              </button>
            )}
            <h1 className="font-display text-xl font-bold text-slate-900">POS Terminal</h1>
            {/* Register session indicator */}
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <DoorOpen size={14} />
              Register Open
              <span className="text-emerald-500">|</span>
              <Clock size={12} />
              {new Date(registerSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
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
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowMyBills(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Receipt size={16} />
                My Bills
              </button>
              <button
                onClick={() => setShowMyReport(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <BarChart3 size={16} />
                My Report
              </button>
              <button
                onClick={() => setShowCloseRegister(true)}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <DoorClosed size={16} />
                Close Day
              </button>
              {user?.role === 'CASHIER' && (
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              )}
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
                className={`group relative flex flex-col rounded-xl border bg-white text-left transition-all hover:shadow-md hover:border-brand-200 overflow-hidden ${
                  product.stock <= 0
                    ? 'opacity-50 cursor-not-allowed border-slate-200'
                    : 'border-[var(--color-border)]'
                }`}
              >
                {/* Image area */}
                <div className="relative w-full h-28 bg-slate-100">
                  {product.image ? (
                    <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-50 text-brand-600 font-display font-bold text-2xl">
                      {product.name.charAt(0)}
                    </div>
                  )}
                  {/* Stock badge top-right */}
                  <span className={`absolute top-1.5 right-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    product.stock <= 0
                      ? 'bg-red-100 text-red-600'
                      : product.stock <= 5
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-white/80 backdrop-blur-sm text-slate-600'
                  }`}>
                    {product.stock <= 0 ? 'Out' : `Stock: ${product.stock}`}
                  </span>
                </div>
                {/* Name left, Price right */}
                <div className="flex items-center justify-between w-full px-3 py-2.5">
                  <h3 className="font-medium text-sm text-slate-800 leading-tight line-clamp-1 mr-2">
                    {product.name}
                  </h3>
                  <span className="font-display font-bold text-brand-600 text-sm whitespace-nowrap">
                    ₹{product.price.toFixed(2)}
                  </span>
                </div>
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">Current Order</h2>
              <p className="text-xs text-slate-400">{cart.items.length} item(s)</p>
            </div>
            {/* Dine-in / Takeaway toggle */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => cart.setOrderType('dine-in')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  cart.orderType === 'dine-in'
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <UtensilsCrossed size={13} />
                Dine-in
              </button>
              <button
                onClick={() => { cart.setOrderType('takeaway'); setShowTableView(false); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  cart.orderType === 'takeaway'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ShoppingBag size={13} />
                Takeaway
              </button>
            </div>
          </div>

          {/* Active table indicator + table select button for dine-in */}
          {cart.orderType === 'dine-in' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTableView(true)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                  cart.activeTable
                    ? 'border-orange-300 bg-orange-50 text-orange-700'
                    : 'border-slate-300 bg-slate-50 text-slate-600 animate-pulse'
                }`}
              >
                <Grid3X3 size={14} />
                {cart.activeTable ? `Table ${cart.activeTable}` : 'Select Table'}
              </button>
              {cart.activeTable && cart.items.length > 0 && (
                <>
                  <button
                    onClick={handleSendKot}
                    className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                  >
                    <ChefHat size={13} />
                    KOT
                  </button>
                  <button
                    onClick={() => cart.holdTable(cart.activeTable)}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                  >
                    <PauseCircle size={13} />
                    Hold
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <CustomerSection cart={cart} />

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
            onClick={() => {
              if (cart.orderType === 'dine-in' && !cart.activeTable) {
                setShowTableView(true);
              } else {
                setShowCheckout(true);
              }
            }}
            disabled={cart.items.length === 0}
            className="mt-2 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {cart.orderType === 'dine-in' && !cart.activeTable ? 'Select Table First' : 'Proceed to Checkout'}
          </button>
        </div>
      </div>

      {/* Table View Modal */}
      <AnimatePresence>
        {showTableView && (
          <TableViewModal
            totalTables={totalTables}
            cart={cart}
            onSelectTable={(num) => {
              cart.selectTable(num);
              setShowTableView(false);
            }}
            onClose={() => setShowTableView(false)}
          />
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal
            onClose={() => setShowCheckout(false)}
            cart={cart}
          />
        )}
      </AnimatePresence>

      {/* My Bills Modal */}
      <AnimatePresence>
        {showMyBills && (
          <MyBillsModal
            cashierId={user?.id}
            onClose={() => setShowMyBills(false)}
          />
        )}
      </AnimatePresence>

      {/* My Report Modal */}
      <AnimatePresence>
        {showMyReport && (
          <MyReportModal
            cashierId={user?.id}
            cashierName={user?.name}
            onClose={() => setShowMyReport(false)}
          />
        )}
      </AnimatePresence>

      {/* Close Register Modal */}
      <AnimatePresence>
        {showCloseRegister && registerSession && (
          <CloseRegisterModal
            session={registerSession}
            onClose={() => setShowCloseRegister(false)}
            onClosed={handleCloseRegister}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────── Customer Section (collapsible) ────── */
function CustomerSection({ cart }) {
  const [expanded, setExpanded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const hasCustomer = cart.customerName || cart.customerPhone;

  const searchCustomer = async (phone) => {
    if (phone.length < 3) { setSuggestions([]); return; }
    try {
      setSearching(true);
      const { data } = await api.get('/customers', { params: { search: phone, limit: 5 } });
      setSuggestions(data.data?.customers || data.data || []);
    } catch { setSuggestions([]); }
    finally { setSearching(false); }
  };

  const selectCustomer = (c) => {
    cart.setCustomer(c.name, c.phone || '', c.id);
    setSuggestions([]);
  };

  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-5 py-2.5 text-xs hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <UserPlus size={14} className={hasCustomer ? 'text-brand-600' : 'text-slate-400'} />
          {hasCustomer ? (
            <span className="font-medium text-slate-700">
              {cart.customerName}{cart.customerPhone ? ` | ${cart.customerPhone}` : ''}
            </span>
          ) : (
            <span className="text-slate-400">Add Customer (optional)</span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-3 space-y-2">
              {/* Phone with search */}
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={cart.customerPhone}
                  onChange={(e) => {
                    cart.setCustomer(cart.customerName, e.target.value, null);
                    searchCustomer(e.target.value);
                  }}
                  placeholder="Mobile number"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                />
                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-[var(--color-border)] bg-white shadow-lg overflow-hidden">
                    {suggestions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => selectCustomer(c)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-brand-50 transition-colors"
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-xs font-bold">
                          {c.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Name */}
              <div className="relative">
                <UserPlus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={cart.customerName}
                  onChange={(e) => cart.setCustomer(e.target.value, cart.customerPhone, cart.customerId)}
                  placeholder="Customer name"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-9 pr-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-100"
                />
              </div>
              {hasCustomer && (
                <button
                  onClick={() => { cart.clearCustomer(); setSuggestions([]); }}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  Clear customer
                </button>
              )}
            </div>
          </motion.div>
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

/* ────── Table View Modal ────── */
function TableViewModal({ totalTables, cart, onSelectTable, onClose }) {
  const tables = Array.from({ length: totalTables || 10 }, (_, i) => i + 1);

  const STATUS_STYLES = {
    free: 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50',
    active: 'border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-200',
    occupied: 'border-amber-400 bg-amber-50 text-amber-700',
    'kot-sent': 'border-orange-400 bg-orange-50 text-orange-700',
  };

  const STATUS_LABELS = {
    free: 'Free',
    active: 'Active',
    occupied: 'Held',
    'kot-sent': 'KOT Sent',
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
        className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Select Table</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tap a table to assign this order</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`h-3 w-3 rounded-full ${
                key === 'free' ? 'bg-slate-200' :
                key === 'active' ? 'bg-brand-500' :
                key === 'occupied' ? 'bg-amber-400' :
                'bg-orange-400'
              }`} />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Table Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {tables.map((num) => {
              const status = cart.getTableStatus(num);
              const held = cart.heldTables[num];
              return (
                <motion.button
                  key={num}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelectTable(num)}
                  className={`relative flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${STATUS_STYLES[status]}`}
                >
                  <UtensilsCrossed size={20} className="mb-1.5" />
                  <span className="text-sm font-bold">T-{num}</span>
                  <span className={`text-[10px] font-medium mt-0.5 ${
                    status === 'free' ? 'text-slate-400' : ''
                  }`}>
                    {STATUS_LABELS[status]}
                  </span>
                  {held && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1">
                      {held.items.length}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {totalTables === 0 && (
          <div className="text-center py-10 text-slate-400">
            <Grid3X3 size={40} strokeWidth={1.5} className="mx-auto mb-2" />
            <p className="text-sm">No tables configured</p>
            <p className="text-xs mt-1">Go to Settings to set your total number of tables</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ────── My Bills Modal ────── */
function MyBillsModal({ cashierId, onClose }) {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    fetchBills();
  }, [dateFilter]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const params = { cashierId, limit: 100 };
      const now = new Date();
      if (dateFilter === 'today') {
        params.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        params.endDate = now.toISOString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
        params.endDate = now.toISOString();
      }
      const { data } = await api.get('/orders', { params });
      setBills(data.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS = {
    PENDING: 'bg-amber-100 text-amber-700',
    PREPARING: 'bg-blue-100 text-blue-700',
    READY: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-slate-100 text-slate-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
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
        className="w-full max-w-2xl rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">My Bills</h3>
            <p className="text-xs text-slate-500 mt-0.5">{bills.length} order(s)</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Filter */}
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'all', label: 'All' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDateFilter(f.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    dateFilter === f.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Bills List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Receipt size={40} strokeWidth={1.5} />
              <p className="mt-2 text-sm">No bills found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-xs font-medium text-slate-500">
                  <th className="px-6 py-3">Order #</th>
                  <th className="px-3 py-3">Time</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3">Amount</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 font-mono text-sm font-semibold text-slate-800">
                      #{bill.orderNumber?.slice(-5) || bill.id.slice(0, 6)}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {new Date(bill.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">
                      {bill.items?.length || 0} item(s)
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-slate-800">
                      ₹{bill.totalAmount?.toFixed(2)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {bill.paymentMethod}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[bill.status] || 'bg-slate-100 text-slate-600'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setSelectedBill(selectedBill?.id === bill.id ? null : bill)}
                        className="text-slate-400 hover:text-brand-600 transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Bill Detail Drawer */}
        <AnimatePresence>
          {selectedBill && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[var(--color-border)] bg-slate-50 px-6 py-4 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-700">
                  Order #{selectedBill.orderNumber?.slice(-5)} Details
                </h4>
                <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              {selectedBill.note && (
                <p className="mb-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">{selectedBill.note}</p>
              )}
              <div className="space-y-1.5">
                {selectedBill.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-600">{item.product?.name || 'Item'} x{item.quantity}</span>
                    <span className="font-medium text-slate-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-dashed border-slate-200 pt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span><span>₹{selectedBill.subtotal?.toFixed(2)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Discount</span><span>-₹{selectedBill.discount?.toFixed(2)}</span>
                  </div>
                )}
                {selectedBill.tax > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Tax</span><span>₹{selectedBill.tax?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900">
                  <span>Total</span><span>₹{selectedBill.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ────── My Report Modal ────── */
function MyReportModal({ cashierId, cashierName, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    fetchReport();
  }, [dateFilter]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = { cashierId, limit: 500 };
      const now = new Date();
      if (dateFilter === 'today') {
        params.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        params.endDate = now.toISOString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString();
        params.endDate = now.toISOString();
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        params.startDate = monthAgo.toISOString();
        params.endDate = now.toISOString();
      }
      const { data } = await api.get('/orders', { params });
      const orders = data.data.orders || [];

      // Calculate report from orders
      const totalOrders = orders.length;
      const totalSales = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalDiscount = orders.reduce((sum, o) => sum + (o.discount || 0), 0);
      const totalTax = orders.reduce((sum, o) => sum + (o.tax || 0), 0);
      const totalItems = orders.reduce((sum, o) => sum + (o.items?.length || 0), 0);

      const byPayment = {};
      const byStatus = {};
      for (const o of orders) {
        byPayment[o.paymentMethod] = (byPayment[o.paymentMethod] || 0) + (o.totalAmount || 0);
        byStatus[o.status] = (byStatus[o.status] || 0) + 1;
      }

      const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
      const avgOrderValue = completedOrders.length > 0
        ? completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / completedOrders.length
        : 0;

      setReport({
        totalOrders,
        totalSales,
        totalDiscount,
        totalTax,
        totalItems,
        avgOrderValue,
        byPayment,
        byStatus,
      });
    } catch (err) {
      console.error('Failed to fetch report:', err);
    } finally {
      setLoading(false);
    }
  };

  const STATUS_COLORS = {
    PENDING: 'bg-amber-100 text-amber-700',
    PREPARING: 'bg-blue-100 text-blue-700',
    READY: 'bg-emerald-100 text-emerald-700',
    COMPLETED: 'bg-slate-100 text-slate-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
  };

  const PAYMENT_COLORS = {
    CASH: 'bg-emerald-100 text-emerald-700',
    CARD: 'bg-blue-100 text-blue-700',
    UPI: 'bg-purple-100 text-purple-700',
    SPLIT: 'bg-amber-100 text-amber-700',
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
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">My Report</h3>
            <p className="text-xs text-slate-500 mt-0.5">{cashierName || 'Cashier'}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Week' },
                { key: 'month', label: 'Month' },
                { key: 'all', label: 'All' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDateFilter(f.key)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    dateFilter === f.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Report Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
            </div>
          ) : !report ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <BarChart3 size={40} strokeWidth={1.5} />
              <p className="mt-2 text-sm">No data available</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee size={16} className="text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-600">Total Sales</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-emerald-800">₹{report.totalSales.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-blue-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt size={16} className="text-blue-600" />
                    <span className="text-xs font-medium text-blue-600">Total Orders</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-blue-800">{report.totalOrders}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-purple-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={16} className="text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">Avg Order Value</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-purple-800">₹{report.avgOrderValue.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-amber-50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ShoppingBag size={16} className="text-amber-600" />
                    <span className="text-xs font-medium text-amber-600">Items Sold</span>
                  </div>
                  <p className="font-display text-2xl font-bold text-amber-800">{report.totalItems}</p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4 text-sm text-slate-600">
                  <span className="text-xs font-medium text-slate-500">Discount Given</span>
                  <p className="font-display text-lg font-bold text-green-700 mt-1">₹{report.totalDiscount.toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4 text-sm text-slate-600">
                  <span className="text-xs font-medium text-slate-500">Tax Collected</span>
                  <p className="font-display text-lg font-bold text-slate-800 mt-1">₹{report.totalTax.toFixed(2)}</p>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              {Object.keys(report.byPayment).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">By Payment Method</h4>
                  <div className="space-y-2">
                    {Object.entries(report.byPayment).map(([method, amount]) => (
                      <div key={method} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-white px-4 py-2.5">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[method] || 'bg-slate-100 text-slate-600'}`}>
                          {method}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">₹{amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Breakdown */}
              {Object.keys(report.byStatus).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">By Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(report.byStatus).map(([status, count]) => (
                      <span key={status} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ────── Checkout Modal ────── */
function CheckoutModal({ onClose, cart }) {
  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [showUpiQr, setShowUpiQr] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    // Fetch tenant settings to get UPI ID
    const fetchUpiSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setUpiId(data.data?.upiId || '');
        setStoreName(data.data?.storeName || 'Store');
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      }
    };
    fetchUpiSettings();
  }, []);

  const paymentMethods = [
    { id: 'CASH', label: 'Cash', icon: Banknote, color: 'emerald' },
    { id: 'CARD', label: 'Card', icon: CreditCard, color: 'blue' },
    { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'purple' },
  ];

  const handleSelectMethod = (id) => {
    setMethod(id);
    setShowUpiQr(false);
  };

  const handleProceed = () => {
    if (method === 'UPI' && upiId) {
      setShowUpiQr(true);
    } else {
      handleCheckout();
    }
  };

  const handleCheckout = async () => {
    if (!method) return;
    setProcessing(true);
    try {
      // Create or find customer if info provided
      let customerId = cart.customerId || null;
      if (!customerId && cart.customerName) {
        try {
          const { data: custData } = await api.post('/customers', {
            name: cart.customerName,
            phone: cart.customerPhone || undefined,
          });
          customerId = custData.data?.id || null;
        } catch {
          // Continue without customer if creation fails
        }
      }

      const activeTable = cart.activeTable;
      const existing = cart.orderType === 'dine-in' && activeTable ? cart.heldTables[activeTable] : null;
      const activeOrderId = existing?.activeOrderId;

      if (activeOrderId) {
        // 1. Sync any remaining unsent items to the order first
        const previousKotItems = existing?.kotItems || [];
        const unsentItems = [];
        for (const item of cart.items) {
          const prev = previousKotItems.find((k) => k.productId === item.productId);
          if (!prev) {
            unsentItems.push({ productId: item.productId, quantity: item.quantity });
          } else if (item.quantity > prev.quantity) {
            unsentItems.push({ productId: item.productId, quantity: item.quantity - prev.quantity });
          }
        }

        if (unsentItems.length > 0) {
          await api.patch(`/orders/${activeOrderId}/items`, { items: unsentItems });
        }

        // 2. Mark order as COMPLETED and PAID
        const { data } = await api.patch(`/orders/${activeOrderId}/status`, {
          status: 'COMPLETED',
          paymentMethod: method,
          paymentStatus: 'PAID'
        });
        setOrderNumber(data.data.orderNumber);
      } else {
        // CREATE new order (for Takeaway or Dine-in with no KOT)
        const payload = {
          items: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          paymentMethod: method,
          discount: cart.discount,
          customerId: customerId || undefined,
          note: cart.orderType === 'dine-in' && cart.activeTable
            ? `Dine-in | Table ${cart.activeTable}`
            : cart.orderType === 'takeaway' ? 'Takeaway' : undefined,
          status: 'COMPLETED', // Directly completed on payment
        };
        const { data } = await api.post('/orders', payload);
        setOrderNumber(data.data.orderNumber);
      }

      setSuccess(true);
      cart.clearCart();
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setProcessing(false);
    }
  };

  const totalAmount = cart.getTotal().toFixed(2);
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(storeName)}&am=${totalAmount}&cu=INR`;

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
        ) : showUpiQr ? (
          /* ── UPI QR Code View ── */
          <div className="text-center">
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setShowUpiQr(false)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
                <Smartphone size={24} className="text-purple-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">Scan to Pay</h3>
              <p className="text-sm text-slate-500">Ask customer to scan this QR code</p>
            </div>

            {/* QR Code */}
            <div className="mx-auto mb-4 inline-block rounded-2xl border-2 border-slate-200 bg-white p-4">
              <QRCodeSVG value={upiLink} size={200} level="H" />
            </div>

            <div className="mb-4 rounded-xl bg-purple-50 border border-purple-200 p-3">
              <p className="text-xs text-purple-600 font-medium">Amount</p>
              <p className="font-display text-2xl font-bold text-purple-800">₹{totalAmount}</p>
              <p className="text-xs text-purple-500 mt-1 font-mono">{upiId}</p>
            </div>

            {/* Payment Received button */}
            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full rounded-xl bg-emerald-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 disabled:opacity-50"
            >
              {processing ? (
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Check size={18} />
                  Payment Received
                </span>
              )}
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
                <span>₹{totalAmount}</span>
              </div>
            </div>

            <p className="mb-3 text-sm font-medium text-slate-600">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => handleSelectMethod(pm.id)}
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
              onClick={handleProceed}
              disabled={!method || processing}
              className="w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? (
                <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : method === 'UPI' && upiId ? (
                'Generate QR Code'
              ) : (
                `Pay ₹${totalAmount}`
              )}
            </button>

            {method === 'UPI' && !upiId && (
              <p className="mt-2 text-center text-xs text-amber-600">
                No UPI ID configured. Go to Settings to add your UPI ID for QR payments.
              </p>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ────── Open Register Modal (Compulsory on POS Start) ────── */
function OpenRegisterModal({ onOpen, user, navigate, logout }) {
  const [cashAmount, setCashAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const amount = parseFloat(cashAmount) || 0;
    setLoading(true);
    try {
      await onOpen(amount);
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [0, 500, 1000, 2000, 5000];

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-brand-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
            <DoorOpen size={32} className="text-brand-600" />
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Open Register</h2>
          <p className="mt-1 text-sm text-slate-500">Start your day by entering the cash in drawer</p>
          {user?.name && (
            <p className="mt-2 text-xs text-slate-400">Cashier: {user.name}</p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Cash in Drawer</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              autoFocus
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-8 pr-4 py-4 text-2xl font-display font-bold text-slate-800 text-right outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Quick amount buttons */}
        <div className="mb-6 flex gap-2">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              onClick={() => setCashAmount(String(amt))}
              className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                cashAmount === String(amt)
                  ? 'border-brand-400 bg-brand-50 text-brand-700'
                  : 'border-[var(--color-border)] text-slate-500 hover:bg-slate-50'
              }`}
            >
              {amt === 0 ? 'Zero' : `₹${amt.toLocaleString()}`}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <span className="flex items-center justify-center gap-2">
              <DoorOpen size={18} />
              Open Day
            </span>
          )}
        </button>

        <div className="mt-4 flex items-center justify-between">
          {user?.role === 'TENANT_ADMIN' && (
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Go to Dashboard
            </button>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ────── Close Register Modal (End of Day) ────── */
function CloseRegisterModal({ session, onClose, onClosed }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closingCash, setClosingCash] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closedData, setClosedData] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/register/${session.id}/summary`);
      setSummary(data.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    const cash = parseFloat(closingCash) || 0;
    setClosing(true);
    try {
      const { data } = await api.post(`/register/${session.id}/close`, {
        closingCash: cash,
        closingNote: closingNote || undefined,
      });
      setClosedData(data.data);
      setClosed(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close register');
    } finally {
      setClosing(false);
    }
  };

  const expectedCash = summary ? summary.expectedCash : 0;
  const cashDiff = closingCash !== '' ? (parseFloat(closingCash) || 0) - expectedCash : null;

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
        className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-white shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {closed ? (
          /* ── Closed Summary ── */
          <div className="p-8 text-center overflow-y-auto">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="font-display text-xl font-bold text-slate-900">Day Closed Successfully</h3>
            <p className="mt-1 text-sm text-slate-500">
              {new Date(session.openedAt).toLocaleDateString()} | {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            {closedData && (
              <div className="mt-6 space-y-3 text-left">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 border border-[var(--color-border)] p-3">
                    <p className="text-xs text-slate-500">Total Orders</p>
                    <p className="font-display text-xl font-bold text-slate-800">{closedData.totalOrders}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                    <p className="text-xs text-emerald-600">Total Revenue</p>
                    <p className="font-display text-xl font-bold text-emerald-800">₹{closedData.totalRevenue?.toFixed(2)}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cash Sales</span>
                    <span className="font-semibold text-slate-800">₹{closedData.totalCashSales?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Card Sales</span>
                    <span className="font-semibold text-slate-800">₹{closedData.totalCardSales?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">UPI Sales</span>
                    <span className="font-semibold text-slate-800">₹{closedData.totalUpiSales?.toFixed(2)}</span>
                  </div>
                </div>
                {closedData.cashDifference != null && (
                  <div className={`rounded-xl border p-3 ${
                    closedData.cashDifference === 0
                      ? 'border-green-200 bg-green-50'
                      : closedData.cashDifference > 0
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-red-200 bg-red-50'
                  }`}>
                    <p className="text-xs text-slate-500">Cash Difference</p>
                    <p className={`font-display text-lg font-bold ${
                      closedData.cashDifference === 0 ? 'text-green-700' : closedData.cashDifference > 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {closedData.cashDifference > 0 ? '+' : ''}₹{closedData.cashDifference?.toFixed(2)}
                      <span className="text-xs font-normal ml-2">
                        {closedData.cashDifference === 0 ? '(Balanced)' : closedData.cashDifference > 0 ? '(Excess)' : '(Short)'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onClosed}
              className="mt-6 w-full rounded-xl bg-brand-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Close Day</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Opened at {new Date(session.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' | Opening cash: ₹'}{session.openingCash?.toFixed(2)}
                </p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                </div>
              ) : summary ? (
                <div className="space-y-4">
                  {/* Session Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Receipt size={14} className="text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">Total Orders</span>
                      </div>
                      <p className="font-display text-2xl font-bold text-blue-800">{summary.totalOrders}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <TrendingUp size={14} className="text-emerald-600" />
                        <span className="text-xs font-medium text-emerald-600">Total Revenue</span>
                      </div>
                      <p className="font-display text-2xl font-bold text-emerald-800">₹{summary.totalRevenue.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="rounded-xl border border-[var(--color-border)] bg-slate-50 p-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Payment Breakdown</h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                            <Banknote size={16} className="text-emerald-600" />
                          </div>
                          <span className="text-sm text-slate-600">Cash Sales</span>
                        </div>
                        <span className="font-display font-bold text-slate-800">₹{summary.totalCashSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                            <CreditCard size={16} className="text-blue-600" />
                          </div>
                          <span className="text-sm text-slate-600">Card Sales</span>
                        </div>
                        <span className="font-display font-bold text-slate-800">₹{summary.totalCardSales.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                            <Smartphone size={16} className="text-purple-600" />
                          </div>
                          <span className="text-sm text-slate-600">UPI Sales</span>
                        </div>
                        <span className="font-display font-bold text-slate-800">₹{summary.totalUpiSales.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Drawer Summary */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
                      <Wallet size={14} />
                      Cash Drawer
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700">Opening Cash</span>
                        <span className="font-semibold text-amber-900">₹{summary.openingCash.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-700">+ Cash Sales</span>
                        <span className="font-semibold text-amber-900">₹{summary.totalCashSales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm border-t border-amber-200 pt-1.5 mt-1.5">
                        <span className="font-semibold text-amber-800">Expected Cash in Drawer</span>
                        <span className="font-display font-bold text-amber-900">₹{summary.expectedCash.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Closing Cash Input */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Actual Cash in Drawer
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                      <input
                        type="number"
                        value={closingCash}
                        onChange={(e) => setClosingCash(e.target.value)}
                        placeholder="Count and enter cash..."
                        min="0"
                        step="0.01"
                        className="w-full rounded-xl border border-[var(--color-border)] bg-white pl-8 pr-4 py-3 text-lg font-display font-bold text-slate-800 text-right outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                      />
                    </div>
                    {/* Cash difference indicator */}
                    {cashDiff !== null && (
                      <div className={`mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                        cashDiff === 0
                          ? 'bg-green-50 text-green-700'
                          : cashDiff > 0
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {cashDiff === 0 ? (
                          <><Check size={14} /> Cash is balanced</>
                        ) : cashDiff > 0 ? (
                          <><TrendingUp size={14} /> Excess of ₹{cashDiff.toFixed(2)}</>
                        ) : (
                          <><AlertTriangle size={14} /> Short by ₹{Math.abs(cashDiff).toFixed(2)}</>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Closing Note */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Note (optional)</label>
                    <textarea
                      value={closingNote}
                      onChange={(e) => setClosingNote(e.target.value)}
                      placeholder="Any notes for this session..."
                      rows={2}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100 resize-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400">
                  <p className="text-sm">Failed to load session data</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {!loading && summary && (
              <div className="border-t border-[var(--color-border)] px-6 py-4">
                <button
                  onClick={handleClose}
                  disabled={closing || closingCash === ''}
                  className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {closing ? (
                    <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <DoorClosed size={18} />
                      Close Day
                    </span>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
