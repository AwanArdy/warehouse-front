import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  ExternalLink,
  FileCheck,
  FileText,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShieldBan,
  X,
} from 'lucide-react';
import { DocStatusBadge, DocTypeBadge } from '../components/common/Badge.js';
import { api } from '../services/api.js';
import type { DocType, GateTransaction, OfficialDocument, Warehouse } from '../types/api.js';

interface DocsProps {
  activeWarehouseId: string;
  warehouses: Warehouse[];
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const DocumentsPage: React.FC<DocsProps> = ({
  activeWarehouseId,
  warehouses,
  onNotify,
}) => {
  const [documents, setDocuments] = useState<OfficialDocument[]>([]);
  const [activeTransactions, setActiveTransactions] = useState<GateTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [filterType, setFilterType] = useState<string>('ALL');

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<OfficialDocument | null>(null);

  // Void Modal State
  const [voidDoc, setVoidDoc] = useState<OfficialDocument | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  // Daily Recap Modal State
  const [isRecapModalOpen, setIsRecapModalOpen] = useState(false);
  const [selectedRecapWarehouseId, setSelectedRecapWarehouseId] = useState<string>('');
  const [recapDate, setRecapDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isGeneratingRecap, setIsGeneratingRecap] = useState(false);

  // Generate Transaction Document Modal State
  const [isGenTxModalOpen, setIsGenTxModalOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<DocType>('GATE_PASS');
  const [isGeneratingTxDoc, setIsGeneratingTxDoc] = useState(false);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const [docs, txs] = await Promise.all([
        api.getDocuments(),
        api.getGateTransactions(),
      ]);
      setDocuments(docs);
      setActiveTransactions(txs.filter((t) => t.status !== 'GATE_OUT' && t.status !== 'CANCELLED'));
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal memuat dokumen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
    // Auto refresh while any doc is in QUEUED or COMPILING status
    const interval = setInterval(() => {
      const hasCompiling = documents.some((d) => d.status === 'QUEUED' || d.status === 'COMPILING');
      if (hasCompiling) {
        void loadDocuments();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [documents.some((d) => d.status === 'QUEUED' || d.status === 'COMPILING')]);

  // Handle Void
  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidDoc || voidReason.trim().length < 5) {
      onNotify('error', 'Alasan pembatalan surat minimal 5 karakter');
      return;
    }

    setIsVoiding(true);
    try {
      await api.voidDocument(voidDoc.id, voidReason);
      onNotify('success', `Dokumen ${voidDoc.documentNumber} resmi dibatalkan (VOID).`);
      setVoidDoc(null);
      setVoidReason('');
      void loadDocuments();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal membatalkan dokumen');
    } finally {
      setIsVoiding(false);
    }
  };

  // Handle Daily Recap Generation
  const handleGenerateRecapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWhId = selectedRecapWarehouseId || activeWarehouseId;
    if (!targetWhId) {
      onNotify('error', 'Pilih lokasi gudang terlebih dahulu');
      return;
    }
    setIsGeneratingRecap(true);
    try {
      await api.generateDailyRecap(targetWhId, recapDate);
      onNotify('success', `Pengajuan Rekapitulasi Harian tanggal ${recapDate} dikirim ke antrean kompilasi LaTeX!`);
      setIsRecapModalOpen(false);
      void loadDocuments();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal mengajukan rekap harian');
    } finally {
      setIsGeneratingRecap(false);
    }
  };

  // Handle Generate for Transaction
  const handleGenerateTxDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxId) return;

