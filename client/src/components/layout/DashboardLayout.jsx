import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ChefHat,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Tag,
} from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS Terminal', href: '/pos', icon: ShoppingCart },
  { name: 'Kitchen Display', href: '/kds', icon: ChefHat },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Inventory', href: '/inventory', icon: Tag },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface-raised)]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-[var(--color-border)] bg-white transition-all duration-300 ease-in-out ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
          {!collapsed && (
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              Oddo<span className="text-brand-600">POS</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-[var(--color-border)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-display font-semibold text-sm shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {user?.name || 'User'}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {user?.role?.replace('_', ' ') || 'Staff'}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
