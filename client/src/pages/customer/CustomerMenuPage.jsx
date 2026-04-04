import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Plus, Minus, ChevronLeft, Moon, Sun, Leaf, Drumstick } from 'lucide-react';
import axios from 'axios';
import useCustomerStore from '../../stores/useCustomerStore';
import useThemeStore from '../../stores/useThemeStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CustomerMenuPage() {
  const { tenantId, tableNumber } = useParams();
  const navigate = useNavigate();
  const store = useCustomerStore();
  const { mode, toggleMode } = useThemeStore();
  const dark = mode === 'dark';

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store.sessionToken) {
      navigate(`/order/${tenantId}/${tableNumber}`);
      return;
    }
    fetchMenu();
  }, [tenantId]);

  const fetchMenu = async () => {
    try {
      const { data } = await axios.get(`${API}/customer-order/${tenantId}/menu`);
      setCategories(data.data);
      if (data.data.length > 0) setActiveCategory(data.data[0].id);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = () => {
    let products = [];
    if (activeCategory === 'all' || !activeCategory) {
      products = categories.flatMap((c) => c.products);
    } else {
      const cat = categories.find((c) => c.id === activeCategory);
      products = cat?.products || [];
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }

    return products;
  };

  const getItemQty = (productId) => {
    return store.items
      .filter((i) => i.productId === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const quickAdd = (product) => {
    if (product.addons?.length > 0) {
      navigate(`/order/${tenantId}/${tableNumber}/product/${product.id}`);
    } else {
      store.addItem(product, 1, [], '');
    }
  };

  const quickRemove = (productId) => {
    const item = store.items.find((i) => i.productId === productId);
    if (item) {
      if (item.quantity <= 1) {
        store.removeItem(item.key);
      } else {
        store.updateQuantity(item.key, item.quantity - 1);
      }
    }
  };

  const VegBadge = ({ type }) => {
    if (!type) return null;
    const isVeg = type === 'veg';
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {isVeg ? <Leaf size={10} /> : <Drumstick size={10} />}
        {isVeg ? 'Veg' : 'Non-Veg'}
      </span>
    );
  };

  const itemCount = store.getItemCount();

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-30 ${dark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-b ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(`/order/${tenantId}/${tableNumber}`)} className="p-1">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold leading-tight">{store.restaurantName}</h1>
            <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Table {store.tableNumber}</p>
          </div>
          <button onClick={toggleMode} className={`p-2 rounded-full ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Search size={18} className={dark ? 'text-gray-400' : 'text-gray-500'} />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === 'all'
                ? 'bg-orange-500 text-white'
                : dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-orange-500 text-white'
                  : dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products grid */}
      <div className="px-4 py-4 pb-28">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`rounded-2xl h-52 animate-pulse ${dark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredProducts().map((product) => {
                const qty = getItemQty(product.id);
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`rounded-2xl overflow-hidden shadow-sm ${dark ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    {/* Product image */}
                    <div
                      className="relative h-28 bg-gradient-to-br from-orange-100 to-amber-50 cursor-pointer"
                      onClick={() => navigate(`/order/${tenantId}/${tableNumber}/product/${product.id}`)}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl">🍽️</span>
                        </div>
                      )}
                      {product.vegType && (
                        <div className="absolute top-2 left-2">
                          <VegBadge type={product.vegType} />
                        </div>
                      )}
                      {product.addons?.length > 0 && (
                        <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                          Customizable
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-orange-500">
                          {store.currency === 'INR' ? '₹' : store.currency} {product.price}
                        </span>

                        {qty > 0 ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => quickRemove(product.id)}
                              className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-bold">{qty}</span>
                            <button
                              onClick={() => quickAdd(product)}
                              className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => quickAdd(product)}
                            className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white"
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredProducts().length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">🔍</p>
            <p className={dark ? 'text-gray-400' : 'text-gray-500'}>No items found</p>
          </div>
        )}
      </div>

      {/* Floating cart button */}
      <AnimatePresence>
        {itemCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 z-40"
          >
            <button
              onClick={() => navigate(`/order/${tenantId}/${tableNumber}/cart`)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart size={22} />
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-orange-500 text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <span className="font-semibold">View Cart</span>
              </div>
              <span className="font-bold text-lg">
                {store.currency === 'INR' ? '₹' : store.currency} {store.getSubtotal().toFixed(2)}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
