import type {
  ApiResponse,
  ApiErrorResponse,
  AuthTokenPair,
  Dock,
  DockStatus,
  GateTransaction,
  ItemMaster,
  OfficialDocument,
  SystemHealth,
  TransactionCargoItem,
  UserProfile,
  Vehicle,
  Warehouse,
  WarehouseInventoryReport,
} from '../types/api.js';

const API_BASE_URL = '';

function normalizeGateTransaction(tx: any): GateTransaction {
  if (!tx) return tx;
  return {
    ...tx,
    plateNumber: tx.plateNumber || tx.vehicle?.plateNumber || '',
    vType: tx.vType || tx.vehicle?.vType || 'MOBIL_BOX',
    companyName: tx.companyName || tx.vehicle?.companyName || '',
    dockNumber: tx.dockNumber || tx.dock?.dockNumber || null,
    warehouseCode: tx.warehouseCode || tx.warehouse?.code || '',
    warehouseName: tx.warehouseName || tx.warehouse?.name || '',
    containerNumber: tx.containerNumber || tx.container?.containerNumber || null,
    containerSize: tx.containerSize || tx.container?.size || null,
    sealNumber: tx.sealNumber || tx.container?.sealNumber || null,
  };
}

class ApiClient {
  private getAccessToken(): string | null {
    return localStorage.getItem('warehouse_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('warehouse_refresh_token');
  }

  private setTokens(access: string, refresh: string) {
    localStorage.setItem('warehouse_access_token', access);
    localStorage.setItem('warehouse_refresh_token', refresh);
  }

  public clearTokens() {
    localStorage.removeItem('warehouse_access_token');
    localStorage.removeItem('warehouse_refresh_token');
    localStorage.removeItem('warehouse_user_profile');
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getAccessToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Auto-refresh token on 401 Unauthorized
    if (response.status === 401 && !endpoint.includes('/api/v1/auth/')) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData: ApiResponse<AuthTokenPair> = await refreshRes.json();
            this.setTokens(refreshData.data.accessToken, refreshData.data.refreshToken);

            // Retry original request with new token
            headers.set('Authorization', `Bearer ${refreshData.data.accessToken}`);
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
          } else {
            this.clearTokens();
            window.dispatchEvent(new Event('auth:unauthorized'));
          }
        } catch {
          this.clearTokens();
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      }
    }

    if (!response.ok) {
      let errorPayload: ApiErrorResponse | null = null;
      try {
        errorPayload = await response.json();
      } catch {
        // response is not json
      }

      const message =
        errorPayload?.error?.message ||
        `Permintaan gagal dengan status ${response.status} (${response.statusText})`;
      const err = new Error(message) as Error & {
        status: number;
        code?: string;
        details?: unknown;
      };
      err.status = response.status;
      err.code = errorPayload?.error?.code;
      err.details = errorPayload?.error?.details;
      throw err;
    }

    const json: ApiResponse<T> = await response.json();
    return json.data;
  }

  // Auth Endpoints
  async login(username: string, password: string): Promise<AuthTokenPair> {
    const data = await this.request<AuthTokenPair>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('warehouse_user_profile', JSON.stringify(data.user));
    return data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.request('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // ignore logout network errors
      }
    }
    this.clearTokens();
  }

  async getMe(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/v1/auth/me');
  }

  // System
  async getHealth(): Promise<SystemHealth> {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.json();
  }

  // Warehouses & Docks
  async getWarehouses(): Promise<Warehouse[]> {
    return this.request<Warehouse[]>('/api/v1/warehouses');
  }

  async createWarehouse(input: { code: string; name: string; maxVolumeM3: number }): Promise<Warehouse> {
    return this.request<Warehouse>('/api/v1/warehouses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getDocks(warehouseId?: string): Promise<Dock[]> {
    const query = warehouseId ? `?warehouseId=${warehouseId}` : '';
    return this.request<Dock[]>(`/api/v1/docks${query}`);
  }

  async createDock(input: {
    warehouseId: string;
    dockNumber: string;
    category: 'CARGO' | 'CONTAINER';
  }): Promise<Dock> {
    return this.request<Dock>('/api/v1/docks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateDockStatus(dockId: string, status: DockStatus): Promise<Dock> {
    return this.request<Dock>(`/api/v1/docks/${dockId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    return this.request<Vehicle[]>('/api/v1/vehicles');
  }

  async createVehicle(input: {
    plateNumber: string;
    category: 'CARGO' | 'CONTAINER';
    vType: string;
    companyName: string;
    maxWeightKg: number;
  }): Promise<Vehicle> {
    return this.request<Vehicle>('/api/v1/vehicles', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async lookupVehicleByPlate(plateNumber: string): Promise<Vehicle> {
    return this.request<Vehicle>(`/api/v1/vehicles/plate/${encodeURIComponent(plateNumber)}`);
  }

  // Items
  async getItems(): Promise<ItemMaster[]> {
    return this.request<ItemMaster[]>('/api/v1/items');
  }

  async createItem(input: {
    skuCode: string;
    name: string;
    unit: string;
    unitVolumeM3: number;
    unitWeightKg: number;
  }): Promise<ItemMaster> {
    return this.request<ItemMaster>('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Gate Operations
  async getGateTransactions(status?: string): Promise<GateTransaction[]> {
    const query = status ? `?status=${status}` : '';
    const res = await this.request<GateTransaction[]>(`/api/v1/gate/transactions${query}`);
    return Array.isArray(res) ? res.map(normalizeGateTransaction) : [];
  }

  async getGateTransactionDetail(id: string): Promise<GateTransaction> {
    const res = await this.request<GateTransaction>(`/api/v1/gate/transactions/${id}`);
    return normalizeGateTransaction(res);
  }

  async processGateIn(input: {
    vehicleId: string;
    warehouseId: string;
    driverName: string;
    driverLicenseNo: string;
    direction: 'INBOUND' | 'OUTBOUND';
    container?: {
      containerNumber: string;
      size: '20FT' | '40FT' | '40HC';
      sealNumber: string;
      isEmpty: boolean;
    };
  }): Promise<GateTransaction> {
    const res = await this.request<GateTransaction>('/api/v1/gate/in', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return normalizeGateTransaction(res);
  }

  async assignDock(transactionId: string, dockId: string): Promise<GateTransaction> {
    const res = await this.request<GateTransaction>(`/api/v1/gate/transactions/${transactionId}/assign-dock`, {
      method: 'POST',
      body: JSON.stringify({ dockId }),
    });
    return normalizeGateTransaction(res);
  }

  async processGateOut(transactionId: string, notes?: string): Promise<GateTransaction> {
    const res = await this.request<GateTransaction>(`/api/v1/gate/transactions/${transactionId}/gate-out`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return normalizeGateTransaction(res);
  }

  // Cargo & Inventory
  async getTransactionCargoItems(transactionId: string): Promise<TransactionCargoItem[]> {
    const res = await this.request<any>(
      `/api/v1/gate/transactions/${transactionId}/cargo-items`,
    );
    return Array.isArray(res) ? res : res?.items || [];
  }

  async recordCargoItems(
    transactionId: string,
    items: Array<{ itemId: string; quantity: number; weightKg?: number; conditionNotes?: string }>,
  ): Promise<TransactionCargoItem[]> {
    const res = await this.request<any>(
      `/api/v1/gate/transactions/${transactionId}/cargo-items`,
      {
        method: 'PUT',
        body: JSON.stringify({ items }),
      },
    );
    return Array.isArray(res) ? res : res?.items || [];
  }

  async finalizeInbound(transactionId: string): Promise<GateTransaction> {
    const res = await this.request<GateTransaction>(
      `/api/v1/gate/transactions/${transactionId}/finalize-inbound`,
      {
        method: 'POST',
      },
    );
    return normalizeGateTransaction(res);
  }

  async finalizeOutbound(transactionId: string): Promise<GateTransaction> {
    const res = await this.request<GateTransaction>(
      `/api/v1/gate/transactions/${transactionId}/finalize-outbound`,
      {
        method: 'POST',
      },
    );
    return normalizeGateTransaction(res);
  }

  async getWarehouseInventory(warehouseId: string): Promise<WarehouseInventoryReport> {
    const res = await this.request<any>(`/api/v1/warehouses/${warehouseId}/inventory`);
    if (res && res.utilization) {
      if (res.utilization.utilizationPercentage === undefined && res.utilization.utilizationPercent !== undefined) {
        res.utilization.utilizationPercentage = res.utilization.utilizationPercent;
      }
    }
    if (res && Array.isArray(res.stocks)) {
      res.stocks = res.stocks.map((s: any) => ({
        ...s,
        name: s.name || s.itemName || '',
      }));
    }
    return res as WarehouseInventoryReport;
  }

  // Documents
  async getDocuments(): Promise<OfficialDocument[]> {
    return this.request<OfficialDocument[]>('/api/v1/documents');
  }

  async generateTransactionDocument(
    transactionId: string,
    docType: 'GATE_PASS' | 'BASTB' | 'SURAT_JALAN',
  ): Promise<OfficialDocument> {
    return this.request<OfficialDocument>(
      `/api/v1/gate/transactions/${transactionId}/documents`,
      {
        method: 'POST',
        body: JSON.stringify({ docType }),
      },
    );
  }

  async generateDailyRecap(warehouseId: string, reportDate: string): Promise<OfficialDocument> {
    return this.request<OfficialDocument>('/api/v1/documents/daily-recap', {
      method: 'POST',
      body: JSON.stringify({ warehouseId, reportDate }),
    });
  }

  async voidDocument(documentId: string, voidReason: string): Promise<OfficialDocument> {
    return this.request<OfficialDocument>(`/api/v1/documents/${documentId}/void`, {
      method: 'POST',
      body: JSON.stringify({ voidReason }),
    });
  }

  getDocumentPdfUrl(documentId: string): string {
    const token = this.getAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${API_BASE_URL}/api/v1/documents/${documentId}/pdf${query}`;
  }
}

export const api = new ApiClient();
