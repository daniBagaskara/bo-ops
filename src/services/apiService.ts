import {
  UserProfile,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
  AppUser,
  ImportTableType,
  ImportJobReport,
} from '../types';
import { supabaseService } from './supabaseService';

const TOKEN_KEY = 'bo_ops_jwt_token';
const USER_KEY = 'bo_ops_user_profile';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setSession(token: string, user: UserProfile) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Resilient API Fetch Helper with Auto-Fallback to Direct Supabase if Backend DB config not populated
async function backendFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; fallbackToSupabase?: boolean }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, { ...options, headers });
    
    // Check if backend database error (e.g. SQL_HOST not set on Vercel yet)
    if (res.status === 500) {
      const errorJson = await res.json().catch(() => ({}));
      if (
        errorJson.error?.includes('database') ||
        errorJson.error?.includes('connection') ||
        errorJson.error?.includes('SQL') ||
        errorJson.error?.includes('Server')
      ) {
        return { data: null, error: errorJson.error, fallbackToSupabase: true };
      }
      return { data: null, error: errorJson.error || 'Terjadi kesalahan pada server.' };
    }

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      return { data: null, error: errorJson.error || `HTTP error ${res.status}` };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    // Network offline or failed to reach Express API
    return { data: null, error: err.message, fallbackToSupabase: true };
  }
}

