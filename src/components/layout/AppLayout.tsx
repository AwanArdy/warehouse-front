import React, { useEffect, useState } from 'react';
import {
  Boxes,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Truck,
  Warehouse as WarehouseIcon,
  X,
  Server,
  Database,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import type { SystemHealth, Warehouse } from '../../types/api.js';

interface AppLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  warehouses: Warehouse[];
  activeWarehouseId: string;
  onWarehouseChange: (id: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onTabChange,
  warehouses,
  activeWarehouseId,
  onWarehouseChange,
  children,
}) => {
  const { user, logout, hasPermission } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  useEffect(() => {
    async function checkHealth() {
      try {
        const h = await api.getHealth();
        setHealth(h);
      } catch {
        setHealth(null);
      }
    }
    void checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: LayoutDashboard,
      show: true,
    },
    {
      id: 'gate',
      label: 'Pos Gate & Antrean',
      icon: Truck,
      show: hasPermission('gate:read'),
      badge: 'Operasional',
    },
    {
      id: 'docks',
      label: 'Loading Dock Board',
      icon: WarehouseIcon,
      show: hasPermission('master:read') || hasPermission('dock:assign'),
    },
    {
      id: 'inventory',
      label: 'Buku Besar & Inventori',
      icon: Boxes,
      show: hasPermission('inventory:read'),
    },
    {
      id: 'documents',
      label: 'Pusat Persuratan LaTeX',
      icon: FileText,
      show: hasPermission('doc:read'),
      badge: 'PDF',
    },
    {
      id: 'master',
      label: 'Master Data & Armada',
      icon: ClipboardList,
      show: hasPermission('master:read'),
    },
  ].filter((item) => item.show);

  const activeRoleLabel = user?.roles[0] || 'User';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 flex-shrink-0 border-r border-slate-800">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800 bg-slate-950/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20 mr-3">
            <WarehouseIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white leading-tight">
              PERGUDANGAN
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Enterprise Management</p>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-sm">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
              <div className="flex items-center mt-0.5">
                <span className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-800/60">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {activeRoleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-brand-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System Health Status Footer */}
        <div className="p-4 border-t border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium flex items-center">
              <Server className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Sistem Core
            </span>
            <span className="inline-flex items-center">
              <span
                className={`w-2 h-2 rounded-full mr-1.5 ${
                  health?.status === 'ok' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span
                className={`font-semibold ${
                  health?.status === 'ok' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {health?.status === 'ok' ? 'Online' : 'Degraded'}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
            <div className="flex items-center">
              <Database className="w-3 h-3 mr-1 text-slate-400" />
              <span>PG: {health?.checks.postgres.ok ? 'OK' : 'ERR'}</span>
            </div>
            <div className="flex items-center">
              <Printer className="w-3 h-3 mr-1 text-slate-400" />
              <span>LaTeX: {health?.checks.xelatex.ok ? 'OK' : 'OFF'}</span>
            </div>
          </div>

          <button
            onClick={() => void logout()}
            className="w-full mt-3 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Sesi</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-semibold text-slate-900 capitalize">
                {navItems.find((i) => i.id === currentTab)?.label || 'Operasional'}
              </span>
            </div>
          </div>

          {/* Right actions: Warehouse Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-600 hidden sm:inline">Lokasi Gudang:</span>
              <select
                value={activeWarehouseId}
                onChange={(e) => onWarehouseChange(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code} - {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-white p-4 border-b border-slate-800 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                  currentTab === item.id ? 'bg-brand-600 text-white' : 'text-slate-300'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ))}
            <button
              onClick={() => void logout()}
              className="w-full mt-2 flex items-center space-x-2 px-3 py-2 rounded-lg text-sm text-rose-400"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
