import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Utensils, AlertTriangle, Loader2, Moon, Sun, User, Phone, ArrowRight } from 'lucide-react';
import axios from 'axios';
import useCustomerStore from '../../stores/useCustomerStore';
import useThemeStore from '../../stores/useThemeStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CustomerLandingPage() {
  const { tenantId, tableNumber } = useParams();
  const navigate = useNavigate();
  const { setSession, setLocationVerified, setCustomerDetails } = useCustomerStore();
  const { mode, toggleMode } = useThemeStore();
  const dark = mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [geoChecking, setGeoChecking] = useState(false);
  const [geoBlocked, setGeoBlocked] = useState(false);

  // Customer details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    initializeSession();
  }, [tenantId, tableNumber]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      const { data: infoRes } = await axios.get(`${API}/customer-order/${tenantId}/info`);
      const info = infoRes.data;
      setRestaurant(info);

      const { data: sessionRes } = await axios.post(
        `${API}/customer-order/${tenantId}/table/${tableNumber}/session`
      );
      const { session, tableNumber: tNum } = sessionRes.data;

      setSession({
        tenantId,
        tableNumber: tNum,
        sessionToken: session.sessionToken,
        restaurantName: info.restaurantName,
        currency: info.currency,
        taxRate: info.taxRate,
        taxLabel: info.taxLabel,
        qrOrderingMode: info.qrOrderingMode,
        geofence: info.geofence,
      });

      if (info.geofence?.enabled) {
        checkGeofence(info.geofence);
      } else {
        setLocationVerified(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load restaurant');
    } finally {
      setLoading(false);
    }
  };

  const checkGeofence = (geofence) => {
    setGeoChecking(true);
    if (!navigator.geolocation) {
      setGeoBlocked(true);
      setGeoChecking(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = getDistanceMeters(latitude, longitude, geofence.lat, geofence.lng);
        if (distance <= geofence.radius) {
          setLocationVerified(true);
          setGeoBlocked(false);
        } else {
          setGeoBlocked(true);
        }
        setGeoChecking(false);
      },
      () => {
        setGeoBlocked(true);
        setGeoChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleOrderHere = () => {
    setShowDetailsModal(true);
    setFormError('');
  };

  const handleSubmitDetails = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setFormError('Please enter your name');
      return;
    }
    if (!trimmedPhone) {
      setFormError('Please enter your phone number');
      return;
    }
    if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      setFormError('Please enter a valid 10-digit phone number');
      return;
    }

    setCustomerDetails(trimmedName, trimmedPhone);
    setShowDetailsModal(false);
    navigate(`/order/${tenantId}/${tableNumber}/menu`);
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-gray-900' : 'bg-orange-50'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-6 ${dark ? 'bg-gray-900' : 'bg-orange-50'}`}>
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-800'}`}>Oops!</h2>
          <p className={dark ? 'text-gray-400' : 'text-gray-600'}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${dark ? 'bg-gray-900' : 'bg-gradient-to-br from-orange-50 via-white to-amber-50'}`}>
      <button
        onClick={toggleMode}
        className={`absolute top-4 right-4 p-2 rounded-full z-10 ${dark ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600 shadow-md'}`}
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Utensils className="w-12 h-12 text-white" />
          </div>
          <h1 className={`text-3xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-800'}`}>
            {restaurant?.restaurantName}
          </h1>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${dark ? 'bg-gray-800 text-orange-400' : 'bg-orange-100 text-orange-700'}`}>
            <MapPin size={14} />
            Table {tableNumber}
          </div>
        </motion.div>

        {geoBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-sm w-full p-6 rounded-2xl mb-6 ${dark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 mt-0.5 shrink-0" />
              <div>
                <h3 className={`font-semibold mb-1 ${dark ? 'text-red-300' : 'text-red-700'}`}>
                  Outside Restaurant Area
                </h3>
                <p className={`text-sm ${dark ? 'text-red-400' : 'text-red-600'}`}>
                  You are outside the allowed restaurant area. Ordering is not permitted. Please move closer to the restaurant to place your order.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {geoChecking && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-6">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span className={dark ? 'text-gray-400' : 'text-gray-600'}>Verifying your location...</span>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          disabled={geoBlocked || geoChecking}
          onClick={handleOrderHere}
          className={`w-full max-w-sm py-4 rounded-2xl text-lg font-bold shadow-lg transition-all
            ${geoBlocked || geoChecking
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-xl active:shadow-md'
            }`}
        >
          {geoChecking ? 'Checking Location...' : geoBlocked ? 'Ordering Unavailable' : 'Order Here'}
        </motion.button>

        <p className={`mt-4 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
          Scan the QR code at your table to begin ordering
        </p>
      </div>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 ${dark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mb-5 sm:hidden" />

              <h2 className={`text-xl font-bold mb-1 ${dark ? 'text-white' : 'text-gray-800'}`}>
                Welcome!
              </h2>
              <p className={`text-sm mb-6 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                Please enter your details to start ordering
              </p>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your Name *
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  } focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100`}>
                    <User size={18} className={dark ? 'text-gray-400' : 'text-gray-400'} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      autoFocus
                      className="flex-1 bg-transparent outline-none text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && document.getElementById('phone-input')?.focus()}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className={`text-sm font-medium mb-1.5 block ${dark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Phone Number *
                  </label>
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                    dark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  } focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100`}>
                    <Phone size={18} className={dark ? 'text-gray-400' : 'text-gray-400'} />
                    <input
                      id="phone-input"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit phone number"
                      inputMode="numeric"
                      className="flex-1 bg-transparent outline-none text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitDetails()}
                    />
                  </div>
                </div>

                {/* Error */}
                {formError && (
                  <p className="text-red-500 text-xs font-medium">{formError}</p>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmitDetails}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl font-bold text-base shadow-lg mt-2"
                >
                  Continue to Menu
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
