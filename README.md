# Warehouse Operations Frontend (WMS & Gate Management)

Aplikasi Frontend Operasional Kawasan Pergudangan modern berbasis **React 18 + TypeScript + Vite + Tailwind CSS**.

Didesain sesuai standar industri logistik pergudangan untuk mengelola lalu lintas truk (Gate-In / Gate-Out), alokasi loading dock, inventaris barang gudang, dan penerbitan dokumen resmi (BASTB, Surat Jalan, Rekap Harian PDF).

---

## 🚀 Fitur Utama

1. **Dashboard Operasional Real-time:**
   - Indikator kapasitas gudang aktif (Volume m³ & Persentase okupansi).
   - Ringkasan KPI: Kendaraan aktif di yard, antrean gate, pemakaian loading dock.
   - Health status badge server backend (`/health`) terintegrasi langsung.
   - Pemantau transaksi kendaraan aktif di area logistik.

2. **Gate In & Out Management:**
   - Registrasi Gate-In dengan form validasi terstandarisasi ISO 6346 (Kategori `CONTAINER` wajib nomor kontainer 4 huruf + 7 digit, ukuran 20FT/40FT/40HC, nomor segel).
   - Penanganan kategori `CARGO` (Mobil Box / Truk Bak) tanpa kontainer.
   - Assign / alokasi Loading Dock.
   - Validasi Gate-Out (kendaraan hanya diizinkan keluar jika dokumen resmi telah berstatus `ISSUED`).

3. **Visual Loading Dock Matrix:**
   - Kanban board status dock (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`).
   - Switch status operasional dock (Siap Pakai vs Perbaikan/Maintenance).
   - Pendaftaran dok muat baru per gudang.

4. **Inventory & Cargo Ledger:**
   - Pencatatan muatan kargo multi-item (SKU, nama barang, kuantitas, estimasi berat, catatan kondisi).
   - Finalisasi bongkar muat Inbound (menambah stok gudang) dan Outbound (mengurangi stok gudang dengan pengecekan ketersediaan).
   - Integrasi langsung sebagai prasyarat penerbitan dokumen logistik.

5. **Dokumen Resmi & PDF Center:**
   - Penerbitan Berita Acara Serah Terima Barang (**BASTB**) untuk Inbound.
   - Penerbitan Surat Jalan (**SURAT_JALAN**) untuk Outbound.
   - Generator Rekap Harian Operasional Gudang.
   - Unduh langsung dokumen resmi berformat PDF berstandar LaTeX.
   - Mekanisme **Void Dokumen** dengan alasan pembatalan wajib untuk audit trail.

6. **Master Data:**
   - Manajemen Kendaraan & Kategori Transport.
   - Manajemen Master Barang (SKU, Unit, Berat kg, Volume m³).
   - Manajemen Data Gudang & Kapasitas.

---

## 🛠️ Cara Menjalankan

### 1. Menjalankan Server Backend
Pastikan backend di folder `warehouse-back` telah berjalan:
```bash
cd /home/muhammadawan46/warehouse-back
npm run dev
# Backend berjalan di http://127.0.0.1:3000
```

### 2. Menjalankan Frontend
Masuk ke direktori `warehouse-front` dan jalankan:
```bash
cd /home/muhammadawan46/warehouse-front
npm run dev
```
Buka browser di alamat yang ditampilkan oleh Vite (biasanya `http://localhost:5173`).

### 3. Akun Pengguna Cepat (Demo / Role)
Tersedia tombol *Quick Fill* pada halaman login:
- **Admin**: `admin_utama` / `PasswordAdmin123!`
- **Operator Gate**: `operator_gate` / `PasswordGate123!`
- **Supervisor Gudang**: `supervisor_gudang` / `PasswordSpv123!`

---

## 📂 Struktur Proyek
```text
warehouse-front/
├── dist/                      # Hasil build production
├── src/
│   ├── components/
│   │   ├── common/            # Badge status, Toast notification
│   │   └── layout/            # AppLayout, Sidebar, Topbar, Warehouse selector
│   ├── context/               # AuthContext (JWT token, user profile, role permissions)
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── DashboardOverviewPage.tsx
│   │   ├── GateOperationsPage.tsx
│   │   ├── DockManagementPage.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── DocumentsPage.tsx
│   │   └── MasterDataPage.tsx
│   ├── services/
│   │   └── api.ts             # Centralized typed HTTP API Client
│   ├── types/
│   │   └── api.ts             # TypeScript definitions matching backend
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
