-- ==============================================================================
-- SKRIP OPTIMASI PERFORMA & INDEXING SUPABASE UNTUK HINGGA 600.000 BARIS
-- ==============================================================================
-- Menambahkan indeks performa tinggi pada semua foreign key, kolom filter,
-- kolom pencarian teks, dan unique constraint untuk transaksi batch upsert cepat.

-- 1. INDEX TABEL MASTER_BO
CREATE INDEX IF NOT EXISTS idx_master_bo_kode ON public.master_bo (kode_bo);
CREATE INDEX IF NOT EXISTS idx_master_bo_zona ON public.master_bo (zona_id);
CREATE INDEX IF NOT EXISTS idx_master_bo_nama ON public.master_bo USING btree (nama_bo);

-- 2. INDEX TABEL MASTER_SDM
CREATE INDEX IF NOT EXISTS idx_master_sdm_bo_id ON public.master_sdm (bo_id);
CREATE INDEX IF NOT EXISTS idx_master_sdm_jabatan ON public.master_sdm (jabatan);
CREATE INDEX IF NOT EXISTS idx_master_sdm_status ON public.master_sdm (status_aktif);
CREATE INDEX IF NOT EXISTS idx_master_sdm_placeholder ON public.master_sdm (is_placeholder);
CREATE INDEX IF NOT EXISTS idx_master_sdm_nama ON public.master_sdm USING btree (nama);

-- 3. INDEX TABEL MASTER_RELASI
CREATE INDEX IF NOT EXISTS idx_master_relasi_bo_id ON public.master_relasi (bo_id);
CREATE INDEX IF NOT EXISTS idx_master_relasi_kode ON public.master_relasi (kode_relasi);
CREATE INDEX IF NOT EXISTS idx_master_relasi_jenis ON public.master_relasi (jenis_relasi);
CREATE INDEX IF NOT EXISTS idx_master_relasi_jenjang ON public.master_relasi (jenjang);
CREATE INDEX IF NOT EXISTS idx_master_relasi_nama ON public.master_relasi USING btree (nama_relasi);

-- 4. INDEX TABEL MASTER_PRODUK
CREATE INDEX IF NOT EXISTS idx_master_produk_sku ON public.master_produk (kode_sku);
CREATE INDEX IF NOT EXISTS idx_master_produk_jenjang ON public.master_produk (jenjang);
CREATE INDEX IF NOT EXISTS idx_master_produk_mapel ON public.master_produk (mata_pelajaran);
CREATE INDEX IF NOT EXISTS idx_master_produk_kurikulum ON public.master_produk (kurikulum);
CREATE INDEX IF NOT EXISTS idx_master_produk_judul ON public.master_produk USING btree (judul_buku);

-- 5. INDEX TABEL MASTER_PRODUK_HARGA
CREATE INDEX IF NOT EXISTS idx_master_harga_produk ON public.master_produk_harga (produk_id);
CREATE INDEX IF NOT EXISTS idx_master_harga_tahun ON public.master_produk_harga (tahun_anggaran);
CREATE INDEX IF NOT EXISTS idx_master_harga_zona ON public.master_produk_harga (zona_id);
-- Compound index unik untuk percepatan lookup tarif harga & upsert matriks
CREATE UNIQUE INDEX IF NOT EXISTS idx_master_harga_unique_lookup 
ON public.master_produk_harga (produk_id, tahun_anggaran, zona_id);

-- 6. INDEX TABEL TARGET_PENJUALAN_DETAIL (Skala 600.000+ baris)
CREATE INDEX IF NOT EXISTS idx_target_detail_bo_id ON public.target_penjualan_detail (bo_id);
CREATE INDEX IF NOT EXISTS idx_target_detail_sdm_id ON public.target_penjualan_detail (sdm_id);
CREATE INDEX IF NOT EXISTS idx_target_detail_relasi_id ON public.target_penjualan_detail (relasi_id);
CREATE INDEX IF NOT EXISTS idx_target_detail_produk_id ON public.target_penjualan_detail (produk_id);
CREATE INDEX IF NOT EXISTS idx_target_detail_tahun ON public.target_penjualan_detail (tahun_anggaran);
CREATE INDEX IF NOT EXISTS idx_target_detail_created ON public.target_penjualan_detail (created_at DESC);
-- Compound index untuk agregasi filtering per Cabang (BO) dan Tahun Anggaran
CREATE INDEX IF NOT EXISTS idx_target_detail_bo_tahun 
ON public.target_penjualan_detail (bo_id, tahun_anggaran);

-- 7. INDEX TABEL APP_USERS
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users (email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users (role);
CREATE INDEX IF NOT EXISTS idx_app_users_bo_id ON public.app_users (bo_id);
CREATE INDEX IF NOT EXISTS idx_app_users_status ON public.app_users (status_aktif);
