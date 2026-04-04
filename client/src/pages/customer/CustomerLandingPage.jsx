import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Utensils, AlertTriangle, Loader2, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import useCustomerStore from '../../stores/useCustomerStore';
import useThemeStore from '../../stores/useThemeStore';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function CustomerLandingPage() {
  const { tenantId, tableId } = useParams();
  const navigate = useNavigate();
  const { setSession, setLocationVerified } = useCustomerStore();
  const { mode, toggleMode } = useThemeStore();
  const dark = mode === 'dark';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [geoChecking, setGeoChecking] = useState(false);
  const [geoBlocked, setGeoBlocked] = useState(false);

  useEffect(() => {
    initializeSession();
  }, [tenantId, tableId]);

  const initializeSession = async () => {
    try {
      setLoading(true);
      // Fetch restaurant info
      const { data: infoRes } = await axios.get(`${API}/customer-order/${tenantId}/info`);
      const info = infoRes.data;
      setRestaurant(info);

      // Initialize table session
      const { data: sessionRes } = await axios.post(
        `${API}/customer-order/${tenantId}/table/${tableId}/session`
      );
      const { session, table } = sessionRes.data;

      // Store session info
      setSession({
        tenantId,
        tableId,
        tableNumber: table.number,
        tableName: table.name,
        sessionToken: session.sessionToken,
        restaurantName: info.restaurantName,
        currency: info.currency,
        taxRate: info.taxRate,
        taxLabel: info.taxLabel,
        geofence: info.geofence,
      });

      // Check geofence if enabled
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
        const distance = getDistanceMeters(
          latitude,
          longitude,
          geofence.lat,
          geofence.lng
        );

        if (distance <= geofence.radius) {
          setLocationVerified(true);
          setGeoBlocked(false);
        } else {
          setGeoBlocked(true);
        }
        setGeoChecking(false);
      },
      () => {
        // If user denies location, block
        setGeoBlocked(true);
        setGeoChecking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Haversine formula
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
      {/* Theme toggle */}
      <button
        onClick={toggleMode}
        className={`absolute top-4 right-4 p-2 rounded-full ${dark ? 'bg-gray-800 text-yellow-400' : 'bg-white text-gray-600 shadow-md'}`}
      >
        {dark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Restaurant branding */}
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
            Table {useCustomerStore.getState().tableNumber}
          </div>
        </motion.div>

        {/* Geofence blocked */}
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

        {/* Checking location */}
        {geoChecking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 mb-6"
          >
            <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
            <span className={dark ? 'text-gray-400' : 'text-gray-600'}>Verifying your location...</span>
          </motion.div>
        )}

        {/* Order button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.97 }}
          disabled={geoBlocked || geoChecking}
          onClick={() => navigate(`/order/${tenantId}/${tableId}/menu`)}
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
    </div>
  );
}
