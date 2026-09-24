-- ==============================================================================
-- SKRIP PERBAIKAN AKSES SUPABASE UNTUK VERCEL DEPLOYMENT
-- Jalankan skrip ini sekali di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Berikan hak akses penuh ke role anon dan authenticated pada skema public
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Atur default privilege untuk tabel/sequence baru di masa mendatang
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 3. Nonaktifkan Row Level Security (RLS) agar frontend Vite/Vercel dapat
--    langsung melakukan operasi CRUD tanpa terblokir izin token:
ALTER TABLE IF EXISTS public.master_bo DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_sdm DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_relasi DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_produk DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.master_produk_harga DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.target_penjualan_detail DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_users DISABLE ROW LEVEL SECURITY;

-- 4. Seed Master BO & SDM jika belum ada data
INSERT INTO public.master_bo (id, kode_bo, nama_bo, zona_id, wilayah, alamat) VALUES
('b0000000-0000-0000-0000-000000000001', 'BO-SBY', 'Branch Office Surabaya', 2, 'Jawa Timur', 'Jl. Rungkut Industri No. 45, Surabaya'),
('b0000000-0000-0000-0000-000000000002', 'BO-MDN', 'Branch Office Medan', 4, 'Sumatera Utara', 'Jl. Gatot Subroto KM 6.5, Medan'),
('b0000000-0000-0000-0000-000000000003', 'BO-MKS', 'Branch Office Makassar', 8, 'Sulawesi Selatan', 'Jl. Urip Sumoharjo No. 120, Makassar'),
('b0000000-0000-0000-0000-000000000004', 'BO-BDG', 'Branch Office Bandung', 1, 'Jawa Barat', 'Jl. Soekarno Hatta No. 518, Bandung'),
('b0000000-0000-0000-0000-000000000005', 'BO-JPR', 'Branch Office Jayapura', 13, 'Papua', 'Jl. Raya Abepura No. 88, Jayapura')
ON CONFLICT (kode_bo) DO NOTHING;

INSERT INTO public.master_sdm (id, bo_id, nama, jabatan, no_hp, wilayah_kerja, is_placeholder, kode_placeholder, status_aktif) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Ahmad Fauzi, S.Pd.', 'BM', '0812-3456-7890', 'Seluruh Wilayah BO Surabaya', false, NULL, true),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Bambang Triatmojo', 'Sales', '0812-9988-7711', 'Surabaya Selatan & Rungkut', false, NULL, true),
('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Tri Wahyuni', 'Sales', '0857-1122-3344', 'Surabaya Pusat & Wonokromo', false, NULL, true),
('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'SRBaru01 (Sales Rekrutmen Baru)', 'Sales', '-', 'Surabaya Barat & Gresik', true, 'SRBaru01', true),
('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'SRDSTB01 (Sales Distributor Eksklusif)', 'Sales', '-', 'Sidoarjo & Mojokerto', true, 'SRDSTB01', true)
ON CONFLICT (id) DO NOTHING;
