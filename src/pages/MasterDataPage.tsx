import React, { useEffect, useState } from 'react';
import {
  Boxes,
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { CategoryBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import type { ItemMaster, TransportCategory, Vehicle, Warehouse } from '../types/api.js';

interface MasterProps {
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MasterDataPage: React.FC<MasterProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'items' | 'warehouses'>('vehicles');

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Vehicle Modal State
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState('');
  const [category, setCategory] = useState<TransportCategory>('CARGO');
  const [vType, setVType] = useState('MOBIL_BOX');
  const [companyName, setCompanyName] = useState('');
  const [maxWeightKg, setMaxWeightKg] = useState<number>(4000);

  // New Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [skuCode, setSkuCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [unitVolumeM3, setUnitVolumeM3] = useState<number>(0.02);
  const [unitWeightKg, setUnitWeightKg] = useState<number>(1.5);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [v, it, w] = await Promise.all([
        api.getVehicles(),
        api.getItems(),
        api.getWarehouses(),
      ]);
      setVehicles(v);
      setItems(it);
      setWarehouses(w);
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memuat master data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCategoryChange = (cat: TransportCategory) => {
    setCategory(cat);
    if (cat === 'CARGO') {
      setVType('MOBIL_BOX');
      setMaxWeightKg(4000);
    } else {
      setVType('TRAILER');
      setMaxWeightKg(35000);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createVehicle({
        plateNumber: plateNumber.toUpperCase(),
        category,
        vType,
        companyName,
        maxWeightKg,
      });
      onNotify('success', `Armada ${plateNumber} berhasil didaftarkan!`);
      setIsVehicleModalOpen(false);
      setPlateNumber('');
      setCompanyName('');
      void loadData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal mendaftarkan armada');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createItem({
        skuCode: skuCode.toUpperCase(),
        name: itemName,
        unit: unit.toUpperCase(),
        unitVolumeM3,
        unitWeightKg,
      });
      onNotify('success', `SKU ${skuCode} berhasil didaftarkan ke katalog master!`);
      setIsItemModalOpen(false);
      setSkuCode('');
      setItemName('');
      void loadData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal mendaftarkan SKU');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-brand-600" />
            Master Data Kawasan Pergudangan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan katalog kendaraan armada terverifikasi, katalog SKU barang, dan gudang
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'vehicles' && (
            <button
              onClick={() => setIsVehicleModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Daftarkan Armada
            </button>
          )}

          {activeTab === 'items' && (
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah SKU Barang
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center ${
            activeTab === 'vehicles'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4 mr-1.5" />
          Master Armada ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center ${
            activeTab === 'items'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4 mr-1.5" />
          Katalog SKU Barang ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center ${
            activeTab === 'warehouses'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <WarehouseIcon className="w-4 h-4 mr-1.5" />
          Gudang ({warehouses.length})
        </button>
      </div>

      {/* Table: Vehicles */}
      {activeTab === 'vehicles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Plat Nomor</th>
                  <th className="py-3 px-4">Kategori Armada</th>
                  <th className="py-3 px-4">Jenis Kendaraan</th>
                  <th className="py-3 px-4">Nama Perusahaan Ekspedisi</th>
                  <th className="py-3 px-4 text-right">Kapasitas Maksimal (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-sm">
                      {v.plateNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <CategoryBadge category={v.category} />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {v.vType}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {v.companyName}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800 font-semibold">
                      {v.maxWeightKg.toLocaleString()} kg
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table: Items */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4">Nama Barang</th>
                  <th className="py-3 px-4">Satuan</th>
                  <th className="py-3 px-4 text-right">Volume Satuan (m³)</th>
                  <th className="py-3 px-4 text-right">Berat Satuan (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-700">
                      {i.skuCode}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {i.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {i.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {Number(i.unitVolumeM3).toFixed(3)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {Number(i.unitWeightKg).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Table: Warehouses */}
      {activeTab === 'warehouses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode Gudang</th>
                  <th className="py-3 px-4">Nama Gudang</th>
                  <th className="py-3 px-4 text-right">Kapasitas Maksimal (m³)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {w.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {w.name}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-semibold">
                      {w.maxVolumeM3.toLocaleString()} m³
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Daftarkan Armada */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-brand-600" />
              Pendaftaran Armada Baru
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Aturan 4.1: Kategori CARGO hanya untuk Mobil Box, CONTAINER hanya untuk Trailer / Tronton.
            </p>

            <form onSubmit={handleCreateVehicle} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Polisi (Plat Nomor)
                </label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="Contoh: B 1234 ABC"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono uppercase font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori Angkutan
                  </label>
                  <select
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value as TransportCategory)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                  >
                    <option value="CARGO">CARGO (Kargo Umum)</option>
                    <option value="CONTAINER">CONTAINER (Kontainer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipe Armada
                  </label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                  >
                    {category === 'CARGO' ? (
                      <option value="MOBIL_BOX">MOBIL BOX</option>
                    ) : (
                      <>
                        <option value="TRAILER">TRAILER</option>
                        <option value="TRONTON">TRONTON</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Perusahaan Ekspedisi
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Contoh: PT Samudera Logistik"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kapasitas Muat Maksimal (kg)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={maxWeightKg}
                  onChange={(e) => setMaxWeightKg(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Mendaftarkan...' : 'Simpan Armada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah SKU Barang */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Boxes className="w-5 h-5 mr-2 text-brand-600" />
              Pendaftaran SKU Master Baru
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data dimensi dan berat satuan digunakan untuk kalkulasi otomatis utilisasi ruang gudang.
            </p>

            <form onSubmit={handleCreateItem} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode SKU
                  </label>
                  <input
                    type="text"
                    required
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value.toUpperCase())}
                    placeholder="SKU-ELEK-01"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value.toUpperCase())}
                    placeholder="PCS / ROLL / BOX"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Barang
                </label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Contoh: Kabel Fiber Optik"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volume Satuan (m³)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={unitVolumeM3}
                    onChange={(e) => setUnitVolumeM3(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berat Satuan (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={unitWeightKg}
                    onChange={(e) => setUnitWeightKg(Number(e.target.value))}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
