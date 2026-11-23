import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Container,
  FileCheck2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Truck,
  Warehouse,
} from 'lucide-react';
import { CategoryBadge, DirectionBadge, GateStatusBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import type {
  ContainerSize,
  Dock,
  GateTransaction,
  MovementDirection,
  TransportCategory,
  Vehicle,
  Warehouse as WarehouseType,
} from '../types/api.js';

interface GateProps {
  activeWarehouseId: string;
  warehouses: WarehouseType[];
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const GateOperationsPage: React.FC<GateProps> = ({
  activeWarehouseId,
  warehouses,
  onNotify,
}) => {
  const [transactions, setTransactions] = useState<GateTransaction[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal Gate-In State
  const [isGateInModalOpen, setIsGateInModalOpen] = useState(false);
  const [destinationWarehouseId, setDestinationWarehouseId] = useState(activeWarehouseId);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverLicenseNo, setDriverLicenseNo] = useState('');
  const [direction, setDirection] = useState<MovementDirection>('INBOUND');

  // Container inputs (Trailer/Tronton only)
  const [containerNumber, setContainerNumber] = useState('');
  const [containerSize, setContainerSize] = useState<ContainerSize>('40FT');
  const [sealNumber, setSealNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Assign Dock State
  const [assignDockModalTx, setAssignDockModalTx] = useState<GateTransaction | null>(null);
  const [selectedDockId, setSelectedDockId] = useState('');

  // Modal Gate-Out State
  const [gateOutModalTx, setGateOutModalTx] = useState<GateTransaction | null>(null);
  const [gateOutNotes, setGateOutNotes] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [txs, vehs, dks] = await Promise.all([
        api.getGateTransactions(),
        api.getVehicles(),
        api.getDocks(activeWarehouseId),
      ]);
      setTransactions(txs);
      setVehicles(vehs);
      setDocks(dks);
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memuat data gerbang');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [activeWarehouseId]);

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
  const isContainerVehicle = selectedVehicle?.category === 'CONTAINER';

  // Handle Gate-In Submission
  const handleGateInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      onNotify('error', 'Pilih kendaraan terlebih dahulu');
      return;
    }

    const whId = destinationWarehouseId || activeWarehouseId;
    if (!whId) {
      onNotify('error', 'Pilih lokasi gudang tujuan terlebih dahulu');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.processGateIn({
        vehicleId: selectedVehicleId,
        warehouseId: whId,
        driverName,
        driverLicenseNo,
        direction,
        container: isContainerVehicle
          ? {
              containerNumber,
              size: containerSize,
              sealNumber,
              isEmpty: direction === 'OUTBOUND',
            }
          : undefined,
      });

      onNotify('success', `Gate-In berhasil dicatat untuk kendaraan ${selectedVehicle?.plateNumber}!`);
      setIsGateInModalOpen(false);
      // Reset form
      setSelectedVehicleId('');
      setDriverName('');
      setDriverLicenseNo('');
      setContainerNumber('');
      setSealNumber('');
      void loadData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memproses Gate-In');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Dock Assignment
  const handleAssignDockSubmit = async () => {
    if (!assignDockModalTx || !selectedDockId) return;
    try {
      await api.assignDock(assignDockModalTx.id, selectedDockId);
      onNotify('success', `Armada berhasil diarahkan ke Loading Dock!`);
      setAssignDockModalTx(null);
      setSelectedDockId('');
      void loadData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal mengalokasikan dock');
    }
  };

  // Handle Gate-Out
  const handleGateOutSubmit = async () => {
    if (!gateOutModalTx) return;
    try {
      await api.processGateOut(gateOutModalTx.id, gateOutNotes || undefined);
      onNotify('success', `Gate-Out selesai. Kendaraan ${gateOutModalTx.plateNumber} telah keluar.`);
      setGateOutModalTx(null);
      setGateOutNotes('');
      void loadData();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memproses Gate-Out');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      (tx.ticketNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.plateNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.driverName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
        ? tx.status !== 'GATE_OUT' && tx.status !== 'CANCELLED'
        : tx.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <Truck className="w-5 h-5 mr-2 text-brand-600" />
            Pos Gerbang & Antrean Kendaraan
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan keluar-masuk armada angkutan, pemisahan Mobil Box vs Trailer, dan verifikasi kontainer ISO 6346
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => void loadData()}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Segarkan data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsGateInModalOpen(true)}
            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Catat Gate-In Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no. tiket, plat nomor, atau nama pengemudi..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
          >
            <option value="ALL">Semua Transaksi</option>
            <option value="ACTIVE">Hanya Aktif di Kawasan</option>
            <option value="GATE_IN">Gate-In (Baru Masuk)</option>
            <option value="DOCKING">Di Loading Dock</option>
            <option value="DOC_PENDING">Menunggu Dokumen</option>
            <option value="DOC_ISSUED">Surat Terbit</option>
            <option value="GATE_OUT">Gate-Out Selesai</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Armada & Kategori</th>
                <th className="py-3 px-4">Kontainer / Segel</th>
                <th className="py-3 px-4">Arah & Pengemudi</th>
                <th className="py-3 px-4">Status & Dock</th>
                <th className="py-3 px-4">Waktu Masuk</th>
                <th className="py-3 px-4 text-right">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi gerbang yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {tx.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <span className="font-mono font-bold text-slate-900">{tx.plateNumber}</span>
                        <CategoryBadge category={tx.category} />
                      </div>
                      <span className="text-[11px] text-slate-500">{tx.vType} • {tx.companyName || '-'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {tx.category === 'CONTAINER' && tx.containerNumber ? (
                        <div className="font-mono text-[11px]">
                          <span className="font-semibold text-cyan-800">{tx.containerNumber}</span>
                          <span className="text-slate-500 block">Segel: {tx.sealNumber || '-'} ({tx.containerSize})</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Bukan Kontainer</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <DirectionBadge direction={tx.direction} />
                      <span className="text-slate-900 font-medium block mt-1">{tx.driverName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">{tx.driverLicenseNo}</span>
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div>
                        <GateStatusBadge status={tx.status} />
                      </div>
                      <div className="text-[11px]">
                        {tx.dockNumber ? (
                          <span className="font-mono text-brand-700 font-medium">Dock: {tx.dockNumber}</span>
                        ) : (
                          <span className="text-slate-400 italic">Belum di Dock</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(tx.gateInAt).toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {tx.status === 'GATE_IN' && (
                        <button
                          onClick={() => setAssignDockModalTx(tx)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                        >
                          Alokasi Dock
                        </button>
                      )}
                      {(tx.status === 'DOC_PENDING' || tx.status === 'DOC_ISSUED') && (
                        <button
                          onClick={() => setGateOutModalTx(tx)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors inline-flex items-center"
                        >
                          <LogOut className="w-3 h-3 mr-1" />
                          Gate-Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Gate-In Baru */}
      {isGateInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <h3 className="text-lg font-bold text-slate-900 flex items-center">
              <Truck className="w-5 h-5 mr-2 text-brand-600" />
              Pencatatan Gate-In Armada Masuk
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih kendaraan terdaftar dan lengkapi data kedatangan sesuai aturan kategori armada.
            </p>

            <form onSubmit={handleGateInSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Gudang Tujuan
                </label>
                <select
                  required
                  value={destinationWarehouseId || activeWarehouseId}
                  onChange={(e) => setDestinationWarehouseId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold text-slate-800"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Kendaraan
                </label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Pilih Kendaraan Terdaftar --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} ({v.category} - {v.vType}) • {v.companyName}
                    </option>
                  ))}
                </select>
              </div>

              {selectedVehicle && (
                <div className={`p-3 rounded-xl border text-xs ${
                  isContainerVehicle ? 'bg-cyan-50 border-cyan-200 text-cyan-900' : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                  <span className="font-semibold block mb-0.5">
                    Kategori Terpilih: {selectedVehicle.category} ({selectedVehicle.vType})
                  </span>
                  {isContainerVehicle ? (
                    <p className="text-[11px] opacity-90">
                      Armada Trailer/Tronton wajib melampirkan nomor kontainer ISO 6346 dan nomor segel.
                    </p>
                  ) : (
                    <p className="text-[11px] opacity-90">
                      Armada Mobil Box (CARGO) dilarang menyertakan data nomor kontainer.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Arah Pergerakan
                  </label>
                  <select
                    value={direction}
                    onChange={(e) => setDirection(e.target.value as MovementDirection)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                  >
                    <option value="INBOUND">INBOUND (Bongkar)</option>
                    <option value="OUTBOUND">OUTBOUND (Muat)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nomor SIM Driver
                  </label>
                  <input
                    type="text"
                    required
                    value={driverLicenseNo}
                    onChange={(e) => setDriverLicenseNo(e.target.value)}
                    placeholder="Contoh: SIM-B2-123456"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Pengemudi (Driver)
                </label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Masukkan nama pengemudi"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Dynamic Container Fields (ISO 6346) */}
              {isContainerVehicle && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center">
                    <Container className="w-4 h-4 mr-1.5 text-cyan-700" />
                    Metadata Kontainer (Standar ISO 6346 Wajib)
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nomor Kontainer
                      </label>
                      <input
                        type="text"
                        required
                        value={containerNumber}
                        onChange={(e) => setContainerNumber(e.target.value.toUpperCase())}
                        placeholder="MSCU1234567"
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono uppercase focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Ukuran Kontainer
                      </label>
                      <select
                        value={containerSize}
                        onChange={(e) => setContainerSize(e.target.value as ContainerSize)}
                        className="w-full text-xs border border-slate-300 rounded-lg p-2 font-semibold"
                      >
                        <option value="20FT">20 FT</option>
                        <option value="40FT">40 FT</option>
                        <option value="40HC">40 HC (High Cube)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nomor Segel (Physical Seal)
                    </label>
                    <input
                      type="text"
                      required
                      value={sealNumber}
                      onChange={(e) => setSealNumber(e.target.value)}
                      placeholder="SEAL-998877"
                      className="w-full text-xs border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGateInModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Gate-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Alokasi Dock */}
      {assignDockModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">
              Alokasikan Loading Dock
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih loading dock berkategori <span className="font-bold">{assignDockModalTx.category}</span> yang tersedia.
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="text-slate-500">Tiket:</span> <span className="font-mono font-bold">{assignDockModalTx.ticketNumber}</span></p>
              <p><span className="text-slate-500">Armada:</span> <span className="font-mono font-bold">{assignDockModalTx.plateNumber}</span> ({assignDockModalTx.category})</p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Loading Dock Tersedia
              </label>
              <select
                value={selectedDockId}
                onChange={(e) => setSelectedDockId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-semibold"
              >
                <option value="">-- Pilih Loading Dock --</option>
                {docks
                  .filter((d) => d.category === assignDockModalTx.category && d.status === 'AVAILABLE')
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.dockNumber} ({d.category}) - Tersedia
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setAssignDockModalTx(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAssignDockSubmit}
                disabled={!selectedDockId}
                className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg disabled:opacity-50"
              >
                Tugaskan Dock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gate-Out */}
      {gateOutModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center text-emerald-700">
              <LogOut className="w-5 h-5 mr-1.5" />
              Konfirmasi Gate-Out Kendaraan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pastikan pengemudi telah menerima dokumen resmi (BASTB atau Surat Jalan).
            </p>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p><span className="text-slate-500">Tiket:</span> <span className="font-mono font-bold">{gateOutModalTx.ticketNumber}</span></p>
              <p><span className="text-slate-500">Armada:</span> <span className="font-mono font-bold">{gateOutModalTx.plateNumber}</span> ({gateOutModalTx.vType})</p>
              <p><span className="text-slate-500">Status Saat Ini:</span> <GateStatusBadge status={gateOutModalTx.status} /></p>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Catatan Gerbang Keluar (Opsional)
              </label>
              <textarea
                value={gateOutNotes}
                onChange={(e) => setGateOutNotes(e.target.value)}
                placeholder="Contoh: Dokumen lengkap dibawa driver, kendaraan keluar kawasan..."
                rows={2}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setGateOutModalTx(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGateOutSubmit}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Selesaikan Gate-Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
