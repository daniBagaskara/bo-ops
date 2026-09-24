-- ==============================================================================
-- SKRIP MIGRASI SUPABASE: TABEL PENGGUNA & AUTENTIKASI (app_users)
-- ==============================================================================

-- 1. Buat Tabel Pengguna Sistem
CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nama VARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('superadmin', 'branch_manager')),
    bo_id UUID REFERENCES public.master_bo(id) ON DELETE SET NULL,
    status_aktif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_role ON public.app_users(role);

-- 3. Row Level Security (RLS)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon and auth read app_users" ON public.app_users;
CREATE POLICY "Allow anon and auth read app_users"
ON public.app_users FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon and auth insert app_users" ON public.app_users;
CREATE POLICY "Allow anon and auth insert app_users"
ON public.app_users FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon and auth update app_users" ON public.app_users;
CREATE POLICY "Allow anon and auth update app_users"
ON public.app_users FOR UPDATE
TO anon, authenticated
USING (true);

-- 4. Seed Data Awal Pengguna (Superadmin & Branch Manager)
-- Password default:
-- Superadmin: admin123
-- Branch Manager: bm123
INSERT INTO public.app_users (email, password, nama, role, bo_id) VALUES
('superadmin@edubranch.id', 'admin123', 'Superadmin Pusat', 'superadmin', NULL),
('bm.surabaya@edubranch.id', 'bm123', 'Ahmad Fauzi, S.Pd.', 'branch_manager', 'b0000000-0000-0000-0000-000000000001')
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password, 
    nama = EXCLUDED.nama, 
    role = EXCLUDED.role;
