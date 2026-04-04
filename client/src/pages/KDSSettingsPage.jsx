import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, ChefHat, Tag, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

export default function KDSSettingsPage() {
  const [stations, setStations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchStations();
    fetchCategories();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/kds-stations');
      setStations(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteStation = async (id) => {
    if (!confirm('Delete this KDS station?')) return;
    try {
      await api.delete(`/kds-stations/${id}`);
      setStations((s) => s.filter((x) => x.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleStation = async (station) => {
    try {
      const { data } = await api.patch(`/kds-stations/${station.id}`, { isActive: !station.isActive });
      setStations((s) => s.map((x) => (x.id === station.id ? data.data : x)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  // Map categoryIds to names
  const getCategoryNames = (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return 'All categories';
    return categoryIds
      .map((id) => categories.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'All categories';
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Kitchen Display Settings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage KDS stations and assign product categories to each station
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600"
        >
          <Plus size={18} />
          Add Station
        </button>
      </div>

      {/* Info box */}
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          <strong>How it works:</strong> Create KDS stations (e.g., "Grill", "Drinks", "Desserts") and assign product categories to each.
          When an order comes in, each station only sees the items they need to prepare.
          Stations with no categories assigned will see all orders.
        </p>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.map((station) => (
          <motion.div
            key={station.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
              station.isActive ? 'border-[var(--color-border)]' : 'border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <ChefHat size={22} />
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditing(station); setShowModal(true); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => deleteStation(station.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 mb-1">{station.name}</h3>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {station.categoryIds.length === 0 ? (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                  All Categories
                </span>
              ) : (
                station.categoryIds.map((cid) => {
                  const cat = categories.find((c) => c.id === cid);
                  return cat ? (
                    <span key={cid} className="rounded-lg bg-orange-50 border border-orange-200 px-2.5 py-1 text-xs font-medium text-orange-700">
                      {cat.name}
                    </span>
                  ) : null;
                })
              )}
            </div>

            <button
              onClick={() => toggleStation(station)}
              className={`w-full rounded-lg py-1.5 text-xs font-semibold transition-all ${
                station.isActive
                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {station.isActive ? 'Active' : 'Inactive'} &mdash; Click to {station.isActive ? 'deactivate' : 'activate'}
            </button>
          </motion.div>
        ))}
      </div>

      {stations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <Monitor size={40} strokeWidth={1.5} />
          <p className="mt-2 text-sm">No KDS stations yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first station to get started</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <StationModal
            editing={editing}
            categories={categories}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSaved={() => { setShowModal(false); setEditing(null); fetchStations(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StationModal({ editing, categories, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: editing?.name || '',
    categoryIds: editing?.categoryIds || [],
  });
  const [saving, setSaving] = useState(false);

  const toggleCategory = (catId) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter((id) => id !== catId)
        : [...f.categoryIds, catId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/kds-stations/${editing.id}`, form);
      } else {
        await api.post('/kds-stations', form);
      }
      onSaved();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
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
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-slate-900">
            {editing ? 'Edit' : 'Add'} KDS Station
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Station Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Grill Station, Drinks Bar"
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Assign Categories
              <span className="ml-1 text-xs font-normal text-slate-400">(leave empty for all orders)</span>
            </label>
            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-all ${
                      form.categoryIds.includes(cat.id)
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Tag size={14} />
                    {cat.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No categories yet. Create categories in Inventory first.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editing ? 'Update Station' : 'Create Station'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
