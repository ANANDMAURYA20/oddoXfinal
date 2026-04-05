import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import KDSPage from './pages/KDSPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import KDSLoginPage from './pages/KDSLoginPage';
import KDSSettingsPage from './pages/KDSSettingsPage';
import TableManagementPage from './pages/TableManagementPage';
import CustomerDisplayPage from './pages/CustomerDisplayPage';
import LandingPage from './pages/LandingPage';

// Lazy-loaded customer pages (public, no auth)
const CustomerLandingPage = lazy(() => import('./pages/customer/CustomerLandingPage'));
const CustomerMenuPage = lazy(() => import('./pages/customer/CustomerMenuPage'));
const CustomerProductPage = lazy(() => import('./pages/customer/CustomerProductPage'));
const CustomerCartPage = lazy(() => import('./pages/customer/CustomerCartPage'));
const CustomerConfirmationPage = lazy(() => import('./pages/customer/CustomerConfirmationPage'));
const CustomerTrackingPage = lazy(() => import('./pages/customer/CustomerTrackingPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="h-8 w-8 animate-spin rounded-full border-3 border-orange-200 border-t-orange-500" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/kds-login" element={<KDSLoginPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* ── Customer Facing Display (open on second screen) ── */}
          <Route path="/customer-display" element={<CustomerDisplayPage />} />

          {/* ── Customer QR Ordering (Public, no auth) ── */}
          <Route path="/order/:tenantId/:tableNumber" element={<CustomerLandingPage />} />
          <Route path="/order/:tenantId/:tableNumber/menu" element={<CustomerMenuPage />} />
          <Route path="/order/:tenantId/:tableNumber/product/:productId" element={<CustomerProductPage />} />
          <Route path="/order/:tenantId/:tableNumber/cart" element={<CustomerCartPage />} />
          <Route path="/order/:tenantId/:tableNumber/confirmation/:orderId" element={<CustomerConfirmationPage />} />
          <Route path="/order/:tenantId/:tableNumber/tracking/:orderId" element={<CustomerTrackingPage />} />

          {/* Protected — Admin Dashboard (Super Admin only, full-screen) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Protected — POS and KDS are full-screen (no sidebar) */}
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kds"
            element={
              <ProtectedRoute>
                <KDSPage />
              </ProtectedRoute>
            }
          />

          {/* Protected — With Sidebar Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout><DashboardPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <DashboardLayout><OrdersPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <DashboardLayout><InventoryPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <DashboardLayout><ReportsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute>
                <DashboardLayout><StaffPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <DashboardLayout><SettingsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/kds-settings"
            element={
              <ProtectedRoute>
                <DashboardLayout><KDSSettingsPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tables"
            element={
              <ProtectedRoute>
                <DashboardLayout><TableManagementPage /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Landing Page as Root */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
