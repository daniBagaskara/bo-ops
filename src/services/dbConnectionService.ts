import { supabase } from '../lib/supabase';

export interface DatabaseConnectionStatus {
  isConnected: boolean;
  latencyMs: number;
  projectUrl: string;
  timestamp: string;
  errorMessage?: string;
  tablesAccessible?: {
    master_bo: boolean;
    app_users: boolean;
    master_produk: boolean;
  };
}

export const dbConnectionService = {
  /**
   * Menguji konektivitas ke database Supabase
   * Mengirimkan query ringan head-only dan mengukur latensi jaringan
   */
  async testConnection(): Promise<DatabaseConnectionStatus> {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();
    const projectUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxwxotsstnnfmaivybbq.supabase.co';

    try {
      // 1. Query tes ke tabel app_users (head-only, no data payload)
      const { error: userError } = await supabase
        .from('app_users')
        .select('id', { count: 'exact', head: true });

      // 2. Query tes ke tabel master_bo
      const { error: boError } = await supabase
        .from('master_bo')
        .select('id', { count: 'exact', head: true });

      // 3. Query tes ke tabel master_produk
      const { error: prodError } = await supabase
        .from('master_produk')
        .select('id', { count: 'exact', head: true });

      const latencyMs = Math.round(performance.now() - startTime);

      if (userError && boError && prodError) {
        return {
          isConnected: false,
          latencyMs,
          projectUrl,
          timestamp,
          errorMessage: userError?.message || boError?.message || 'Tidak dapat terhubung ke tabel Supabase.',
          tablesAccessible: {
            master_bo: !boError,
            app_users: !userError,
            master_produk: !prodError,
          },
        };
      }

      return {
        isConnected: true,
        latencyMs,
        projectUrl,
        timestamp,
        tablesAccessible: {
          master_bo: !boError,
          app_users: !userError,
          master_produk: !prodError,
        },
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        isConnected: false,
        latencyMs,
        projectUrl,
        timestamp,
        errorMessage: err.message || 'Gagal menghubungi server Supabase (Network Error).',
      };
    }
  },

  /**
   * Mengecek apakah variabel lingkungan Supabase sudah terdefinisi
   */
  isConfigured(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return Boolean(url && key);
  },

  /**
   * Memformat error Supabase / PostgREST menjadi pesan yang mudah dimengerti
   */
  formatDatabaseError(error: any): string {
    if (!error) return 'Terjadi kesalahan sistem yang tidak diketahui.';

    // Error code 42501: Row Level Security (RLS) violation
    if (error.code === '42501' || error.message?.includes('violates row-level security')) {
      return 'Akses ditolak oleh kebijakan keamanan (RLS Supabase). Silakan pastikan skrip nonaktif RLS di SQL Editor sudah dijalankan.';
    }

    // Error code 23505: Unique constraint violation
    if (error.code === '23505' || error.message?.includes('unique constraint')) {
      return 'Data duplikat: Kode atau entitas yang sama sudah terdaftar di database.';
    }

    // Error code 23503: Foreign key violation
    if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
      return 'Relasi tidak valid: ID referensi (BO, SDM, atau Produk) tidak ditemukan di master database.';
    }

    // Network error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return 'Gagal tersambung ke jaringan database Supabase. Periksa koneksi internet Anda.';
    }

    return error.message || 'Terjadi kesalahan pada database.';
  },

  /**
   * Menjalankan kueri dengan mekanisme auto-retry untuk mengatasi gangguan jaringan sementara
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = 2,
    delayMs = 500
  ): Promise<T> {
    let lastError: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        }
      }
    }
    throw lastError;
  },
};
