import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Package, Tag, Search, ToggleLeft, ToggleRight, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import { useProducts, useCategories } from '../hooks/useInventory';
import { getImageUrl } from '../utils/imageUrl';

export default function InventoryPage() {
  const [tab, setTab] = useState('products'); // products | categories
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient = useQueryClient();

  const { 
    data: productData, 
    isLoading: loadingProducts,
    isFetching: fetchingProducts 
  } = useProducts({ 
    status: statusFilter,
    search: search // Note: in a high-traffic app, we might want to debounce this
  });

  const { 
    data: categories = [], 
    isLoading: loadingCategories,
    isFetching: fetchingCategories 
  } = useCategories();

  const products = productData?.products || [];
  
  const isInitialLoading = (tab === 'products' ? (loadingProducts && products.length === 0) : (loadingCategories && categories.length === 0));
  const isRefreshing = (tab === 'products' ? fetchingProducts : fetchingCategories);

  const toggleProductStatus = async (product) => {
    const newStatus = !product.isActive;
    try {
      await api.patch(`/products/${product.id}`, { isActive: newStatus });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    } catch (err) { alert(err.response?.data?.message || 'Failed to update status'); }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product? It will be marked as inactive.')) return;
    try {
      await api.delete(`/products/${id}`);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const deleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] });
      // Also invalidate products since they might refer to this category
      queryClient.invalidateQueries({ queryKey: ['inventory', 'products'] });
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  // The search is handled by useProducts queryKey, so we don't need additional local filtering here
  const displayProducts = products;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Inventory</h1>
            <p className="mt-0.5 text-sm text-slate-500">Manage your products and categories</p>
          </div>
          {isRefreshing && !isInitialLoading && (
            <div className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-600 animate-pulse">
              <RefreshCcw size={10} className="animate-spin-slow" />
              Refreshing...
            </div>
          )}
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700"
        >
          <Plus size={18} />
          Add {tab === 'products' ? 'Product' : 'Category'}
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {[
          { key: 'products', label: 'Products', icon: Package },
          { key: 'categories', label: 'Categories', icon: Tag },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Status Filter (products only) */}
      {tab === 'products' && (
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="relative max-w-sm flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-[var(--color-border)] bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Inactive' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === f.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {isInitialLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
        </div>
      ) : tab === 'products' ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {displayProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-slate-50/50 transition-colors ${!product.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img src={getImageUrl(product.image)} alt={product.name} className="h-9 w-9 rounded-lg object-cover" />
                      ) : (
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-display font-bold text-sm ${
                          product.isActive ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {product.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-800">{product.name}</p>
                        {product.barcode && (
                          <p className="text-xs font-mono text-slate-400">{product.barcode}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">
                    {product.category?.name || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">
                    ₹{product.price.toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-sm font-medium ${
                      product.stock <= 5 ? 'text-red-500' : 'text-slate-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleProductStatus(product)}
                      className="flex items-center gap-1.5"
                      title={product.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      {product.isActive ? (
                        <>
                          <ToggleRight size={22} className="text-emerald-500" />
                          <span className="text-xs font-semibold text-emerald-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={22} className="text-slate-400" />
                          <span className="text-xs font-semibold text-slate-400">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditing(product); setShowModal(true); }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <Package size={36} strokeWidth={1.5} />
              <p className="mt-2 text-sm">No products found</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Tag size={18} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{cat.name}</p>
                  <p className="text-xs text-slate-400">{cat._count?.products || 0} products</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditing(cat); setShowModal(true); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-slate-300">
              <Tag size={36} strokeWidth={1.5} />
              <p className="mt-2 text-sm">No categories yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <FormModal
            tab={tab}
            editing={editing}
            categories={categories}
            onClose={() => { setShowModal(false); setEditing(null); }}
            onSaved={() => {
              setShowModal(false);
              setEditing(null);
              // Invalidate cache instead of manual fetch
              queryClient.invalidateQueries({ queryKey: ['inventory'] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ────── Form Modal ────── */
function FormModal({ tab, editing, categories, onClose, onSaved }) {
  const isProduct = tab === 'products';
  const [form, setForm] = useState(
    isProduct
      ? {
          name: editing?.name || '',
          price: editing?.price || '',
          costPrice: editing?.costPrice || '',
          stock: editing?.stock || '',
          lowStock: editing?.lowStock || 5,
          barcode: editing?.barcode || '',
          categoryId: editing?.category?.id || editing?.categoryId || '',
          image: editing?.image || '',
          vegType: editing?.vegType || '',
        }
      : { name: editing?.name || '' }
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = isProduct
        ? {
            ...form,
            price: parseFloat(form.price),
            costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
            stock: parseInt(form.stock, 10),
            lowStock: parseInt(form.lowStock, 10),
            categoryId: form.categoryId || undefined,
            image: form.image || undefined,
            vegType: form.vegType || undefined,
          }
        : { name: form.name };

      if (editing) {
        const endpoint = isProduct ? `/products/${editing.id}` : `/categories/${editing.id}`;
        await api.patch(endpoint, payload);
      } else {
        const endpoint = isProduct ? '/products' : '/categories';
        await api.post(endpoint, payload);
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
            {editing ? 'Edit' : 'Add'} {isProduct ? 'Product' : 'Category'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {isProduct && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Barcode</label>
                <input
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Image URL</label>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                {form.image && (
                  <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--color-border)]">
                    <img src={getImageUrl(form.image)} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Food Type</label>
                <select
                  value={form.vegType}
                  onChange={(e) => setForm({ ...form, vegType: e.target.value })}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Not specified</option>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="egg">Egg</option>
                </select>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
