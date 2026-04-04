import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, Minus, Check, Leaf, Drumstick } from 'lucide-react';
import axios from 'axios';
import useCustomerStore from '../../stores/useCustomerStore';
import useThemeStore from '../../stores/useThemeStore';
import { getImageUrl } from '../../utils/imageUrl';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CustomerProductPage() {
  const { tenantId, tableNumber, productId } = useParams();
  const navigate = useNavigate();
  const store = useCustomerStore();
  const { mode } = useThemeStore();
  const dark = mode === 'dark';

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!store.sessionToken) {
      navigate(`/order/${tenantId}/${tableNumber}`);
      return;
    }
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const { data } = await axios.get(`${API}/customer-order/${tenantId}/product/${productId}`);
      setProduct(data.data);
    } catch (err) {
      console.error('Failed to fetch product:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) return prev.filter((a) => a.id !== addon.id);
      return [...prev, addon];
    });
  };

  const addonTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = (product?.price || 0) + addonTotal;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!product) return;
    store.addItem(product, quantity, selectedAddons, note);
    navigate(`/order/${tenantId}/${tableNumber}/menu`);
  };

  const sym = store.currency === 'INR' ? '₹' : store.currency;

  if (loading || !product) {
    return (
      <div className={`min-h-screen ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse">
          <div className={`h-64 ${dark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          <div className="p-4 space-y-3">
            <div className={`h-6 w-48 rounded ${dark ? 'bg-gray-800' : 'bg-gray-200'}`} />
            <div className={`h-4 w-32 rounded ${dark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${dark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Product image */}
      <div className="relative h-64 bg-gradient-to-br from-orange-100 to-amber-50">
        {product.image ? (
          <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl">🍽️</span>
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      {/* Product details */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative -mt-6 rounded-t-3xl px-5 pt-6 pb-32 ${dark ? 'bg-gray-900' : 'bg-white'}`}
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.vegType && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded mt-1 ${
                product.vegType === 'veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {product.vegType === 'veg' ? <Leaf size={10} /> : <Drumstick size={10} />}
                {product.vegType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian'}
              </span>
            )}
          </div>
          <span className="text-2xl font-bold text-orange-500">{sym} {product.price}</span>
        </div>

        {product.description && (
          <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</p>
        )}

        {product.category && (
          <div className={`text-xs mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            Category: {product.category.name}
          </div>
        )}

        {/* Add-ons */}
        {product.addons?.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Customize Your Order</h3>
            <div className="space-y-2">
              {product.addons.map((addon) => {
                const selected = selectedAddons.some((a) => a.id === addon.id);
                return (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      selected
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : dark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                        selected ? 'bg-orange-500 border-orange-500' : dark ? 'border-gray-600' : 'border-gray-300'
                      }`}>
                        {selected && <Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium">{addon.name}</span>
                    </div>
                    <span className={`text-sm font-semibold ${selected ? 'text-orange-500' : dark ? 'text-gray-400' : 'text-gray-500'}`}>
                      +{sym} {addon.price}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Special instructions */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Special Instructions</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any special requests? (e.g., no onions, extra spicy)"
            rows={2}
            className={`w-full p-3 rounded-xl border text-sm resize-none ${
              dark ? 'bg-gray-800 border-gray-700 placeholder-gray-500' : 'bg-gray-50 border-gray-200 placeholder-gray-400'
            }`}
          />
        </div>

        {/* Quantity selector */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold">Quantity</span>
          <div className={`flex items-center gap-3 px-2 py-1 rounded-xl ${dark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-lg font-bold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Price breakdown */}
        {selectedAddons.length > 0 && (
          <div className={`p-3 rounded-xl mb-4 text-sm ${dark ? 'bg-gray-800' : 'bg-orange-50'}`}>
            <div className="flex justify-between">
              <span>Base price</span>
              <span>{sym} {product.price}</span>
            </div>
            {selectedAddons.map((a) => (
              <div key={a.id} className="flex justify-between">
                <span>+ {a.name}</span>
                <span>{sym} {a.price}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold mt-1 pt-1 border-t border-orange-200 dark:border-gray-700">
              <span>Per item</span>
              <span>{sym} {unitPrice.toFixed(2)}</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bottom add to cart */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 ${dark ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-md border-t ${dark ? 'border-gray-800' : 'border-gray-200'}`}>
        <button
          onClick={handleAddToCart}
          className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold shadow-lg"
        >
          <span>Add to Cart</span>
          <span className="text-lg">{sym} {totalPrice.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}
