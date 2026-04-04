import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, QrCode, Download, X, Users, Hash, Edit2, Check, ChevronDown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../config/api';

export default function TableManagementPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(null); // table object
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [bulkCount, setBulkCount] = useState(5);
  const [newTable, setNewTable] = useState({ number: '', name: '', seats: 4 });
  const qrRef = useRef(null);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const { data } = await api.get('/tables');
      setTables(data.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    try {
      await api.post('/tables', {
        number: parseInt(newTable.number),
        name: newTable.name || `Table ${newTable.number}`,
        seats: parseInt(newTable.seats) || 4,
      });
      setShowAddModal(false);
      setNewTable({ number: '', name: '', seats: 4 });
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create table');
    }
  };

  const handleBulkCreate = async () => {
    try {
      await api.post('/tables/bulk', { count: bulkCount });
      setShowBulkModal(false);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create tables');
    }
  };

  const handleDeleteTable = async (id) => {
    if (!confirm('Delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  const handleUpdateTable = async (id, data) => {
    try {
      await api.patch(`/tables/${id}`, data);
      setEditingTable(null);
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update table');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/tables/${id}/status`, { status });
      fetchTables();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const getQRUrl = (table) => {
    const user = JSON.parse(localStorage.getItem('pos_user') || '{}');
    const base = window.location.origin;
    return `${base}/order/${user.tenantId}/${table.id}`;
  };

  const downloadQR = (table) => {
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
      ctx.fillText(table.name || `Table ${table.number}`, 200, 370);

      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText('Scan to Order', 200, 400);

      const link = document.createElement('a');
      link.download = `QR-Table-${table.number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const statusColors = {
    AVAILABLE: 'bg-green-100 text-green-700',
    OCCUPIED: 'bg-orange-100 text-orange-700',
    RESERVED: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Table Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tables and generate QR codes for ordering</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            Bulk Add
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition"
          >
            <Plus size={16} /> Add Table
          </button>
        </div>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <QrCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Tables Yet</h3>
          <p className="text-sm text-gray-400 mb-6">Create tables to generate QR codes for customer ordering</p>
          <button
            onClick={() => setShowBulkModal(true)}
            className="px-6 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium"
          >
            Add Tables
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {tables.map((table) => (
              <motion.div
                key={table.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-gray-400" />
                      <span className="font-bold text-lg">{table.number}</span>
                    </div>
                    <p className="text-sm text-gray-500">{table.name}</p>
                  </div>
                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[table.status]}`}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="RESERVED">Reserved</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Users size={14} />
                  <span>{table.seats} seats</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQRModal(table)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-medium hover:bg-orange-100 transition"
                  >
                    <QrCode size={14} /> QR Code
                  </button>
                  <button
                    onClick={() => setEditingTable(table)}
                    className="p-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table.id)}
                    className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
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
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
            >
              <button
                onClick={() => setShowQRModal(null)}
                className="absolute top-4 right-4 p-1 text-gray-400"
              >
                <X size={20} />
              </button>

              <h2 className="text-xl font-bold mb-1">{showQRModal.name || `Table ${showQRModal.number}`}</h2>
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

      {/* Add Table Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h2 className="text-lg font-bold mb-4">Add New Table</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Table Number *</label>
                  <input
                    type="number"
                    value={newTable.number}
                    onChange={(e) => setNewTable({ ...newTable, number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                    placeholder="e.g., 1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Name (optional)</label>
                  <input
                    type="text"
                    value={newTable.name}
                    onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                    placeholder="e.g., Window Seat 1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Seats</label>
                  <input
                    type="number"
                    value={newTable.seats}
                    onChange={(e) => setNewTable({ ...newTable, seats: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 border rounded-xl text-sm font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTable}
                  disabled={!newTable.number}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                >
                  Create Table
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Create Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowBulkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h2 className="text-lg font-bold mb-4">Bulk Add Tables</h2>
              <p className="text-sm text-gray-500 mb-4">
                Tables will be auto-numbered starting from the next available number.
              </p>

              <div>
                <label className="text-sm font-medium text-gray-600">Number of Tables</label>
                <input
                  type="number"
                  value={bulkCount}
                  onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  min="1"
                  max="50"
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-2 border rounded-xl text-sm font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkCreate}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium"
                >
                  Create {bulkCount} Tables
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Table Modal */}
      <AnimatePresence>
        {editingTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setEditingTable(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h2 className="text-lg font-bold mb-4">Edit Table #{editingTable.number}</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <input
                    type="text"
                    defaultValue={editingTable.name}
                    id="edit-table-name"
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Seats</label>
                  <input
                    type="number"
                    defaultValue={editingTable.seats}
                    id="edit-table-seats"
                    className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setEditingTable(null)}
                  className="flex-1 py-2 border rounded-xl text-sm font-medium text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const name = document.getElementById('edit-table-name').value;
                    const seats = parseInt(document.getElementById('edit-table-seats').value);
                    handleUpdateTable(editingTable.id, { name, seats });
                  }}
                  className="flex-1 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
