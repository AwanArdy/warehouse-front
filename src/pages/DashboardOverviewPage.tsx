import React, { useEffect, useState } from 'react';
import {
  Boxes,
  FileCheck2,
  RefreshCw,
  TrendingUp,
  Truck,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { CategoryBadge, DirectionBadge, GateStatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import type { GateTransaction, Warehouse, WarehouseInventoryReport } from '../types/api.js';

interface DashboardProps {
  activeWarehouseId: string;
  warehouses: Warehouse[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardOverviewPage: React.FC<DashboardProps> = ({
  activeWarehouseId,
  warehouses,
  onNavigateTab,
}) => {
  const [activeTxs, setActiveTxs] = useState<GateTransaction[]>([]);
  const [inventoryReport, setInventoryReport] = useState<WarehouseInventoryReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeWarehouse = warehouses.find((w) => w.id === activeWarehouseId);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txs, inv] = await Promise.all([
        api.getGateTransactions(),
        activeWarehouseId ? api.getWarehouseInventory(activeWarehouseId) : null,
      ]);
      setActiveTxs(txs);
      setInventoryReport(inv);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [activeWarehouseId]);

  const vehiclesInArea = activeTxs.filter((t) => t.status !== 'GATE_OUT' && t.status !== 'CANCELLED');
  const dockingCount = activeTxs.filter((t) => t.status === 'DOCKING' || t.status === 'LOADING_UNLOADING').length;
  const docsPendingCount = activeTxs.filter((t) => t.status === 'DOC_PENDING').length;

  const usedVolume = inventoryReport?.utilization?.usedVolumeM3 ?? 0;
  const maxVolume = inventoryReport?.utilization?.maxVolumeM3 ?? activeWarehouse?.maxVolumeM3 ?? 10000;
  const utilizationPct = inventoryReport?.utilization?.utilizationPercentage ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Ringkasan Operasional Kawasan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gudang Aktif: <span className="font-semibold text-slate-700">{activeWarehouse?.name || 'Semua Gudang'}</span> ({activeWarehouse?.code || 'Pusat'})
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan Data
          </button>
          <button
            onClick={() => onNavigateTab('gate')}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
          >
            <Truck className="w-3.5 h-3.5 mr-1.5" />
            Catat Gate-In Baru
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles in yard */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Armada di Kawasan</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{vehiclesInArea.length}</p>
          <p className="text-xs text-slate-500 mt-1">
            <span className="text-amber-600 font-semibold">{dockingCount}</span> sedang di loading dock
          </p>
        </div>

        {/* Loading Docks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aktivitas Bongkar/Muat</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <WarehouseIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{dockingCount}</p>
          <p className="text-xs text-slate-500 mt-1">
            Realisasi kargo aktif
          </p>
        </div>

        {/* Documents Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Antre Terbit Dokumen</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{docsPendingCount}</p>
          <p className="text-xs text-slate-500 mt-1">
            Menunggu BASTB / Surat Jalan
          </p>
        </div>

        {/* Warehouse Storage Utilization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Utilisasi Kapasitas</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-slate-900">{utilizationPct.toFixed(1)}%</span>
            <span className="text-xs text-slate-500 font-medium">dari {maxVolume.toLocaleString()} m³</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilizationPct > 90 ? 'bg-rose-500' : utilizationPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(utilizationPct, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            Terpakai: {usedVolume.toFixed(2)} m³
          </p>
        </div>
      </div>

      {/* Active Vehicles Real-time Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Armada Aktif di Kawasan Pergudangan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Seluruh armada yang telah Gate-In dan belum Gate-Out</p>
          </div>
          <button
            onClick={() => onNavigateTab('gate')}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center"
          >
            <span>Buka Pos Gate Penuh</span>
            <span className="ml-1">→</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Armada & Plat</th>
                <th className="py-3 px-4">Kategori & Arah</th>
                <th className="py-3 px-4">Pengemudi / Ekspedisi</th>
                <th className="py-3 px-4">Loading Dock</th>
                <th className="py-3 px-4">Status Transaksi</th>
                <th className="py-3 px-4 text-right">Waktu Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehiclesInArea.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada kendaraan yang sedang berada di dalam kawasan saat ini.
                  </td>
                </tr>
              ) : (
                vehiclesInArea.slice(0, 8).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {tx.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block font-mono">{tx.plateNumber}</span>
                      <span className="text-[11px] text-slate-500">{tx.vType}</span>
                    </td>
                    <td className="py-3.5 px-4 space-x-1">
                      <CategoryBadge category={tx.category} />
                      <DirectionBadge direction={tx.direction} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-900 font-medium block">{tx.driverName}</span>
                      <span className="text-[11px] text-slate-500">{tx.companyName || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {tx.dockNumber ? (
                        <span className="font-mono font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {tx.dockNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum dialokasikan</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <GateStatusBadge status={tx.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {new Date(tx.gateInAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
