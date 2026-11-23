import React, { useEffect, useState } from 'react';
import {
  Boxes,
  ClipboardPen,
  FileCheck2,
  PackageCheck,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api.js';
import type {
  GateTransaction,
  ItemMaster,
  TransactionCargoItem,
  WarehouseInventoryReport,
} from '../types/api.js';

interface InventoryProps {
  activeWarehouseId: string;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const InventoryPage: React.FC<InventoryProps> = ({ activeWarehouseId, onNotify }) => {
  const [inventoryReport, setInventoryReport] = useState<WarehouseInventoryReport | null>(null);
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>([]);
  const [dockingTransactions, setDockingTransactions] = useState<GateTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargo Recording Modal
  const [cargoModalTx, setCargoModalTx] = useState<GateTransaction | null>(null);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState<number>(10);
  const [weightKg, setWeightKg] = useState<number>(0);
  const [conditionNotes, setConditionNotes] = useState('');
  const [recordedItems, setRecordedItems] = useState<
    Array<{ itemId: string; itemName: string; quantity: number; weightKg?: number; conditionNotes?: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [inv, items, txs] = await Promise.all([
        activeWarehouseId ? api.getWarehouseInventory(activeWarehouseId) : Promise.resolve(null),
        api.getItems(),
        api.getGateTransactions(),
      ]);
      setInventoryReport(inv);
      setItemsMaster(items);
      // Filter transactions that are currently in DOCKING or LOADING_UNLOADING
      setDockingTransactions(
        txs.filter((t) => t.status === 'DOCKING' || t.status === 'LOADING_UNLOADING'),
      );
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memuat inventori');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeWarehouseId]);

  const handleOpenCargoModal = async (tx: GateTransaction) => {
    setCargoModalTx(tx);
    setSelectedItemId(itemsMaster[0]?.id || '');
    setQuantity(10);
    setConditionNotes('Kondisi baik, kemasan rapi');
    try {
      const existing = await api.getTransactionCargoItems(tx.id);
      const itemsList = Array.isArray(existing) ? existing : (existing as any)?.items || [];
      setRecordedItems(
        itemsList.map((e: any) => ({
          itemId: e.itemId,
          itemName: e.itemName || e.name || '',
          quantity: e.quantity,
          weightKg: e.weightKg || undefined,
          conditionNotes: e.conditionNotes || undefined,
        })),
      );
    } catch {
      setRecordedItems([]);
    }
  };

  const handleAddItemToRecord = () => {
    const item = itemsMaster.find((i) => i.id === selectedItemId);
    if (!item) return;

    setRecordedItems([
      ...recordedItems,
      {
        itemId: item.id,
        itemName: item.name,
        quantity,
        weightKg: weightKg || item.unitWeightKg * quantity,
        conditionNotes,
      },
    ]);
  };

  const handleRemoveRecordedItem = (index: number) => {
    setRecordedItems(recordedItems.filter((_, i) => i !== index));
  };

  const handleSaveAndFinalizeCargo = async (shouldFinalize = false) => {
    if (!cargoModalTx || recordedItems.length === 0) {
      onNotify('error', 'Minimal harus ada 1 barang dalam daftar muatan');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Simpan rincian barang kargo
      await api.recordCargoItems(
        cargoModalTx.id,
        recordedItems.map((r) => ({
          itemId: r.itemId,
          quantity: r.quantity,
          weightKg: r.weightKg,
          conditionNotes: r.conditionNotes,
        })),
      );

      // 2. Finalisasi jika diminta
      if (shouldFinalize) {
        if (cargoModalTx.direction === 'INBOUND') {
          await api.finalizeInbound(cargoModalTx.id);
          onNotify(
            'success',
            `Realisasi bongkar Inbound selesai! Stok bertambah dan dokumen BASTB siap diterbitkan.`,
          );
        } else {
          await api.finalizeOutbound(cargoModalTx.id);
          onNotify(
            'success',
            `Realisasi muat Outbound selesai! Stok gudang telah dipotong dan Surat Jalan siap diterbitkan.`,
          );
        }
      } else {
        onNotify('success', 'Rincian muatan kargo berhasil disimpan!');
      }

      setCargoModalTx(null);
      void loadData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memproses muatan kargo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stocks = inventoryReport?.stocks || [];
  const utilization = inventoryReport?.utilization;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Boxes className="w-5 h-5 mr-2 text-brand-600" />
            Buku Besar & Saldo Inventori Gudang
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan realisasi bongkar muat kargo dan penghitungan utilisasi kapasitas ruang gudang secara real-time
          </p>
        </div>

        <button
          onClick={() => void loadData()}
          className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Capacity Utilization Card */}
      {utilization && (
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                Utilisasi Kapasitas Gudang ({utilization.warehouseCode})
              </span>
              <h3 className="text-2xl font-black mt-1">
                {(utilization.utilizationPercentage ?? (utilization as any).utilizationPercent ?? 0).toFixed(2)}% Terpakai
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Volume Terpakai: <span className="font-semibold text-white">{(utilization.usedVolumeM3 ?? 0).toFixed(2)} m³</span> dari total kapasitas{' '}
                <span className="font-semibold text-white">{(utilization.maxVolumeM3 ?? 0).toLocaleString()} m³</span>
              </p>
            </div>

            <div className="w-full md:w-64">
              <div className="w-full bg-slate-700/80 rounded-full h-3.5 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-400 to-emerald-400 transition-all duration-700"
                  style={{ width: `${Math.min(utilization.utilizationPercentage ?? (utilization as any).utilizationPercent ?? 0, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Docked Vehicles Waiting for Cargo Operation */}
      {dockingTransactions.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-amber-950 flex items-center mb-1">
            <ClipboardPen className="w-4 h-4 mr-1.5 text-amber-700" />
            Armada Menunggu Realisasi Bongkar / Muat ({dockingTransactions.length})
          </h3>
          <p className="text-xs text-amber-800 mb-3">
            Armada telah berada di loading dock. Admin Gudang wajib mencatat rincian barang sebelum finalisasi.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dockingTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <span className="font-mono font-bold text-slate-900 block">{tx.plateNumber}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    Dock: <span className="font-bold text-brand-700">{tx.dockNumber}</span> • {tx.direction}
                  </span>
                </div>
                <button
                  onClick={() => void handleOpenCargoModal(tx)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
                >
                  Input Muatan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Katalog Saldo Stok Barang</h3>
            <p className="text-xs text-slate-500 mt-0.5">Saldo fisik dan utilisasi volume satuan SKU</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{stocks.length} SKU Terdaftar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">SKU Code</th>
                <th className="py-3 px-4">Nama Barang</th>
                <th className="py-3 px-4 text-right">Saldo Tersedia</th>
                <th className="py-3 px-4 text-right">Satuan</th>
                <th className="py-3 px-4 text-right">Vol Satuan (m³)</th>
                <th className="py-3 px-4 text-right">Total Volume (m³)</th>
                <th className="py-3 px-4 text-right">Total Berat (kg)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data stok barang pada gudang ini. Lakukan aktivitas bongkar Inbound untuk mengisi stok.
                  </td>
                </tr>
              ) : (
                stocks.map((item) => (
                  <tr key={item.itemId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {item.skuCode}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                      {Number(item.availableQty).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-medium">
                      {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {Number(item.unitVolumeM3).toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {Number(item.totalVolumeM3).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {Number(item.totalWeightKg).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Input & Finalize Cargo */}
      {cargoModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <PackageCheck className="w-5 h-5 mr-2 text-brand-600" />
              Pencatatan Realisasi Kargo ({cargoModalTx.direction})
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Armada: <span className="font-mono font-bold text-slate-800">{cargoModalTx.plateNumber}</span> ({cargoModalTx.vType}) • Dock:{' '}
              <span className="font-bold text-brand-700">{cargoModalTx.dockNumber}</span>
            </p>

            {/* Input Form for adding single SKU */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Tambah Rincian Barang</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pilih SKU Barang</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    {itemsMaster.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.skuCode} - {i.name} ({i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Kuantitas</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Catatan Kondisi Barang</label>
                <input
                  type="text"
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  placeholder="Contoh: Kondisi karton mulus, segel rapi"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItemToRecord}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg"
              >
                + Masukkan ke Manifest
              </button>
            </div>

            {/* Current Recorded Items Table */}
            <div className="mt-4">
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Daftar Barang yang Dimuat/Dibongkar ({recordedItems.length})
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Barang</th>
                      <th className="p-2.5 text-right">Kuantitas</th>
                      <th className="p-2.5">Catatan</th>
                      <th className="p-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recordedItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          Belum ada item barang yang dimasukkan.
                        </td>
                      </tr>
                    ) : (
                      recordedItems.map((r, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-900">{r.itemName}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">{r.quantity}</td>
                          <td className="p-2.5 text-slate-500">{r.conditionNotes || '-'}</td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveRecordedItem(idx)}
                              className="text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCargoModalTx(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Tutup
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={isSubmitting || recordedItems.length === 0}
                  onClick={() => void handleSaveAndFinalizeCargo(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                >
                  Simpan Draf Saja
                </button>
                <button
                  type="button"
                  disabled={isSubmitting || recordedItems.length === 0}
                  onClick={() => void handleSaveAndFinalizeCargo(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Finalisasi & Bebaskan Dock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
