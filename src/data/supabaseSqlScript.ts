export const SUPABASE_SQL_MIGRATION = `-- ==============================================================================
-- SKRIP MIGRASI SUPABASE POSTGRESQL LENGKAP
-- Sistem: BO-OPS - Pengelolaan Target & Alokasi Biaya Branch Office Edukasi
-- Fitur: Multi-Zona (Zona 1-13), Multi-Tahun, Gatekeeper Rule Trigger, Formula Otomatis (STORED),
--        Sales Placeholder, serta Row Level Security (RLS) untuk Superadmin & Branch Manager
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABEL: MASTER_BO (Branch Office se-Indonesia)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.master_bo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_bo VARCHAR(20) NOT NULL UNIQUE,
    nama_bo VARCHAR(150) NOT NULL,
    zona_id INT NOT NULL CHECK (zona_id BETWEEN 1 AND 13),
    wilayah VARCHAR(100) NOT NULL,
    alamat TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.master_bo IS 'Master data kantor cabang (BO) penerbitan edukasi di seluruh Indonesia.';
COMMENT ON COLUMN public.master_bo.zona_id IS 'Zona harga logistik buku nasional (Zona 1 s.d. Zona 13).';

-- ==============================================================================
-- 3. TABEL: MASTER_SDM (Karyawan BO & Sales Placeholder)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.master_sdm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bo_id UUID NOT NULL REFERENCES public.master_bo(id) ON DELETE CASCADE,
    nama VARCHAR(150) NOT NULL,
    jabatan VARCHAR(50) NOT NULL CHECK (jabatan IN ('BM', 'WBM', 'BA', 'WH', 'Pimpas', 'Korpos', 'Sales')),
    no_hp VARCHAR(30) DEFAULT '-',
    wilayah_kerja VARCHAR(150) NOT NULL,
    is_placeholder BOOLEAN NOT NULL DEFAULT false,
    kode_placeholder VARCHAR(50), -- e.g., 'SRBaru01', 'SRDSTB01'
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_sdm_bo_id ON public.master_sdm(bo_id);
CREATE INDEX IF NOT EXISTS idx_master_sdm_jabatan ON public.master_sdm(jabatan);
CREATE INDEX IF NOT EXISTS idx_master_sdm_placeholder ON public.master_sdm(is_placeholder);

COMMENT ON TABLE public.master_sdm IS 'Master data SDM cabang dan sales placeholder untuk proyeksi rekrutmen.';

-- ==============================================================================
-- 4. TABEL: MASTER_RELASI (Sekolah / K3S / IGTKI / MKKS / Dinas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.master_relasi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bo_id UUID NOT NULL REFERENCES public.master_bo(id) ON DELETE CASCADE,
    kode_relasi VARCHAR(50) NOT NULL,
    nama_relasi VARCHAR(200) NOT NULL,
    jenis_relasi VARCHAR(50) NOT NULL CHECK (jenis_relasi IN ('Sekolah', 'K3S', 'IGTKI', 'MKKS', 'Dinas Pendidikan', 'Yayasan Pendidikan')),
    jenjang VARCHAR(20) NOT NULL CHECK (jenjang IN ('PAUD/TK', 'SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'Umum')),
    alamat TEXT,
    kontak_person VARCHAR(150),
    no_kontak VARCHAR(30),
    default_rabat_persen NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (default_rabat_persen >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_bo_relasi_kode UNIQUE (bo_id, kode_relasi)
);

CREATE INDEX IF NOT EXISTS idx_master_relasi_bo_id ON public.master_relasi(bo_id);
CREATE INDEX IF NOT EXISTS idx_master_relasi_jenis ON public.master_relasi(jenis_relasi);

COMMENT ON TABLE public.master_relasi IS 'Institusi mitra relasi pendidikan per BO.';

-- ==============================================================================
-- 5. TABEL: MASTER_PRODUK (Metadata Buku Kurikulum Merdeka / Edukasi)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.master_produk (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_sku VARCHAR(50) NOT NULL UNIQUE,
    judul_buku VARCHAR(250) NOT NULL,
    jenjang VARCHAR(20) NOT NULL CHECK (jenjang IN ('PAUD/TK', 'SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'Umum')),
    mata_pelajaran VARCHAR(100) NOT NULL,
    kurikulum VARCHAR(100) NOT NULL DEFAULT 'Kurikulum Merdeka',
    penulis VARCHAR(150),
    halaman INT DEFAULT 160,
    default_hpp_persen NUMERIC(5,2) NOT NULL DEFAULT 35.00 CHECK (default_hpp_persen >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_produk_sku ON public.master_produk(kode_sku);
CREATE INDEX IF NOT EXISTS idx_master_produk_jenjang ON public.master_produk(jenjang);

-- ==============================================================================
-- 6. TABEL: MASTER_PRODUK_HARGA (Matriks Harga Multi-Tahun & Multi-Zona 1-13)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.master_produk_harga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produk_id UUID NOT NULL REFERENCES public.master_produk(id) ON DELETE CASCADE,
    tahun_anggaran INT NOT NULL,
    zona_id INT NOT NULL CHECK (zona_id BETWEEN 1 AND 13),
    harga_satuan NUMERIC(14,2) NOT NULL CHECK (harga_satuan >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_produk_tahun_zona UNIQUE (produk_id, tahun_anggaran, zona_id)
);

CREATE INDEX IF NOT EXISTS idx_harga_produk_tahun_zona ON public.master_produk_harga(produk_id, tahun_anggaran, zona_id);

COMMENT ON TABLE public.master_produk_harga IS 'Matriks tarif harga buku berdasarkan Tahun Anggaran dan Zona 1-13.';

-- ==============================================================================
-- 7. TABEL: TARGET_PENJUALAN_DETAIL (Hierarki Target & Formula Otomatis)
-- Hierarki: Sales -> Relasi -> Produk (SKU) -> Qty & % Keyakinan
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.target_penjualan_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bo_id UUID NOT NULL REFERENCES public.master_bo(id) ON DELETE CASCADE,
    sdm_id UUID NOT NULL REFERENCES public.master_sdm(id) ON DELETE RESTRICT,
    relasi_id UUID NOT NULL REFERENCES public.master_relasi(id) ON DELETE RESTRICT,
    produk_id UUID NOT NULL REFERENCES public.master_produk(id) ON DELETE RESTRICT,
    tahun_anggaran INT NOT NULL,
    zona_id INT NOT NULL CHECK (zona_id BETWEEN 1 AND 13),
    harga_satuan NUMERIC(14,2) NOT NULL CHECK (harga_satuan >= 0),
    qty INT NOT NULL CHECK (qty >= 0),
    persen_keyakinan NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (persen_keyakinan BETWEEN 0 AND 100),
    persen_rabat NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (persen_rabat >= 0),
    persen_bsr NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (persen_bsr >= 0),
    persen_hpp NUMERIC(5,2) NOT NULL DEFAULT 35.00 CHECK (persen_hpp >= 0),

    -- FORMULA PERHITUNGAN OTOMATIS (REAL-TIME COMPUTED & STORED):
    -- 1. Nilai Brutto = Qty * Harga Satuan (Sesuai Zona BO)
    nilai_brutto NUMERIC(16,2) GENERATED ALWAYS AS (
        ROUND((qty::numeric * harga_satuan), 2)
    ) STORED,

    -- 2. Rabat ke Relasi (Nominal) = Nilai Brutto * % Rabat
    nilai_rabat NUMERIC(16,2) GENERATED ALWAYS AS (
        ROUND(((qty::numeric * harga_satuan) * (persen_rabat / 100.0)), 2)
    ) STORED,

    -- 3. BSR (Nominal) = Nilai Brutto * % BSR
    nilai_bsr NUMERIC(16,2) GENERATED ALWAYS AS (
        ROUND(((qty::numeric * harga_satuan) * (persen_bsr / 100.0)), 2)
    ) STORED,

    -- 4. Nilai Netto = Nilai Brutto - Rabat ke Relasi - BSR
    nilai_netto NUMERIC(16,2) GENERATED ALWAYS AS (
        ROUND(
            (qty::numeric * harga_satuan)
            - ((qty::numeric * harga_satuan) * (persen_rabat / 100.0))
            - ((qty::numeric * harga_satuan) * (persen_bsr / 100.0))
        , 2)
    ) STORED,

    -- 5. HPP (Nominal) = Nilai Brutto * % HPP
    nilai_hpp NUMERIC(16,2) GENERATED ALWAYS AS (
        ROUND(((qty::numeric * harga_satuan) * (persen_hpp / 100.0)), 2)
    ) STORED,

    -- 6. Laba Kotor = Nilai Netto - HPP (atau Nilai Brutto - HPP - Rabat - BSR)
    laba_kotor NUMERIC(16,2) GENERATED ALWAYS AS (
        ROUND(
            ((qty::numeric * harga_satuan)
             - ((qty::numeric * harga_satuan) * (persen_rabat / 100.0))
             - ((qty::numeric * harga_satuan) * (persen_bsr / 100.0)))
            - ((qty::numeric * harga_satuan) * (persen_hpp / 100.0))
        , 2)
    ) STORED,

    -- 7. Nilai Tertimbang Brutto = Nilai Brutto * (% Keyakinan / 100)
    nilai_tertimbang_brutto NUMERIC(16,2) GENERATED ALWAYS AS (
        ROUND(((qty::numeric * harga_satuan) * (persen_keyakinan / 100.0)), 2)
    ) STORED,

    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_target_bo_tahun ON public.target_penjualan_detail(bo_id, tahun_anggaran);
CREATE INDEX IF NOT EXISTS idx_target_sdm_relasi ON public.target_penjualan_detail(sdm_id, relasi_id);
CREATE INDEX IF NOT EXISTS idx_target_produk ON public.target_penjualan_detail(produk_id);

-- ==============================================================================
-- 8. GATEKEEPER RULE TRIGGER (Aturan Alur Bertahap)
-- Aturan: BM TIDAK BISA menginput target sebelum mendaftarkan SDM / Karyawan BO.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_enforce_gatekeeper_sdm_target()
RETURNS TRIGGER AS $$
DECLARE
    sdm_count INT;
BEGIN
    -- Hitung jumlah SDM yang sudah terdaftar di BO bersangkutan
    SELECT COUNT(*) INTO sdm_count
    FROM public.master_sdm
    WHERE bo_id = NEW.bo_id AND status_aktif = true;

    IF sdm_count = 0 THEN
        RAISE EXCEPTION 'GATEKEEPER_VIOLATION: Branch Manager belum dapat menginput data target sebelum mendaftarkan data SDM / Karyawan BO mereka (Jumlah SDM aktif = 0).';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gatekeeper_target_insert ON public.target_penjualan_detail;
CREATE TRIGGER trg_gatekeeper_target_insert
BEFORE INSERT OR UPDATE ON public.target_penjualan_detail
FOR EACH ROW
EXECUTE FUNCTION public.fn_enforce_gatekeeper_sdm_target();

-- ==============================================================================
-- 9. HELPER FUNCTIONS UNTUK ROW LEVEL SECURITY (RLS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
BEGIN
    -- Membaca role dari JWT metadata pengguna auth Supabase
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role',
        current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'role',
        'branch_manager'
    );
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.current_user_bo_id()
RETURNS UUID AS $$
BEGIN
    -- Membaca assigned bo_id dari JWT metadata pengguna
    RETURN (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'bo_id')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 10. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ==============================================================================
ALTER TABLE public.master_bo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_sdm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_relasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_produk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_produk_harga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_penjualan_detail ENABLE ROW LEVEL SECURITY;

-- Policy MASTER_BO:
-- Superadmin akses seluruh BO. BM hanya bisa melihat BO yang ditugaskan.
CREATE POLICY "Superadmin full access master_bo"
ON public.master_bo
FOR ALL
TO authenticated
USING (public.current_user_role() = 'superadmin');

CREATE POLICY "BM view assigned master_bo"
ON public.master_bo
FOR SELECT
TO authenticated
USING (id = public.current_user_bo_id());

-- Policy MASTER_SDM:
CREATE POLICY "Superadmin full access master_sdm"
ON public.master_sdm
FOR ALL
TO authenticated
USING (public.current_user_role() = 'superadmin');

CREATE POLICY "BM manage assigned master_sdm"
ON public.master_sdm
FOR ALL
TO authenticated
USING (bo_id = public.current_user_bo_id())
WITH CHECK (bo_id = public.current_user_bo_id());

-- Policy MASTER_RELASI:
CREATE POLICY "Superadmin full access master_relasi"
ON public.master_relasi
FOR ALL
TO authenticated
USING (public.current_user_role() = 'superadmin');

CREATE POLICY "BM manage assigned master_relasi"
ON public.master_relasi
FOR ALL
TO authenticated
USING (bo_id = public.current_user_bo_id())
WITH CHECK (bo_id = public.current_user_bo_id());

-- Policy MASTER_PRODUK & MASTER_PRODUK_HARGA:
-- Semua user terautentikasi dapat membaca produk & harga.
CREATE POLICY "Authenticated users view master_produk"
ON public.master_produk FOR SELECT TO authenticated USING (true);

CREATE POLICY "Superadmin modify master_produk"
ON public.master_produk FOR ALL TO authenticated
USING (public.current_user_role() = 'superadmin');

CREATE POLICY "Authenticated users view master_produk_harga"
ON public.master_produk_harga FOR SELECT TO authenticated USING (true);

CREATE POLICY "Superadmin modify master_produk_harga"
ON public.master_produk_harga FOR ALL TO authenticated
USING (public.current_user_role() = 'superadmin');

-- Policy TARGET_PENJUALAN_DETAIL:
CREATE POLICY "Superadmin full access target_penjualan_detail"
ON public.target_penjualan_detail
FOR ALL
TO authenticated
USING (public.current_user_role() = 'superadmin');

CREATE POLICY "BM manage assigned target_penjualan_detail"
ON public.target_penjualan_detail
FOR ALL
TO authenticated
USING (bo_id = public.current_user_bo_id())
WITH CHECK (bo_id = public.current_user_bo_id());

-- ==============================================================================
-- 11. DATA AWAL (SEED SAMPLE DATA)
-- ==============================================================================
INSERT INTO public.master_bo (id, kode_bo, nama_bo, zona_id, wilayah, alamat) VALUES
('b0000000-0000-0000-0000-000000000001', 'BO-SBY', 'Branch Office Surabaya', 2, 'Jawa Timur', 'Jl. Rungkut Industri No. 45, Surabaya'),
('b0000000-0000-0000-0000-000000000002', 'BO-MDN', 'Branch Office Medan', 4, 'Sumatera Utara', 'Jl. Gatot Subroto KM 6.5, Medan'),
('b0000000-0000-0000-0000-000000000003', 'BO-MKS', 'Branch Office Makassar', 8, 'Sulawesi Selatan', 'Jl. Urip Sumoharjo No. 120, Makassar'),
('b0000000-0000-0000-0000-000000000004', 'BO-BDG', 'Branch Office Bandung', 1, 'Jawa Barat', 'Jl. Soekarno Hatta No. 518, Bandung'),
('b0000000-0000-0000-0000-000000000005', 'BO-JPR', 'Branch Office Jayapura', 13, 'Papua', 'Jl. Raya Abepura No. 88, Jayapura')
ON CONFLICT (kode_bo) DO NOTHING;

-- Seed SDM Surabaya termasuk Sales Placeholder
INSERT INTO public.master_sdm (id, bo_id, nama, jabatan, no_hp, wilayah_kerja, is_placeholder, kode_placeholder) VALUES
('s0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ahmad Fauzi, S.Pd.', 'BM', '0812-3456-7890', 'Seluruh Wilayah BO Surabaya', false, NULL),
('s0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Bambang Triatmojo', 'Sales', '0812-9988-7711', 'Surabaya Selatan & Rungkut', false, NULL),
('s0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Tri Wahyuni', 'Sales', '0857-1122-3344', 'Surabaya Pusat & Wonokromo', false, NULL),
('s0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'SRBaru01 (Sales Rekrutmen Baru)', 'Sales', '-', 'Surabaya Barat & Gresik', true, 'SRBaru01'),
('s0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'SRDSTB01 (Sales Distributor Eksklusif)', 'Sales', '-', 'Sidoarjo & Mojokerto', true, 'SRDSTB01')
ON CONFLICT DO NOTHING;
`;
