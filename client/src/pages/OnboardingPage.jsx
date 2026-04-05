import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, QrCode, UtensilsCrossed, Check, ArrowRight, ArrowLeft,
  Plus, X, AlertCircle, ShoppingCart, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../config/api';

const STEPS = [
  { id: 'payment', title: 'Payment Methods', icon: CreditCard, description: 'How will your customers pay?' },
  { id: 'products', title: 'Add Products', icon: ShoppingCart, description: 'Add your first products to get started' },
  { id: 'upi', title: 'UPI Setup', icon: QrCode, description: 'Set up dynamic QR code payments' },
  { id: 'tables', title: 'Table Setup', icon: UtensilsCrossed, description: 'How many tables does your business have?' },
];

const PAYMENT_OPTIONS = [
  { id: 'CASH', label: 'Cash', icon: '💵', desc: 'Accept cash payments' },
  { id: 'CARD', label: 'Card', icon: '💳', desc: 'Credit/Debit card payments' },
  { id: 'UPI', label: 'UPI', icon: '📱', desc: 'UPI & QR code payments' },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Payment Methods
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Step 2: Products
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState({ name: '', price: '' });
  const [skippedProducts, setSkippedProducts] = useState(false);
  const [showProductReminder, setShowProductReminder] = useState(false);

  // Step 3: UPI
  const [upiId, setUpiId] = useState('');

  // Step 4: Tables
  const [totalTables, setTotalTables] = useState(1);

  const togglePayment = (id) => {
    setPaymentMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const addProduct = () => {
    if (!productForm.name.trim() || !productForm.price) return;
    setProducts((prev) => [...prev, { name: productForm.name.trim(), price: parseFloat(productForm.price) }]);
    setProductForm({ name: '', price: '' });
    setSkippedProducts(false);
    setShowProductReminder(false);
  };

  const removeProduct = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    // Step 2 (products): if no products and not yet reminded, show reminder
    if (currentStep === 1 && products.length === 0 && !skippedProducts) {
      setShowProductReminder(true);
      setSkippedProducts(true);
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
    setShowProductReminder(false);
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    setShowProductReminder(false);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save settings (payment methods, UPI, tables)
      await api.patch('/settings', {
        paymentMethods,
        upiId,
        totalTables,
        onboardingCompleted: true,
      });

      // Create products if any were added
      for (const product of products) {
        await api.post('/products', {
          name: product.name,
          price: product.price,
          stock: 0,
        });
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      alert(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return paymentMethods.length > 0;
      case 1: return true; // products are optional
      case 2: return paymentMethods.includes('UPI') ? upiId.trim().length > 0 : true;
      case 3: return totalTables >= 1;
      default: return true;
    }
  };

  const isLastStep = currentStep === STEPS.length - 1;

  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50 px-4 py-8">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  i < currentStep
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : i === currentStep
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-200'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {i < currentStep ? <Check size={18} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 h-0.5 w-12 sm:w-20 transition-all duration-300 ${
                    i < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-slate-500">
            Step {currentStep + 1} of {STEPS.length}: <span className="font-medium text-slate-700">{STEPS[currentStep].title}</span>
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-xl shadow-slate-200/50 min-h-[420px] flex flex-col">
          {/* Step header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              {(() => { const Icon = STEPS[currentStep].icon; return <Icon size={28} />; })()}
            </div>
            <h2 className="font-display text-xl font-bold text-slate-900">{STEPS[currentStep].title}</h2>
            <p className="mt-1 text-sm text-slate-500">{STEPS[currentStep].description}</p>
          </div>

          {/* Step content */}
          <div className="flex-1">
            <AnimatePresence mode="wait" custom={1}>
              {/* Step 1: Payment Methods */}
              {currentStep === 0 && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  {PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => togglePayment(option.id)}
                      className={`flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-all ${
                        paymentMethods.includes(option.id)
                          ? 'border-brand-500 bg-brand-50 shadow-md shadow-brand-100'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{option.label}</p>
                        <p className="text-sm text-slate-500">{option.desc}</p>
                      </div>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                        paymentMethods.includes(option.id)
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-slate-300'
                      }`}>
                        {paymentMethods.includes(option.id) && <Check size={14} className="text-white" />}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Step 2: Products */}
              {currentStep === 1 && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Product reminder */}
                  {showProductReminder && products.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                    >
                      <AlertCircle size={18} className="mt-0.5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Don't forget to add products!</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Adding products now will help you get started faster. You can skip if you want to add them later from Inventory.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Add product form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addProduct()}
                      className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && addProduct()}
                      className="w-28 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                    />
                    <button
                      type="button"
                      onClick={addProduct}
                      disabled={!productForm.name.trim() || !productForm.price}
                      className="flex items-center justify-center rounded-xl bg-brand-600 px-4 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {/* Product list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {products.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5"
                      >
                        <span className="text-sm font-medium text-slate-800">{p.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-brand-600">₹{p.price}</span>
                          <button
                            type="button"
                            onClick={() => removeProduct(i)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {products.length === 0 && !showProductReminder && (
                    <p className="text-center text-sm text-slate-400 py-6">
                      No products added yet. Add some or skip for now.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Step 3: UPI Setup */}
              {currentStep === 2 && (
                <motion.div
                  key="upi"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {paymentMethods.includes('UPI') ? (
                    <>
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-sm text-blue-700">
                          Your UPI ID will be used to generate dynamic QR codes for customer payments at checkout.
                        </p>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          UPI ID
                        </label>
                        <input
                          type="text"
                          placeholder="yourname@upi or 9876543210@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                        />
                        <p className="mt-1.5 text-xs text-slate-400">
                          Example: business@okaxis, 9876543210@ybl
                        </p>
                      </div>
                      {upiId.trim() && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"
                        >
                          <Check size={18} className="text-emerald-500" />
                          <p className="text-sm text-emerald-700">UPI ID set: <span className="font-mono font-medium">{upiId}</span></p>
                        </motion.div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <QrCode size={48} className="mx-auto mb-3 text-slate-300" />
                      <p className="text-sm text-slate-500">
                        You haven't selected UPI as a payment method.
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        You can enable it later in Settings if needed.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 4: Tables */}
              {currentStep === 3 && (
                <motion.div
                  key="tables"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <label className="mb-4 block text-sm font-medium text-slate-700">
                      Total number of tables in your business
                    </label>
                    <div className="flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={() => setTotalTables((t) => Math.max(1, t - 1))}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-200 text-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={totalTables}
                        onChange={(e) => setTotalTables(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-24 rounded-xl border-2 border-brand-200 bg-brand-50 px-4 py-3 text-center text-2xl font-bold text-brand-700 outline-none focus:border-brand-400"
                      />
                      <button
                        type="button"
                        onClick={() => setTotalTables((t) => t + 1)}
                        className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-slate-200 text-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      This helps organize orders by table. You can change this anytime in Settings.
                    </p>
                  </div>

                  {/* Summary preview */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Setup Summary</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Payment Methods</span>
                      <span className="font-medium text-slate-900">{paymentMethods.join(', ') || 'None'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Products Added</span>
                      <span className="font-medium text-slate-900">{products.length}</span>
                    </div>
                    {upiId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">UPI ID</span>
                        <span className="font-medium font-mono text-slate-900">{upiId}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Tables</span>
                      <span className="font-medium text-slate-900">{totalTables}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-0 disabled:pointer-events-none transition-all"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving || !canProceed()}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    Complete Setup
                    <Check size={16} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className="group flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-200 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {currentStep === 1 && products.length === 0 ? 'Skip' : 'Continue'}
                <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          You can change all of these settings later from the Settings page.
        </p>
      </div>
    </div>
  );
}
