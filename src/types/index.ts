export type UserRole = 'superadmin' | 'branch_manager';

export type ActiveTab =
  | 'dashboard'
  | 'bo'
  | 'sdm'
  | 'relasi'
  | 'produk'
  | 'produk_harga'
  | 'target_list'
  | 'target'
  | 'sql_migration';

export interface UserProfile {
  id: string;
  nama: string;
  email: string;
  role: UserRole;
  assigned_bo_id?: string;
  assigned_bo_nama?: string;
  avatar_url?: string;
}

export interface MasterBO {
  id: string;
  kode_bo: string;
  nama_bo: string;
  zona_id: number; // 1 s.d. 13
  wilayah: string;
  alamat: string;
  created_at?: string;
}

export type JabatanSDM = 'BM' | 'WBM' | 'BA' | 'WH' | 'Pimpas' | 'Korpos' | 'Sales';

export interface MasterSDM {
  id: string;
  bo_id: string;
  nama: string;
  jabatan: JabatanSDM;
  no_hp: string;
  wilayah_kerja: string;
  is_placeholder: boolean;
  kode_placeholder?: string; // e.g. "SRBaru01", "SRDSTB01"
  status_aktif: boolean;
  created_at?: string;
}

export type JenisRelasi = 'Sekolah' | 'K3S' | 'IGTKI' | 'MKKS' | 'Dinas Pendidikan' | 'Yayasan Pendidikan';

export type JenjangPendidikan = 'PAUD/TK' | 'SD/MI' | 'SMP/MTs' | 'SMA/MA' | 'SMK' | 'Umum';

export interface MasterRelasi {
  id: string;
  bo_id: string;
  kode_relasi: string;
  nama_relasi: string;
  jenis_relasi: JenisRelasi;
  jenjang: JenjangPendidikan;
  alamat: string;
  kontak_person: string;
  no_kontak: string;
  default_rabat_persen: number; // e.g. 20%
  created_at?: string;
}

export interface MasterProduk {
  id: string;
  kode_sku: string;
  judul_buku: string;
  jenjang: JenjangPendidikan;
  mata_pelajaran: string;
  kurikulum: string;
  penulis: string;
  halaman: number;
  default_hpp_persen: number; // e.g. 35%
  created_at?: string;
}

export interface MasterProdukHarga {
  id: string;
  produk_id: string;
  tahun_anggaran: number; // 2026, 2027, dst.
  zona_id: number; // 1 s.d. 13
  harga_satuan: number;
}

export interface TargetPenjualanDetail {
  id: string;
  bo_id: string;
  sdm_id: string;
  relasi_id: string;
  produk_id: string;
  tahun_anggaran: number;
  zona_id: number;
  harga_satuan: number;
  qty: number;
  persen_keyakinan: number; // e.g. 80% (Confidence Level)
  persen_rabat: number; // e.g. 20%
  persen_bsr: number; // e.g. 5% (Biaya Sarana Relasi)
  persen_hpp: number; // e.g. 35%
  // Computed values
  nilai_brutto: number;
  nilai_rabat: number;
  nilai_bsr: number;
  nilai_netto: number;
  nilai_hpp: number;
  laba_kotor: number;
  nilai_tertimbang_brutto: number; // Brutto * (Keyakinan / 100)
  catatan?: string;
  created_at?: string;
  // Joined fields for tables and detail views
  bo_nama?: string;
  bo_kode?: string;
  sdm_nama?: string;
  relasi_nama?: string;
  relasi_kode?: string;
  produk_judul?: string;
  produk_sku?: string;
}

export interface CalculationResult {
  nilaiBrutto: number;
  nilaiRabat: number;
  nilaiBsr: number;
  nilaiNetto: number;
  nilaiHpp: number;
  labaKotor: number;
  nilaiTertimbang: number;
  marginPersen: number;
}

export interface AppUser {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
  bo_id?: string | null;
  bo_nama?: string;
  status_aktif: boolean;
  created_at?: string;
  updated_at?: string;
}

export type AppNavKey =
  | 'dashboard_overview'
  | 'master_bo'
  | 'master_sdm'
  | 'master_relasi'
  | 'master_produk'
  | 'master_harga'
  | 'target_operasional'
  | 'manajemen_user';

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  boIdFilter?: string;
  sortBy?: string;
  sortAsc?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type ImportMode = 'insert' | 'upsert';

export type ImportTableType =
  | 'master_bo'
  | 'master_sdm'
  | 'master_relasi'
  | 'master_produk'
  | 'master_harga'
  | 'target_detail';

export interface ImportRowError {
  rowNumber: number;
  identifier: string;
  reason: string;
  dataSnippet?: Record<string, any>;
}

export interface ImportJobReport {
  tableName: ImportTableType;
  totalRows: number;
  successCount: number;
  failedCount: number;
  durationMs: number;
  errors: ImportRowError[];
  timestamp?: string;
}

