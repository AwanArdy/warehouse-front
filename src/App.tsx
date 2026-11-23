import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer, ToastMessage } from './components/common/NotificationToast';
import { LoginPage } from './pages/LoginPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { GateOperationsPage } from './pages/GateOperationsPage';
import { DockManagementPage } from './pages/DockManagementPage';
import { InventoryPage } from './pages/InventoryPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { api } from './services/api';
import { Warehouse } from './types/api';

export const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch warehouses once authenticated
  const loadWarehouses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getWarehouses();
      if (data && data.length > 0) {
        setWarehouses(data);
        setSelectedWarehouseId((prev) => {
          if (!prev || !data.some((w) => w.id === prev)) {
            return data[0].id;
          }
          return prev;
        });
      }
    } catch {
      addToast('error', 'Gagal memuat daftar gudang');
    }
  }, [isAuthenticated, addToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadWarehouses();
    }
  }, [isAuthenticated, loadWarehouses]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-300">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium tracking-wide">Memuat Sistem Logistik Gudang...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <AppLayout
      currentTab={activeTab}
      onTabChange={setActiveTab}
      warehouses={warehouses}
      activeWarehouseId={selectedWarehouseId}
      onWarehouseChange={setSelectedWarehouseId}
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {activeTab === 'dashboard' && (
        <DashboardOverviewPage
          activeWarehouseId={selectedWarehouseId}
          warehouses={warehouses}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'gate' && (
        <GateOperationsPage
          activeWarehouseId={selectedWarehouseId}
          warehouses={warehouses}
          onNotify={addToast}
        />
      )}

      {activeTab === 'docks' && (
        <DockManagementPage
          activeWarehouseId={selectedWarehouseId}
          onNotify={addToast}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryPage
          activeWarehouseId={selectedWarehouseId}
          onNotify={addToast}
        />
      )}

      {activeTab === 'documents' && (
        <DocumentsPage
          activeWarehouseId={selectedWarehouseId}
          warehouses={warehouses}
          onNotify={addToast}
        />
      )}

      {activeTab === 'master' && (
        <MasterDataPage onNotify={addToast} />
      )}
    </AppLayout>
  );
};
