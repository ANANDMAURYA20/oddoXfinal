import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/useAuthStore';

export default function KDSLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'KDS_STAFF' || currentUser?.role === 'TENANT_ADMIN') {
        navigate('/kds');
      } else {
        alert('This login is for Kitchen Display Staff only.');
        useAuthStore.getState().logout();
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 via-white to-amber-50 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-orange-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-100/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-xl shadow-slate-200/50">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
              <ChefHat size={26} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Kitchen Display
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to access the kitchen display system
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kitchen@store.com"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-orange-600 hover:shadow-orange-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Open Kitchen Display
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          OddoPOS Kitchen Display &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
