import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Download, X, Hash, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../config/api';

export default function TableManagementPage() {
  const [totalTables, setTotalTables] = useState(0);
  const [loading, setLoading] = useState(true);
  const [qrOrderingEnabled, setQrOrderingEnabled] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null); // table number
  const qrRef = useRef(null);

  const user = JSON.parse(localStorage.getItem('pos_user') || '{}');
  const tenantId = user.tenantId;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/settings');
      setTotalTables(data.data?.totalTables || 0);
      setQrOrderingEnabled(data.data?.qrOrderingEnabled || false);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQRUrl = (tableNum) => {
    const base = window.location.origin;
    return `${base}/order/${tenantId}/${tableNum}`;
  };

  const downloadQR = (tableNum) => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 480;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 50, 30, 300, 300);

      ctx.fillStyle = '#000000';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Table ${tableNum}`, 200, 370);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('Scan to Order', 200, 400);

      const link = document.createElement('a');
      link.download = `QR-Table-${tableNum}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadAllQR = () => {
    // Download each QR sequentially with a small delay
    for (let i = 1; i <= totalTables; i++) {
      setTimeout(() => {
        setShowQRModal(i);
        setTimeout(() => downloadQR(i), 300);
      }, i * 500);
    }
  };

  const tables = Array.from({ length: totalTables }, (_, i) => i + 1);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Table QR Codes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate QR codes for your {totalTables} dine-in tables. These sync with POS.
          </p>
        </div>
        {totalTables > 0 && (
          <button
            onClick={downloadAllQR}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition"
          >
            <Download size={16} /> Download All
          </button>
        )}
      </div>

      {/* Status banner */}
      {!loading && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          qrOrderingEnabled
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${qrOrderingEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
          <span className="text-sm font-medium">
            {qrOrderingEnabled
              ? 'QR ordering is enabled. Customers can scan and order.'
              : 'QR ordering is disabled. Enable it in Settings to allow customer ordering.'}
          </span>
          {!qrOrderingEnabled && (
            <a href="/settings" className="ml-auto text-sm font-semibold underline">
              Go to Settings
            </a>
          )}
        </div>
      )}

      {/* No tables message */}
      {!loading && totalTables === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tables Configured</h3>
          <p className="text-sm text-gray-400 mb-6">
            Set the number of tables in Settings to generate QR codes
          </p>
          <a
            href="/settings"
            className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium"
          >
            Go to Settings
          </a>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* QR Grid */}
      {!loading && totalTables > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((num) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: num * 0.02 }}
              className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setShowQRModal(num)}
            >
              <QRCodeSVG
                value={getQRUrl(num)}
                size={120}
                level="H"
                includeMargin={false}
                fgColor="#1a1a1a"
              />
              <div className="mt-3 flex items-center gap-1.5 text-sm font-bold text-gray-700">
                <Hash size={14} className="text-gray-400" />
                Table {num}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQRModal(num);
                }}
                className="mt-2 text-xs text-orange-500 font-semibold hover:text-orange-600"
              >
                View & Download
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowQRModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative"
            >
              <button
                onClick={() => setShowQRModal(null)}
                className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-1">Table {showQRModal}</h2>
              <p className="text-sm text-gray-500 mb-6">Scan to order from this table</p>

              <div ref={qrRef} className="inline-block p-4 bg-white rounded-2xl shadow-inner border">
                <QRCodeSVG
                  value={getQRUrl(showQRModal)}
                  size={220}
                  level="H"
                  includeMargin
                  fgColor="#1a1a1a"
                />
              </div>

              <p className="text-xs text-gray-400 mt-4 mb-6 break-all px-4">
                {getQRUrl(showQRModal)}
              </p>

              <button
                onClick={() => downloadQR(showQRModal)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition"
              >
                <Download size={16} /> Download QR Code
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