    setIsGeneratingTxDoc(true);
    try {
      await api.generateTransactionDocument(
        selectedTxId,
        selectedDocType as 'GATE_PASS' | 'BASTB' | 'SURAT_JALAN',
      );
      onNotify('success', `Dokumen ${selectedDocType} diajukan dan sedang dikompilasi oleh worker LaTeX!`);
      setIsGenTxModalOpen(false);
      setSelectedTxId('');
      void loadDocuments();
    } catch (err: unknown) {
      const error = err as { message?: string };
      onNotify('error', error.message || 'Gagal mengajukan dokumen transaksi');
    } finally {
      setIsGeneratingTxDoc(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (filterType === 'ALL') return true;
    return doc.docType === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileText className="w-5 h-5 mr-2 text-brand-600" />
            Pusat Persuratan & Pratinjau PDF LaTeX
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan dokumen resmi berkekuatan hukum (Gate Pass, BASTB, Surat Jalan, Rekap Harian) berstandar cetak tinggi PDF
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => void loadDocuments()}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsRecapModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            Rekap Harian
          </button>

          <button
            onClick={() => {
              if (activeTransactions.length > 0) {
                setSelectedTxId(activeTransactions[0]?.id || '');
              }
              setIsGenTxModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Terbitkan Surat
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {['ALL', 'GATE_PASS', 'BASTB', 'SURAT_JALAN', 'REKAP_HARIAN'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === t
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t === 'ALL' ? 'Semua Dokumen' : t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nomor Surat</th>
                <th className="py-3 px-4">Jenis Dokumen</th>
                <th className="py-3 px-4">Status Kompilasi</th>
                <th className="py-3 px-4">SHA-256 Checksum</th>
                <th className="py-3 px-4">Waktu Terbit</th>
                <th className="py-3 px-4 text-right">Aksi Legal & Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada dokumen yang diterbitkan untuk kategori ini.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isIssued = doc.status === 'ISSUED';
                  const isVoid = doc.status === 'VOID';
                  const isCompiling = doc.status === 'QUEUED' || doc.status === 'COMPILING';

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{doc.documentNumber}</span>
                        {isVoid && doc.voidReason && (
                          <span className="text-[11px] text-rose-600 block mt-0.5">
                            Alasan Void: {doc.voidReason}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <DocTypeBadge docType={doc.docType} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          {isCompiling && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                          <DocStatusBadge status={doc.status} />
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {doc.fileSha256 ? `${doc.fileSha256.slice(0, 16)}...` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {doc.issuedAt
                          ? new Date(doc.issuedAt).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {isIssued && (
                          <>
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg border border-brand-200 transition-colors"
                              title="Buka Pratinjau PDF langsung di browser"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Pratinjau
                            </button>

                            <a
                              href={api.getDocumentPdfUrl(doc.id)}
                              download={`${doc.documentNumber.replace(/\//g, '_')}.pdf`}
                              className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                              title="Unduh File PDF"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Unduh
                            </a>

                            <button
                              onClick={() => setVoidDoc(doc)}
                              className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                              title="Batalkan Dokumen Resmi"
                            >
                              <ShieldBan className="w-3 h-3 mr-1" />
                              Void
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Pratinjau PDF Langsung di Browser */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-100 text-brand-700 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    {previewDoc.documentNumber}
                    <DocTypeBadge docType={previewDoc.docType} />
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    SHA-256: {previewDoc.fileSha256 || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={api.getDocumentPdfUrl(previewDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Buka Tab Baru
                </a>
                <a
                  href={api.getDocumentPdfUrl(previewDoc.id)}
                  download={`${previewDoc.documentNumber.replace(/\//g, '_')}.pdf`}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Unduh
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Embedded PDF Frame */}
            <div className="flex-1 bg-slate-800 p-1 relative">
              <iframe
                src={api.getDocumentPdfUrl(previewDoc.id)}
                title={`Pratinjau Dokumen ${previewDoc.documentNumber}`}
                className="w-full h-full rounded-b-xl border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal: Void Dokumen */}
      {voidDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-rose-600 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Pembatalan Dokumen Resmi (VOID)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Anda akan membatalkan dokumen nomor: <strong className="font-mono">{voidDoc.documentNumber}</strong>.
              Tindakan ini tidak dapat diulang dan dicatat pada riwayat audit sistem.
            </p>

            <form onSubmit={handleVoidSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Pembatalan (Wajib Minimal 5 Karakter)
                </label>
                <textarea
                  required
                  rows={3}
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="Contoh: Kesalahan input kuantitas barang oleh petugas gate, revisi rute pengiriman"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-rose-500 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidDoc(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVoiding || voidReason.trim().length < 5}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isVoiding ? 'Memproses...' : 'Konfirmasi Batalkan Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rekap Harian */}
      {isRecapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-brand-600" />
              Generator Rekapitulasi Harian
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Kompilasi rekapitulasi harian operasional gate dan pergerakan armada ke dalam dokumen resmi PDF LaTeX.
            </p>

            <form onSubmit={handleGenerateRecapSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lokasi Gudang
                </label>
                <select
                  value={selectedRecapWarehouseId || activeWarehouseId}
                  onChange={(e) => setSelectedRecapWarehouseId(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.code} - {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Laporan
                </label>
                <input
                  type="date"
                  required
                  value={recapDate}
                  onChange={(e) => setRecapDate(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecapModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingRecap}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isGeneratingRecap ? 'Mengajukan...' : 'Kompilasi Rekap PDF'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Terbitkan Surat Transaksi */}
      {isGenTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center">
              <Printer className="w-5 h-5 mr-2 text-brand-600" />
              Penerbitan Dokumen Resmi Transaksi
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih transaksi armada aktif dan jenis dokumen resmi yang akan dicetak.
            </p>

            <form onSubmit={handleGenerateTxDocSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Transaksi Gerbang
                </label>
                <select
                  required
                  value={selectedTxId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedTxId(id);
                    const tx = activeTransactions.find((t) => t.id === id);
                    if (tx) {
                      if (tx.direction === 'INBOUND') {
                        setSelectedDocType(tx.status === 'DOC_PENDING' || tx.status === 'DOC_ISSUED' ? 'BASTB' : 'GATE_PASS');
                      } else {
                        setSelectedDocType(tx.status === 'DOC_PENDING' || tx.status === 'DOC_ISSUED' ? 'SURAT_JALAN' : 'GATE_PASS');
                      }
                    }
                  }}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50 font-semibold"
                >
                  {activeTransactions.length === 0 ? (
                    <option value="">Tidak ada transaksi aktif</option>
                  ) : (
                    activeTransactions.map((tx) => (
                      <option key={tx.id} value={tx.id}>
                        {tx.ticketNumber} ({tx.plateNumber || 'Armada'}) • {tx.direction} • {tx.status}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Dokumen Resmi
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value as DocType)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 font-semibold bg-slate-50"
                >
                  <option value="GATE_PASS">Gate Pass (Tiket Masuk Kawasan)</option>
                  {(() => {
                    const tx = activeTransactions.find((t) => t.id === selectedTxId);
                    if (!tx || tx.direction === 'INBOUND') {
                      return <option value="BASTB">BASTB (Berita Acara Bongkar Inbound)</option>;
                    }
                    return <option value="SURAT_JALAN">Surat Jalan (Manifest Muat Outbound)</option>;
                  })()}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGenTxModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isGeneratingTxDoc || !selectedTxId}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {isGeneratingTxDoc ? 'Mengajukan...' : 'Mulai Kompilasi Dokumen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
