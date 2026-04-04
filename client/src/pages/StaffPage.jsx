import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Users, Shield, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

const ROLE_BADGE = {
  TENANT_ADMIN: { label: 'Admin', icon: Shield, class: 'bg-brand-50 text-brand-700 border-brand-200' },
  CASHIER: { label: 'Cashier', icon: ShoppingCart, class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/users');
      setStaff(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteStaff = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await api.delete(`/users/${id}`);
      setStaff((s) => s.filter((x) => x.id !== id));
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Staff</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage your team members</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((member) => {
          const role = ROLE_BADGE[member.role] || ROLE_BADGE.CASHIER;
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 font-display text-lg font-bold text-brand-600">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => { setEditing(member); setShowModal(true); }}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteStaff(member.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-slate-800">{member.name}</h3>
              <p className="text-xs text-slate-400 mb-3">{member.email}</p>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${role.class}`}>
                <role.icon size={12} />
                {role.label}
              </span>
            </motion.div>
          );
        })}
      </div>

      {staff.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-300">
          <Users size={40} strokeWidth={1.5} />
          <p className="mt-2 text-sm">No staff members yet</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <StaffModal
            editing={editing}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSaved={() => { setShowModal(false); setEditing(null); fetchStaff(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StaffModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: editing?.name || '',
    email: editing?.email || '',
    password: '',
    role: editing?.role || 'CASHIER',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      if (editing) {
        await api.patch(`/users/${editing.id}`, payload);
      } else {
        await api.post('/users', payload);
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
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-lg font-bold text-slate-900">
            {editing ? 'Edit' : 'Add'} Staff
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Password {editing && <span className="text-slate-400">(leave blank to keep current)</span>}
            </label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              {...(!editing && { required: true })}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100">
              <option value="CASHIER">Cashier</option>
              <option value="TENANT_ADMIN">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
