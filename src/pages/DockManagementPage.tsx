import React, { useEffect, useState } from 'react';
import {
  Boxes,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  Truck,
  Warehouse as WarehouseIcon,
  Wrench,
} from 'lucide-react';
import { CategoryBadge, DockStatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import type { Dock, DockStatus, TransportCategory } from '../types/api.js';

interface DockProps {
  activeWarehouseId: string;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const DockManagementPage: React.FC<DockProps> = ({ activeWarehouseId, onNotify }) => {
  const [docks, setDocks] = useState<Dock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Dock Modal
  const [isNewDockModalOpen, setIsNewDockModalOpen] = useState(false);
  const [dockNumber, setDockNumber] = useState('');
  const [category, setCategory] = useState<TransportCategory>('CARGO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDocks = async () => {
    setIsLoading(true);
    try {
      const data = await api.getDocks(activeWarehouseId);
      setDocks(data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memuat data loading dock');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocks();
  }, [activeWarehouseId]);

  const handleToggleStatus = async (dock: Dock, targetStatus: DockStatus) => {
    try {
      await api.updateDockStatus(dock.id, targetStatus);
      onNotify('success', `Status ${dock.dockNumber} diubah menjadi ${targetStatus}`);
      void loadDocks();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal mengubah status dock');
    }
  };

  const handleCreateDock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWarehouseId) {
      onNotify('error', 'Pilih lokasi gudang terlebih dahulu');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.createDock({
        warehouseId: activeWarehouseId,
        dockNumber,
        category,
      });
      onNotify('success', `Loading Dock ${dockNumber} berhasil ditambahkan!`);
      setIsNewDockModalOpen(false);
      setDockNumber('');
      void loadDocks();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal membuat loading dock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCount = docks.filter((d) => d.status === 'AVAILABLE').length;
  const occupiedCount = docks.filter((d) => d.status === 'OCCUPIED').length;
  const maintenanceCount = docks.filter((d) => d.status === 'MAINTENANCE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <WarehouseIcon className="w-5 h-5 mr-2 text-brand-600" />
            Loading Dock Management Board
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi alokasi loading dock gudang dengan pemisahan jalur armada CARGO vs CONTAINER
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => void loadDocks()}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsNewDockModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Loading Dock
          </button>
        </div>
      </div>

      {/* Dock Metric Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Dock Tersedia</span>
            <p className="text-xl font-bold text-slate-900">{availableCount} Dock</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Dock Terpakai (Bongkar/Muat)</span>
            <p className="text-xl font-bold text-slate-900">{occupiedCount} Dock</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500">Maintenance / Perawatan</span>
            <p className="text-xl font-bold text-slate-900">{maintenanceCount} Dock</p>
          </div>
        </div>
      </div>

      {/* Grid of Docks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {docks.map((dock) => {
          const isOccupied = dock.status === 'OCCUPIED';
          const isAvailable = dock.status === 'AVAILABLE';
          const isMaintenance = dock.status === 'MAINTENANCE';

          return (
            <div
              key={dock.id}
              className={`rounded-2xl border p-5 transition-all shadow-sm ${
                isOccupied
                  ? 'bg-amber-50/40 border-amber-300'
                  : isMaintenance
                  ? 'bg-slate-50 border-slate-300 opacity-80'
                  : 'bg-white border-slate-200 hover:border-brand-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 font-mono">DOCK ID</span>
                  <h3 className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                    {dock.dockNumber}
                  </h3>
                </div>
                <DockStatusBadge status={dock.status} />
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Kategori Armada:</span>
                <CategoryBadge category={dock.category} />
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                {isMaintenance ? (
                  <button
                    onClick={() => void handleToggleStatus(dock, 'AVAILABLE')}
                    className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                  >
                    Buka Kembali (Tersedia)
                  </button>
                ) : isAvailable ? (
                  <button
                    onClick={() => void handleToggleStatus(dock, 'MAINTENANCE')}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors inline-flex items-center"
                  >
                    <Wrench className="w-3 h-3 mr-1" />
                    Set Maintenance
                  </button>
                ) : (
                  <span className="text-xs text-amber-700 font-medium italic flex items-center">
                    <Lock className="w-3 h-3 mr-1" />
                    Sedang berlangsung aktivitas
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Tambah Dock */}
      {isNewDockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Tambah Loading Dock Baru</h3>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan pintu loading dock baru untuk gudang yang sedang aktif.
            </p>

            <form onSubmit={handleCreateDock} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor / Kode Dock
                </label>
                <input
                  type="text"
                  required
                  value={dockNumber}
                  onChange={(e) => setDockNumber(e.target.value.toUpperCase())}
                  placeholder="Contoh: DOCK-05"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono uppercase focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kategori Layanan Angkutan
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TransportCategory)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                >
                  <option value="CARGO">CARGO (Khusus Mobil Box)</option>
                  <option value="CONTAINER">CONTAINER (Khusus Trailer/Tronton)</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewDockModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Dock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
