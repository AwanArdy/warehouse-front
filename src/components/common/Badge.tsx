import React from 'react';
import type {
  DocStatus,
  DocType,
  DockStatus,
  GateStatus,
  MovementDirection,
  TransportCategory,
} from '../../types/api.js';

export const GateStatusBadge: React.FC<{ status: GateStatus }> = ({ status }) => {
  const configs: Record<GateStatus, { bg: string; text: string; label: string }> = {
    GATE_IN: { bg: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-700', label: 'Masuk Kawasan' },
    DOCKING: { bg: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-700', label: 'Di Loading Dock' },
    LOADING_UNLOADING: { bg: 'bg-purple-50 text-purple-700 border-purple-200', text: 'text-purple-700', label: 'Bongkar / Muat' },
    DOC_PENDING: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', text: 'text-indigo-700', label: 'Menunggu Surat' },
    DOC_ISSUED: { bg: 'bg-teal-50 text-teal-700 border-teal-200', text: 'text-teal-700', label: 'Surat Terbit' },
    GATE_OUT: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', label: 'Keluar Kawasan' },
    CANCELLED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', text: 'text-rose-700', label: 'Dibatalkan' },
  };

  const c = configs[status] || { bg: 'bg-slate-100 text-slate-700 border-slate-200', label: status };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {c.label}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: TransportCategory }> = ({ category }) => {
  return category === 'CARGO' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
      CARGO (Box)
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-300">
      CONTAINER
    </span>
  );
};

export const DirectionBadge: React.FC<{ direction: MovementDirection }> = ({ direction }) => {
  return direction === 'INBOUND' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
      ↓ Inbound (Bongkar)
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
      ↑ Outbound (Muat)
    </span>
  );
};

export const DockStatusBadge: React.FC<{ status: DockStatus }> = ({ status }) => {
  const configs: Record<DockStatus, { bg: string; label: string }> = {
    AVAILABLE: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Tersedia' },
    OCCUPIED: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Sedang Terpakai' },
    MAINTENANCE: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Maintenance' },
  };

  const c = configs[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg}`}>
      {c.label}
    </span>
  );
};

export const DocTypeBadge: React.FC<{ docType: DocType }> = ({ docType }) => {
  const labels: Record<DocType, string> = {
    GATE_PASS: 'Gate Pass',
    BASTB: 'BASTB (Inbound)',
    SURAT_JALAN: 'Surat Jalan (Outbound)',
    REKAP_HARIAN: 'Rekap Harian',
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-100 text-slate-800 border border-slate-300">
      {labels[docType] || docType}
    </span>
  );
};

export const DocStatusBadge: React.FC<{ status: DocStatus }> = ({ status }) => {
  const configs: Record<DocStatus, { bg: string; label: string; icon?: string }> = {
    QUEUED: { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Antre Kompilasi' },
    COMPILING: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Sedang Kompilasi...' },
    ISSUED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Terbit (PDF)' },
    FAILED: { bg: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Gagal' },
    VOID: { bg: 'bg-slate-200 text-slate-700 line-through border-slate-300', label: 'Batal (VOID)' },
  };

  const c = configs[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.bg}`}>
      {c.label}
    </span>
  );
};
