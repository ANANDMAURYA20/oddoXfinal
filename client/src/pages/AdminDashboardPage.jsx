import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Users, ShoppingBag, Package, LogOut, ChevronLeft, ChevronRight, Power, Trash2, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import api from '../config/api';
import useAuthStore from '../stores/useAuthStore';
import { useAdminAdmins } from '../hooks/useAdminAdmins';

export default function AdminDashboardPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { 
    data, 
    isLoading, 
    isFetching 
  } = useAdminAdmins(page, search);

  const admins = data?.admins || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    // React Query will automatically refetch because 'search' is part of the queryKey
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleAdminStatus = async (adminId) => {
    try {
      setActionLoading(adminId);
      await api.patch(`/tenants/admins/${adminId}/toggle-status`);
      // Invalidate the cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    } catch (err) {
      console.error('Failed to toggle admin status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTenant = async (tenantId) => {
    try {
      setActionLoading(tenantId);
      await api.delete(`/tenants/${tenantId}/permanent`);
      setDeleteConfirm(null);
      // Invalidate the cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['admin', 'admins'] });
    } catch (err) {
      console.error('Failed to delete tenant:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const planColors = {
    TRIAL: 'bg-amber-50 text-amber-700',
    BASIC: 'bg-blue-50 text-blue-700',
    PRO: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-raised)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 shadow-sm">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              Oddo<span className="text-brand-600">POS</span>
              <span className="ml-2 text-sm font-normal text-slate-400">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-display font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-slate-900">Tenant Admins</h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {pagination.total} registered tenant admin{pagination.total !== 1 ? 's' : ''}
              </p>
            </div>
            {isFetching && !isLoading && (
              <div className="flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-600 animate-pulse">
                <RefreshCcw size={10} className="animate-spin-slow" />
                Refreshing...
              </div>
            )}
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admins or businesses..."
              className="w-full sm:w-72 rounded-xl border border-[var(--color-border)] bg-white pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </form>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-brand-200 border-t-brand-600" />
          </div>
        ) : admins.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white">
            <p className="text-sm text-slate-400">No tenant admins found</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-slate-50/50">
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Admin</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Business</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Plan</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Staff</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Products</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Orders</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Joined</th>
                    <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {admins.map((admin, i) => (
                    <motion.tr
                      key={admin.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-display font-semibold text-sm shrink-0">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{admin.name}</p>
                            <p className="text-xs text-slate-400">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-slate-700">{admin.tenant?.name || '-'}</p>
                        <p className="text-xs text-slate-400">{admin.tenant?.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${planColors[admin.tenant?.plan] || 'bg-slate-50 text-slate-600'}`}>
                          {admin.tenant?.plan || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1 text-sm text-slate-600">
                          <Users size={14} className="text-slate-400" />
                          {admin.tenant?._count?.users || 0}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1 text-sm text-slate-600">
                          <Package size={14} className="text-slate-400" />
                          {admin.tenant?._count?.products || 0}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center gap-1 text-sm text-slate-600">
                          <ShoppingBag size={14} className="text-slate-400" />
                          {admin.tenant?._count?.orders || 0}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          admin.isActive && admin.tenant?.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            admin.isActive && admin.tenant?.isActive ? 'bg-emerald-500' : 'bg-red-400'
                          }`} />
                          {admin.isActive && admin.tenant?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(admin.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleAdminStatus(admin.id)}
                            disabled={actionLoading === admin.id}
                            className={`rounded-lg p-2 transition-colors disabled:opacity-40 ${
                              admin.isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={admin.isActive ? 'Disable admin' : 'Enable admin'}
                          >
                            <Power size={16} />
                          </button>
                          {deleteConfirm === admin.tenant?.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteTenant(admin.tenant.id)}
                                disabled={actionLoading === admin.tenant?.id}
                                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(admin.tenant?.id)}
                              className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete tenant permanently"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--color-border)] px-5 py-3">
                <p className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={pagination.page <= 1}
                    className="rounded-lg border border-[var(--color-border)] p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="rounded-lg border border-[var(--color-border)] p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
