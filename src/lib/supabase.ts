import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 1. Ambil kredensial dari Environment Variables Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxwxotsstnnfmaivybbq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NJ0fnoSz-aRqI1wG6h9Jag_V2cxGBNu';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Config Warning] Variabel lingkungan VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum terpasang dengan lengkap.'
  );
}

// 2. Inisialisasi Supabase Client Singleton
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-application-name': 'bo-ops-edubranch',
    },
  },
});

export const getSupabaseClient = (): SupabaseClient => supabase;
