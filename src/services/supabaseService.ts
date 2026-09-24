import { supabase } from '../lib/supabase';
import {
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
} from '../types';

export interface DbStatus {
  connected: boolean;
  message: string;
  counts: {
    bo: number;
    sdm: number;
    relasi: number;
    produk: number;
    harga: number;
    target: number;
  };
}

export const supabaseService = {
  // Test connection and count records in each table
  async checkConnection(): Promise<DbStatus> {
    try {
      const results = await Promise.allSettled([
        supabase.from('master_bo').select('id', { count: 'exact', head: true }),
        supabase.from('master_sdm').select('id', { count: 'exact', head: true }),
        supabase.from('master_relasi').select('id', { count: 'exact', head: true }),
        supabase.from('master_produk').select('id', { count: 'exact', head: true }),
        supabase.from('master_produk_harga').select('id', { count: 'exact', head: true }),
        supabase.from('target_penjualan_detail').select('id', { count: 'exact', head: true }),
      ]);

      const counts = {
        bo: results[0].status === 'fulfilled' && results[0].value.count !== null ? results[0].value.count : 0,
        sdm: results[1].status === 'fulfilled' && results[1].value.count !== null ? results[1].value.count : 0,
        relasi: results[2].status === 'fulfilled' && results[2].value.count !== null ? results[2].value.count : 0,
        produk: results[3].status === 'fulfilled' && results[3].value.count !== null ? results[3].value.count : 0,
        harga: results[4].status === 'fulfilled' && results[4].value.count !== null ? results[4].value.count : 0,
        target: results[5].status === 'fulfilled' && results[5].value.count !== null ? results[5].value.count : 0,
      };

      const hasError = results.some(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.error));
      const firstError = results.find(r => r.status === 'fulfilled' && r.value.error);

      return {
        connected: !hasError || counts.bo > 0 || counts.sdm > 0,
        message: firstError && (firstError as any).value?.error?.message ? (firstError as any).value.error.message : 'Terhubung ke Supabase',
        counts,
      };
    } catch (err: any) {
      return {
        connected: false,
        message: err?.message || 'Gagal menghubungi server Supabase',
        counts: { bo: 0, sdm: 0, relasi: 0, produk: 0, harga: 0, target: 0 },
      };
    }
  },

  // CLEAR ALL DATA IN DATABASE
  async clearAllData(): Promise<{ success: boolean; error?: string; cleared: Record<string, number> }> {
    const cleared: Record<string, number> = {
      target_penjualan_detail: 0,
      master_produk_harga: 0,
      master_relasi: 0,
      master_sdm: 0,
      master_produk: 0,
      master_bo: 0,
    };

    try {
      // 1. target_penjualan_detail (child table)
      const resTarget = await supabase.from('target_penjualan_detail').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (resTarget.error) throw new Error(`target_penjualan_detail: ${resTarget.error.message}`);

      // 2. master_produk_harga
      const resHarga = await supabase.from('master_produk_harga').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (resHarga.error) throw new Error(`master_produk_harga: ${resHarga.error.message}`);

      // 3. master_relasi
      const resRelasi = await supabase.from('master_relasi').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (resRelasi.error) throw new Error(`master_relasi: ${resRelasi.error.message}`);

      // 4. master_sdm
      const resSdm = await supabase.from('master_sdm').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (resSdm.error) throw new Error(`master_sdm: ${resSdm.error.message}`);

      // 5. master_produk
      const resProduk = await supabase.from('master_produk').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (resProduk.error) throw new Error(`master_produk: ${resProduk.error.message}`);

      // 6. master_bo
      const resBo = await supabase.from('master_bo').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (resBo.error) throw new Error(`master_bo: ${resBo.error.message}`);

      return { success: true, cleared };
    } catch (err: any) {
      console.error('Error clearing database:', err);
      return { success: false, error: err.message, cleared };
    }
  },

  // 1. MASTER BO CRUD
  async getMasterBO(): Promise<MasterBO[]> {
    const { data, error } = await supabase
      .from('master_bo')
      .select('*')
      .order('nama_bo', { ascending: true });
    if (error) throw error;
    return (data || []) as MasterBO[];
  },

  async insertMasterBO(record: Omit<MasterBO, 'id' | 'created_at'>): Promise<MasterBO> {
    const { data, error } = await supabase
      .from('master_bo')
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data as MasterBO;
  },

  async updateMasterBO(id: string, record: Partial<MasterBO>): Promise<MasterBO> {
    const { data, error } = await supabase
      .from('master_bo')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MasterBO;
  },

  async deleteMasterBO(id: string): Promise<void> {
    const { error } = await supabase.from('master_bo').delete().eq('id', id);
    if (error) throw error;
  },

  // 2. MASTER SDM CRUD
  async getMasterSDM(): Promise<MasterSDM[]> {
    const { data, error } = await supabase
      .from('master_sdm')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as MasterSDM[];
  },

  async insertMasterSDM(record: Omit<MasterSDM, 'id' | 'created_at'>): Promise<MasterSDM> {
    const { data, error } = await supabase
      .from('master_sdm')
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data as MasterSDM;
  },

  async updateMasterSDM(id: string, record: Partial<MasterSDM>): Promise<MasterSDM> {
    const { data, error } = await supabase
      .from('master_sdm')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MasterSDM;
  },

  async deleteMasterSDM(id: string): Promise<void> {
    const { error } = await supabase.from('master_sdm').delete().eq('id', id);
    if (error) throw error;
  },

  // 3. MASTER RELASI CRUD
  async getMasterRelasi(): Promise<MasterRelasi[]> {
    const { data, error } = await supabase
      .from('master_relasi')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as MasterRelasi[];
  },

  async insertMasterRelasi(record: Omit<MasterRelasi, 'id' | 'created_at'>): Promise<MasterRelasi> {
    const { data, error } = await supabase
      .from('master_relasi')
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data as MasterRelasi;
  },

  async updateMasterRelasi(id: string, record: Partial<MasterRelasi>): Promise<MasterRelasi> {
    const { data, error } = await supabase
      .from('master_relasi')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MasterRelasi;
  },

  async deleteMasterRelasi(id: string): Promise<void> {
    const { error } = await supabase.from('master_relasi').delete().eq('id', id);
    if (error) throw error;
  },

  // 4. MASTER PRODUK CRUD
  async getMasterProduk(): Promise<MasterProduk[]> {
    const { data, error } = await supabase
      .from('master_produk')
      .select('*')
      .order('kode_sku', { ascending: true });
    if (error) throw error;
    return (data || []) as MasterProduk[];
  },

  async insertMasterProduk(record: Omit<MasterProduk, 'id' | 'created_at'>): Promise<MasterProduk> {
    const { data, error } = await supabase
      .from('master_produk')
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data as MasterProduk;
  },

  async updateMasterProduk(id: string, record: Partial<MasterProduk>): Promise<MasterProduk> {
    const { data, error } = await supabase
      .from('master_produk')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MasterProduk;
  },

  async deleteMasterProduk(id: string): Promise<void> {
    const { error } = await supabase.from('master_produk').delete().eq('id', id);
    if (error) throw error;
  },

  // 5. MASTER PRODUK HARGA CRUD
  async getMasterProdukHarga(): Promise<MasterProdukHarga[]> {
    const { data, error } = await supabase
      .from('master_produk_harga')
      .select('*')
      .order('tahun_anggaran', { ascending: false });
    if (error) throw error;
    return (data || []) as MasterProdukHarga[];
  },

  async insertMasterProdukHarga(record: Omit<MasterProdukHarga, 'id'>): Promise<MasterProdukHarga> {
    const { data, error } = await supabase
      .from('master_produk_harga')
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data as MasterProdukHarga;
  },

  async updateMasterProdukHarga(id: string, record: Partial<MasterProdukHarga>): Promise<MasterProdukHarga> {
    const { data, error } = await supabase
      .from('master_produk_harga')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MasterProdukHarga;
  },

  async deleteMasterProdukHarga(id: string): Promise<void> {
    const { error } = await supabase.from('master_produk_harga').delete().eq('id', id);
    if (error) throw error;
  },

  // 6. TARGET PENJUALAN DETAIL CRUD
  async getTargetPenjualanDetail(): Promise<TargetPenjualanDetail[]> {
    const { data, error } = await supabase
      .from('target_penjualan_detail')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as TargetPenjualanDetail[];
  },

  async insertTargetPenjualanDetail(record: any): Promise<TargetPenjualanDetail> {
    const { data, error } = await supabase
      .from('target_penjualan_detail')
      .insert([record])
      .select()
      .single();
    if (error) throw error;
    return data as TargetPenjualanDetail;
  },

  async updateTargetPenjualanDetail(id: string, record: Partial<TargetPenjualanDetail>): Promise<TargetPenjualanDetail> {
    const { data, error } = await supabase
      .from('target_penjualan_detail')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TargetPenjualanDetail;
  },

  async deleteTargetPenjualanDetail(id: string): Promise<void> {
    const { error } = await supabase.from('target_penjualan_detail').delete().eq('id', id);
    if (error) throw error;
  },

  // 7. APP USERS & AUTHENTICATION CRUD
  async loginUser(emailInput: string, passwordInput: string): Promise<{ user: any; error?: string }> {
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    try {
      // 1. Try querying app_users table in Supabase
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', cleanEmail)
        .eq('password', cleanPass)
        .single();

      if (!error && data) {
        return {
          user: {
            id: data.id,
            email: data.email,
            nama: data.nama,
            role: data.role,
            assigned_bo_id: data.bo_id,
          },
        };
      }
    } catch {
      // ignore network or missing table error to allow fallback
    }

    // 2. Fallback to default credentials if migration hasn't been executed yet
    if (cleanEmail === 'superadmin@edubranch.id' && cleanPass === 'admin123') {
      return {
        user: {
          id: 'usr-superadmin-01',
          email: 'superadmin@edubranch.id',
          nama: 'Superadmin Pusat',
          role: 'superadmin',
        },
      };
    }

    if (cleanEmail === 'bm.surabaya@edubranch.id' && cleanPass === 'bm123') {
      return {
        user: {
          id: 'usr-bm-sby-01',
          email: 'bm.surabaya@edubranch.id',
          nama: 'Ahmad Fauzi, S.Pd.',
          role: 'branch_manager',
          assigned_bo_id: 'b0000000-0000-0000-0000-000000000001',
          assigned_bo_nama: 'Branch Office Surabaya (Zona 2)',
        },
      };
    }

    // 3. Fallback to localStorage registered users
    try {
      const localUsersStr = localStorage.getItem('edubranch_app_users_v1');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        const match = localUsers.find(
          (u: any) => u.email.toLowerCase() === cleanEmail && u.password === cleanPass
        );
        if (match) {
          return {
            user: {
              id: match.id,
              email: match.email,
              nama: match.nama,
              role: match.role,
              assigned_bo_id: match.bo_id,
            },
          };
        }
      }
    } catch {
      // ignore
    }

    return { user: null, error: 'Email atau kata sandi tidak cocok.' };
  },

  async registerUser(userData: {
    email: string;
    password: string;
    nama: string;
    role: 'superadmin' | 'branch_manager';
    bo_id?: string | null;
  }): Promise<{ user: any; error?: string }> {
    const cleanEmail = userData.email.trim().toLowerCase();

    // 1. Save to Supabase app_users table if available
    try {
      const { data, error } = await supabase
        .from('app_users')
        .insert([
          {
            email: cleanEmail,
            password: userData.password.trim(),
            nama: userData.nama.trim(),
            role: userData.role,
            bo_id: userData.bo_id || null,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return {
          user: {
            id: data.id,
            email: data.email,
            nama: data.nama,
            role: data.role,
            assigned_bo_id: data.bo_id,
          },
        };
      }
    } catch {
      // ignore
    }

    // 2. Save locally as fallback
    const newUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      password: userData.password.trim(),
      nama: userData.nama.trim(),
      role: userData.role,
      bo_id: userData.bo_id || null,
    };

    try {
      const existingStr = localStorage.getItem('edubranch_app_users_v1');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      existing.push(newUser);
      localStorage.setItem('edubranch_app_users_v1', JSON.stringify(existing));
    } catch {
      // ignore
    }

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        nama: newUser.nama,
        role: newUser.role,
        assigned_bo_id: newUser.bo_id,
      },
    };
  },

  async getAppUsers(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {
      // ignore
    }
    return [];
  },
};
