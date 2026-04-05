import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShoppingCart, Building2, User, Mail, Phone, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../stores/useAuthStore';

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP & Password
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    phone: '',
    otpCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { register, requestOTP, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const result = await requestOTP(form.email, 'SIGNUP');
    if (result.success) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await register(form);
    if (result.success) {
      navigate('/onboarding');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4 py-8">
      {/* Floating decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-lg"
      >
        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-xl shadow-slate-200/50">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg shadow-brand-200">
              <ShoppingCart size={26} className="text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {step === 1 ? 'Create your account' : 'Verify your email'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {step === 1 ? 'Set up your business POS in seconds' : `We've sent a code to ${form.email}`}
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

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              {/* Two-column row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="John Doe"
                      required
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>

                {/* Business Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Business Name
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={form.businessName}
                      onChange={update('businessName')}
                      placeholder="My Restaurant"
                      required
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="you@business.com"
                    required
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </div>
              </div>

              {/* Two-column row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Phone <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={update('phone')}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={update('password')}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-brand-300 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Send Verification Code
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* OTP Code */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 text-center">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={form.otpCode}
                  onChange={update('otpCode')}
                  placeholder="6-digit code"
                  required
                  maxLength={6}
                  className="w-full text-center text-3xl tracking-[12px] rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-4 font-bold text-slate-900 placeholder:text-slate-300 placeholder:tracking-normal placeholder:font-medium placeholder:text-sm outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] group flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 transition-all hover:bg-brand-700 hover:shadow-brand-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full text-center text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Resend verification code
              </button>
            </form>
          )}

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Sign in
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