export const apiService = {
  // 1. Auth APIs
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Priority 1: Backend Express Serverless Route with bcrypt & JWT
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass }),
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.token, data.user);
        return { token: data.token, user: data.user };
      }

      // If invalid password or user not found, throw right away
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Email atau kata sandi tidak sesuai.');
      }
    } catch (err: any) {
      // If server error / not yet configured, fallback smoothly to Supabase Direct
      if (!err.message.includes('tidak sesuai') && !err.message.includes('dinonaktifkan')) {
        console.warn('[BO-OPS] Express API unavailable, falling back to direct Supabase login:', err.message);
        const user = await supabaseService.login(cleanEmail, cleanPass);
        setSession('supabase-session', user);
        return { token: 'supabase-session', user };
      }
      throw err;
    }

    // Fallback if 500 error on backend
    const user = await supabaseService.login(cleanEmail, cleanPass);
    setSession('supabase-session', user);
    return { token: 'supabase-session', user };
  },

  async loginWithFirebaseToken(_idToken: string): Promise<{ user: UserProfile }> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Sesi tidak ditemukan.');
    return { user };
  },

  getCurrentUser(): UserProfile | null {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // ignore
      }
    }
    return supabaseService.getCurrentUser();
  },

  async getMe(): Promise<{ user: UserProfile }> {
    const cached = this.getCurrentUser();
    if (cached) return { user: cached };

    const token = getToken();
    if (token && token !== 'supabase-session') {
      const { data, error } = await backendFetch<{ user: UserProfile }>('/api/auth/me');
      if (data && data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return { user: data.user };
      }
    }

    const user = supabaseService.getCurrentUser();
    if (!user) throw new Error('Sesi tidak ditemukan.');
    return { user };
  },

  async logout(): Promise<void> {
    const token = getToken();
    if (token && token !== 'supabase-session') {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    clearSession();
    supabaseService.logout();
  },

  // 2. Master BO APIs
  async getBranchOffices(): Promise<MasterBO[]> {
    const { data, fallbackToSupabase } = await backendFetch<MasterBO[]>('/api/master/bo');
    if (data && !fallbackToSupabase) return data;
    return supabaseService.getMasterBo();
  },

  async createBranchOffice(item: Omit<MasterBO, 'id'>): Promise<MasterBO> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterBO>('/api/master/bo', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.createMasterBo(item);
  },

  async updateBranchOffice(id: string, item: Partial<MasterBO>): Promise<MasterBO> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterBO>(`/api/master/bo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.updateMasterBo(id, item);
  },

  async deleteBranchOffice(id: string): Promise<void> {
    const { error, fallbackToSupabase } = await backendFetch<void>(`/api/master/bo/${id}`, {
      method: 'DELETE',
    });
    if (!error && !fallbackToSupabase) return;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.deleteMasterBo(id);
  },

  // 3. Master SDM APIs
  async getSdmList(boId?: string): Promise<MasterSDM[]> {
    const query = boId && boId !== 'ALL' ? `?bo_id=${boId}` : '';
    const { data, fallbackToSupabase } = await backendFetch<MasterSDM[]>(`/api/master/sdm${query}`);
    if (data && !fallbackToSupabase) return data;
    const filter = boId && boId !== 'ALL' ? boId : undefined;
    return supabaseService.getMasterSdm(filter);
  },

  async createSdm(item: Omit<MasterSDM, 'id'>): Promise<MasterSDM> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterSDM>('/api/master/sdm', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.createMasterSdm(item);
  },

  async updateSdm(id: string, item: Partial<MasterSDM>): Promise<MasterSDM> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterSDM>(`/api/master/sdm/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.updateMasterSdm(id, item);
  },

  async deleteSdm(id: string): Promise<void> {
    const { error, fallbackToSupabase } = await backendFetch<void>(`/api/master/sdm/${id}`, {
      method: 'DELETE',
    });
    if (!error && !fallbackToSupabase) return;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.deleteMasterSdm(id);
  },

  // 4. Master Relasi APIs
  async getRelasiList(boId?: string): Promise<MasterRelasi[]> {
    const query = boId && boId !== 'ALL' ? `?bo_id=${boId}` : '';
    const { data, fallbackToSupabase } = await backendFetch<MasterRelasi[]>(`/api/master/relasi${query}`);
    if (data && !fallbackToSupabase) return data;
    const filter = boId && boId !== 'ALL' ? boId : undefined;
    return supabaseService.getMasterRelasi(filter);
  },

  async createRelasi(item: Omit<MasterRelasi, 'id'>): Promise<MasterRelasi> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterRelasi>('/api/master/relasi', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.createMasterRelasi(item);
  },

  async updateRelasi(id: string, item: Partial<MasterRelasi>): Promise<MasterRelasi> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterRelasi>(`/api/master/relasi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.updateMasterRelasi(id, item);
  },

  async deleteRelasi(id: string): Promise<void> {
    const { error, fallbackToSupabase } = await backendFetch<void>(`/api/master/relasi/${id}`, {
      method: 'DELETE',
    });
    if (!error && !fallbackToSupabase) return;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.deleteMasterRelasi(id);
  },

  // 5. Master Produk APIs
  async getProdukList(): Promise<MasterProduk[]> {
    const { data, fallbackToSupabase } = await backendFetch<MasterProduk[]>('/api/master/produk');
    if (data && !fallbackToSupabase) return data;
    return supabaseService.getMasterProduk();
  },

  async createProduk(item: Omit<MasterProduk, 'id'>): Promise<MasterProduk> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterProduk>('/api/master/produk', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.createMasterProduk(item);
  },

  async updateProduk(id: string, item: Partial<MasterProduk>): Promise<MasterProduk> {
    const { data, error, fallbackToSupabase } = await backendFetch<MasterProduk>(`/api/master/produk/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.updateMasterProduk(id, item);
  },

  async deleteProduk(id: string): Promise<void> {
    const { error, fallbackToSupabase } = await backendFetch<void>(`/api/master/produk/${id}`, {
      method: 'DELETE',
    });
    if (!error && !fallbackToSupabase) return;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.deleteMasterProduk(id);
  },

  // 6. Master Produk Harga APIs
  async getHargaMatrix(): Promise<MasterProdukHarga[]> {
    const { data, fallbackToSupabase } = await backendFetch<MasterProdukHarga[]>('/api/master/harga');
    if (data && !fallbackToSupabase) return data;
    return supabaseService.getMasterProdukHarga(new Date().getFullYear());
  },

  async getProdukHargaList(tahunAnggaran: number, zonaId: number): Promise<MasterProdukHarga[]> {
    const { data, fallbackToSupabase } = await backendFetch<MasterProdukHarga[]>(
      `/api/master/harga?tahun_anggaran=${tahunAnggaran}&zona_id=${zonaId}`
    );
    if (data && !fallbackToSupabase) return data;
    return supabaseService.getMasterProdukHarga(tahunAnggaran, zonaId);
  },

  async saveHarga(item: {
    id?: string;
    produk_id: string;
    zona_id: number;
    tahun_anggaran: number;
    harga_satuan?: number;
    harga?: number;
  }): Promise<MasterProdukHarga> {
    const hargaVal = Number(item.harga_satuan ?? item.harga ?? 0);
    const payload = {
      produk_id: item.produk_id,
      zona_id: Number(item.zona_id),
      tahun_anggaran: Number(item.tahun_anggaran),
      harga_satuan: hargaVal,
    };

    const { data, error, fallbackToSupabase } = await backendFetch<MasterProdukHarga>('/api/master/harga', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);

    const upserted = await supabaseService.upsertMasterProdukHarga([payload]);
    return (
      upserted[0] || {
        id: item.id || `hrg_${Date.now()}`,
        produk_id: item.produk_id,
        zona_id: item.zona_id,
        tahun_anggaran: item.tahun_anggaran,
        harga_satuan: hargaVal,
      }
    );
  },

  async saveProdukHarga(item: {
    produk_id: string;
    zona_id: number;
    tahun_anggaran: number;
    harga: number;
  }): Promise<void> {
    await this.saveHarga({
      produk_id: item.produk_id,
      zona_id: item.zona_id,
      tahun_anggaran: item.tahun_anggaran,
      harga_satuan: item.harga,
    });
  },

  // 7. Target Penjualan APIs
  async getTargets(params?: {
    bo_id?: string;
    tahun_anggaran?: number;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ data: TargetPenjualanDetail[]; total: number }> {
    const queryParts: string[] = [];
    if (params?.bo_id && params.bo_id !== 'ALL') queryParts.push(`bo_id=${params.bo_id}`);
    if (params?.tahun_anggaran) queryParts.push(`tahun_anggaran=${params.tahun_anggaran}`);
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);

    const queryString = queryParts.length ? `?${queryParts.join('&')}` : '';
    const { data, fallbackToSupabase } = await backendFetch<{
      data: TargetPenjualanDetail[];
      total: number;
    }>(`/api/target${queryString}`);

    if (data && !fallbackToSupabase) return data;

    return supabaseService.getTargetPenjualan({
      boId: params?.bo_id,
      tahun: params?.tahun_anggaran,
      page: params?.page,
      limit: params?.limit,
      search: params?.search,
    });
  },

  async createTarget(data: any): Promise<TargetPenjualanDetail> {
    const { data: created, error, fallbackToSupabase } = await backendFetch<TargetPenjualanDetail>(
      '/api/target',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    if (created && !fallbackToSupabase) return created;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.createTargetPenjualan(data);
  },

  async updateTarget(id: string, data: any): Promise<TargetPenjualanDetail> {
    const { data: updated, error, fallbackToSupabase } = await backendFetch<TargetPenjualanDetail>(
      `/api/target/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    if (updated && !fallbackToSupabase) return updated;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.updateTargetPenjualan(id, data);
  },

  async deleteTarget(id: string): Promise<void> {
    const { error, fallbackToSupabase } = await backendFetch<void>(`/api/target/${id}`, {
      method: 'DELETE',
    });
    if (!error && !fallbackToSupabase) return;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.deleteTargetPenjualan(id);
  },

  // 8. User Management APIs
  async getUsers(): Promise<AppUser[]> {
    const { data, fallbackToSupabase } = await backendFetch<AppUser[]>('/api/users');
    if (data && !fallbackToSupabase) return data;
    return supabaseService.getAppUsers();
  },

  async createUser(data: {
    nama: string;
    email: string;
    password: string;
    role: string;
    bo_id: string | null;
  }): Promise<AppUser> {
    const { data: created, error, fallbackToSupabase } = await backendFetch<AppUser>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (created && !fallbackToSupabase) return created;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.createAppUser(data);
  },

  async updateUser(id: string, data: Partial<AppUser>): Promise<AppUser> {
    const { data: updated, error, fallbackToSupabase } = await backendFetch<AppUser>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (updated && !fallbackToSupabase) return updated;
    if (error && !fallbackToSupabase) throw new Error(error);
    return supabaseService.updateAppUser(id, {
      nama: data.nama || '',
      role: data.role || 'branch_manager',
      bo_id: data.bo_id,
      status_aktif: data.status_aktif !== undefined ? data.status_aktif : true,
    });
  },

  async resetPassword(
    id: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const { data, error, fallbackToSupabase } = await backendFetch<{ success: boolean; message: string }>(
      `/api/users/${id}/password`,
      {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      }
    );
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    await supabaseService.resetAppUserPassword(id, newPassword);
    return { success: true, message: 'Kata sandi berhasil diperbarui.' };
  },

  async toggleUserStatus(
    id: string,
    status_aktif: boolean
  ): Promise<{ success: boolean; status_aktif: boolean }> {
    const { data, error, fallbackToSupabase } = await backendFetch<{ success: boolean; status_aktif: boolean }>(
      `/api/users/${id}/status`,
      {
        method: 'POST',
        body: JSON.stringify({ status_aktif }),
      }
    );
    if (data && !fallbackToSupabase) return data;
    if (error && !fallbackToSupabase) throw new Error(error);
    await supabaseService.toggleAppUserStatus(id, status_aktif);
    return { success: true, status_aktif };
  },

  // 9. Batch Import API
  async uploadImportSpreadsheet(file: File, tableType: ImportTableType): Promise<ImportJobReport> {
    const { batchImportService } = await import('./batchImportService');
    return batchImportService.executeBatchImportWithFile(tableType, file);
  },
};
