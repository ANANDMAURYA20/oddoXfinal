import { useState, useEffect } from 'react';
import { Save, Store, Percent, Receipt, DollarSign, CreditCard, QrCode, UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../config/api';

export default function SettingsPage() {
  const [form, setForm] = useState({
    storeName: '',
    currency: 'INR',
    taxRate: 0,
    taxLabel: 'GST',
    receiptNote: '',
    paymentMethods: [],
    upiId: '',
    totalTables: 0,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings');
      if (data.data) {
        setForm({
          storeName: data.data.storeName || '',
          currency: data.data.currency || 'INR',
          taxRate: data.data.taxRate || 0,
          taxLabel: data.data.taxLabel || 'GST',
          receiptNote: data.data.receiptNote || '',
          paymentMethods: data.data.paymentMethods || [],
          upiId: data.data.upiId || '',
          totalTables: data.data.totalTables || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.patch('/settings', {
        ...form,
        taxRate: parseFloat(form.taxRate),
        totalTables: parseInt(form.totalTables) || 0,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Configure your store preferences</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm space-y-6"
      >
        {/* Store Name */}
        <div>
          <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-slate-700">
            <Store size={16} className="text-slate-400" />
            Store Name
          </label>
          <input
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            placeholder="My Awesome Store"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-slate-700">
            <DollarSign size={16} className="text-slate-400" />
            Currency
          </label>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>

        {/* Tax */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-slate-700">
              <Percent size={16} className="text-slate-400" />
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tax Label</label>
            <input
              value={form.taxLabel}
              onChange={(e) => setForm({ ...form, taxLabel: e.target.value })}
              placeholder="GST, VAT, etc."
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        {/* Payment Methods */}
        <div>
          <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-slate-700">
            <CreditCard size={16} className="text-slate-400" />
            Payment Methods
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'CASH', label: 'Cash' },
              { id: 'CARD', label: 'Card' },
              { id: 'UPI', label: 'UPI' },
            ].map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  const methods = form.paymentMethods.includes(method.id)
                    ? form.paymentMethods.filter((m) => m !== method.id)
                    : [...form.paymentMethods, method.id];
                  setForm({ ...form, paymentMethods: methods });
                }}
                className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                  form.paymentMethods.includes(method.id)
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* UPI ID */}
        <div>
          <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-slate-700">
            <QrCode size={16} className="text-slate-400" />
            UPI ID <span className="text-slate-400 font-normal">(for dynamic QR payments)</span>
          </label>
          <input
            value={form.upiId}
            onChange={(e) => setForm({ ...form, upiId: e.target.value })}
            placeholder="yourname@upi or 9876543210@paytm"
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Total Tables */}
        <div>
          <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-slate-700">
            <UtensilsCrossed size={16} className="text-slate-400" />
            Total Tables
          </label>
          <input
            type="number"
            min="0"
            value={form.totalTables}
            onChange={(e) => setForm({ ...form, totalTables: e.target.value })}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Receipt Note */}
        <div>
          <label className="flex items-center gap-2 mb-1.5 text-sm font-medium text-slate-700">
            <Receipt size={16} className="text-slate-400" />
            Receipt Footer Note
          </label>
          <textarea
            value={form.receiptNote}
            onChange={(e) => setForm({ ...form, receiptNote: e.target.value })}
            placeholder="Thank you for shopping with us!"
            rows={3}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none resize-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm font-medium text-emerald-600"
            >
              Settings saved successfully
            </motion.span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
