// Types matching the Backend OpenAPI 3.1 Contract

export type RoleCode = 'SUPER_ADMIN' | 'PETUGAS_GATE' | 'ADMIN_GUDANG' | 'ADMIN_PERSURATAN';

export type TransportCategory = 'CARGO' | 'CONTAINER';
export type VehicleType = 'MOBIL_BOX' | 'TRAILER' | 'TRONTON';
export type ContainerSize = '20FT' | '40FT' | '40HC';
export type MovementDirection = 'INBOUND' | 'OUTBOUND';
export type DockStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';

export type GateStatus =
  | 'GATE_IN'
  | 'DOCKING'
  | 'LOADING_UNLOADING'
  | 'DOC_PENDING'
  | 'DOC_ISSUED'
  | 'GATE_OUT'
  | 'CANCELLED';

export type DocType = 'GATE_PASS' | 'BASTB' | 'SURAT_JALAN' | 'REKAP_HARIAN';
export type DocStatus = 'QUEUED' | 'COMPILING' | 'ISSUED' | 'FAILED' | 'VOID';

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    username: string;
    fullName: string;
    roles: string[];
    permissions: string[];
  };
}

export interface SystemHealth {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  checks: {
    postgres: { ok: boolean; latencyMs?: number };
    storage: { ok: boolean; driver?: string; location?: string };
    xelatex: { ok: boolean; version?: string };
  };
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  maxVolumeM3: number;
  isActive: boolean;
  currentVolumeM3?: number;
  utilizationPercentage?: number;
}

export interface Dock {
  id: string;
  warehouseId: string;
  dockNumber: string;
  category: TransportCategory;
  status: DockStatus;
  warehouseCode?: string;
  warehouseName?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  category: TransportCategory;
  vType: VehicleType;
  companyName: string;
  maxWeightKg: number;
  isActive: boolean;
}

export interface ItemMaster {
  id: string;
  skuCode: string;
  name: string;
  unit: string;
  unitVolumeM3: number;
  unitWeightKg: number;
  isActive: boolean;
}

export interface GateTransaction {
  id: string;
  ticketNumber: string;
  vehicleId: string;
  warehouseId: string;
  dockId: string | null;
  driverName: string;
  driverLicenseNo: string;
  direction: MovementDirection;
  category: TransportCategory;
  status: GateStatus;
  gateInAt: string;
  gateOutAt: string | null;
  plateNumber?: string;
  vType?: VehicleType;
  companyName?: string;
  dockNumber?: string | null;
  warehouseCode?: string;
  warehouseName?: string;
  containerNumber?: string | null;
  containerSize?: ContainerSize | null;
  sealNumber?: string | null;
}

export interface TransactionCargoItem {
  id: string;
  gateTransactionId: string;
  itemId: string;
  skuCode: string;
  itemName: string;
  unit: string;
  quantity: number;
  weightKg: number | null;
  conditionNotes: string | null;
}

export interface WarehouseStockItem {
  itemId: string;
  skuCode: string;
  name: string;
  unit: string;
  unitVolumeM3: number;
  unitWeightKg: number;
  availableQty: number;
  allocatedQty: number;
  totalVolumeM3: number;
  totalWeightKg: number;
}

export interface WarehouseInventoryReport {
  utilization: {
    warehouseId: string;
    warehouseCode: string;
    warehouseName: string;
    maxVolumeM3: number;
    usedVolumeM3: number;
    utilizationPercentage: number;
  };
  stocks: WarehouseStockItem[];
}

export interface OfficialDocument {
  id: string;
  documentNumber: string;
  gateTransactionId: string | null;
  docType: DocType;
  status: DocStatus;
  storagePath: string | null;
  fileSha256: string | null;
  errorLog: string | null;
  retryCount: number;
  issuedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  ticketNumber?: string | null;
  plateNumber?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
  };
}
