import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/useAuthStore';

export default function LoginPage() {
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
      if (currentUser?.role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else if (!result.onboardingCompleted) {
        navigate('/onboarding');
      } else {
        navigate('/pos');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4">
      {/* Floating decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-xl shadow-slate-200/50">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-200">
              <ShoppingCart size={26} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in to your POS dashboard
            </p>
          </div>

          {/* Error */}
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
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@store.com"
                required
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
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

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-brand-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          OddoPOS &copy; {new Date().getFullYear()} &middot; Powered by OddoXindus
        </p>
      </motion.div>
    </div>
  );
}
