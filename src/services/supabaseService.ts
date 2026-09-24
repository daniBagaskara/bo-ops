import { supabase } from '../lib/supabase';
import {
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
  AppUser,
  UserRole,
  PaginationParams,
  PaginatedResult,
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

  // 7. APP USERS CRUD (Super Admin)
  async getAppUsers(): Promise<AppUser[]> {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select(`
          id,
          email,
          nama,
          role,
          bo_id,
          status_aktif,
          created_at,
          updated_at,
          master_bo (
            nama_bo
          )
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((u: any) => ({
          id: u.id,
          email: u.email,
          nama: u.nama,
          role: u.role,
          bo_id: u.bo_id,
          bo_nama: u.master_bo?.nama_bo || (u.role === 'branch_manager' ? 'Branch Office Surabaya' : undefined),
          status_aktif: u.status_aktif ?? true,
          created_at: u.created_at,
          updated_at: u.updated_at,
        }));
      }
    } catch {
      // ignore
    }

    // Fallback seed users
    const localUsersStr = localStorage.getItem('edubranch_app_users_v1');
    const localUsers: any[] = localUsersStr ? JSON.parse(localUsersStr) : [];

    const defaultUsers: AppUser[] = [
      {
        id: 'usr-superadmin-01',
        email: 'superadmin@edubranch.id',
        nama: 'Superadmin Pusat',
        role: 'superadmin',
        bo_id: null,
        status_aktif: true,
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-bm-sby-01',
        email: 'bm.surabaya@edubranch.id',
        nama: 'Ahmad Fauzi, S.Pd.',
        role: 'branch_manager',
        bo_id: 'b0000000-0000-0000-0000-000000000001',
        bo_nama: 'Branch Office Surabaya (Zona 2)',
        status_aktif: true,
        created_at: new Date().toISOString(),
      },
    ];

    const merged = [...defaultUsers];
    localUsers.forEach((lu) => {
      if (!merged.some((m) => m.email === lu.email)) {
        merged.push({
          id: lu.id,
          email: lu.email,
          nama: lu.nama,
          role: lu.role,
          bo_id: lu.bo_id,
          status_aktif: lu.status_aktif ?? true,
          created_at: lu.created_at || new Date().toISOString(),
        });
      }
    });

    return merged;
  },

  async createAppUser(payload: {
    email: string;
    password: string;
    nama: string;
    role: UserRole;
    bo_id?: string | null;
  }): Promise<AppUser> {
    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanPass = payload.password.trim();
    const cleanNama = payload.nama.trim();

    try {
      const { data, error } = await supabase
        .from('app_users')
        .insert([
          {
            email: cleanEmail,
            password: cleanPass,
            nama: cleanNama,
            role: payload.role,
            bo_id: payload.role === 'branch_manager' ? payload.bo_id || null : null,
            status_aktif: true,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          nama: data.nama,
          role: data.role,
          bo_id: data.bo_id,
          status_aktif: data.status_aktif,
          created_at: data.created_at,
        };
      }
    } catch {
      // fallback
    }

    const newUser: AppUser = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      nama: cleanNama,
      role: payload.role,
      bo_id: payload.role === 'branch_manager' ? payload.bo_id || null : null,
      status_aktif: true,
      created_at: new Date().toISOString(),
    };

    const existingStr = localStorage.getItem('edubranch_app_users_v1');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    existing.push({ ...newUser, password: cleanPass });
    localStorage.setItem('edubranch_app_users_v1', JSON.stringify(existing));

    return newUser;
  },

  async updateAppUser(
    id: string,
    updates: { nama?: string; role?: UserRole; bo_id?: string | null; status_aktif?: boolean }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_users')
        .update({
          nama: updates.nama,
          role: updates.role,
          bo_id: updates.role === 'branch_manager' ? updates.bo_id : null,
          status_aktif: updates.status_aktif,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (!error) return true;
    } catch {}

    // Fallback local update
    try {
      const existingStr = localStorage.getItem('edubranch_app_users_v1');
      if (existingStr) {
        const existing: any[] = JSON.parse(existingStr);
        const idx = existing.findIndex((u) => u.id === id);
        if (idx !== -1) {
          existing[idx] = { ...existing[idx], ...updates };
          localStorage.setItem('edubranch_app_users_v1', JSON.stringify(existing));
          return true;
        }
      }
    } catch {}

    return true;
  },

  async resetAppUserPassword(id: string, newPassword: string): Promise<boolean> {
    const cleanPass = newPassword.trim();
    if (!cleanPass) throw new Error('Kata sandi baru tidak boleh kosong.');

    try {
      const { error } = await supabase
        .from('app_users')
        .update({ password: cleanPass, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) return true;
    } catch {}

    // Fallback local update
    try {
      const existingStr = localStorage.getItem('edubranch_app_users_v1');
      if (existingStr) {
        const existing: any[] = JSON.parse(existingStr);
        const idx = existing.findIndex((u) => u.id === id);
        if (idx !== -1) {
          existing[idx].password = cleanPass;
          localStorage.setItem('edubranch_app_users_v1', JSON.stringify(existing));
          return true;
        }
      }
    } catch {}

    return true;
  },

  async toggleAppUserStatus(id: string, newStatus: boolean): Promise<boolean> {
    return this.updateAppUser(id, { status_aktif: newStatus });
  },

  // 8. SERVER-SIDE PAGINATED QUERIES (Handling large datasets up to 600,000 rows)
  async getTargetPenjualanDetailPaginated(
    params: PaginationParams,
    forcedBoId?: string
  ): Promise<PaginatedResult<TargetPenjualanDetail>> {
    const { page, pageSize, search, boIdFilter } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      let query = supabase.from('target_penjualan_detail').select('*', { count: 'exact' });

      // STRICT ROLE PROTECTION: If BM, ALWAYS force their assigned bo_id
      if (forcedBoId) {
        query = query.eq('bo_id', forcedBoId);
      } else if (boIdFilter && boIdFilter !== 'ALL') {
        query = query.eq('bo_id', boIdFilter);
      }

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error } = await query;
      if (!error && data) {
        const total = count ?? data.length;
        return {
          data,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        };
      }
    } catch {
      // ignore
    }

    // Fallback
    const fallbackAll = await this.getTargetPenjualanDetail();
    let filtered = fallbackAll;
    if (forcedBoId) {
      filtered = filtered.filter((t) => t.bo_id === forcedBoId);
    } else if (boIdFilter && boIdFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.bo_id === boIdFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.catatan?.toLowerCase().includes(q) ||
          t.tahun_anggaran.toString().includes(q)
      );
    }

    const total = filtered.length;
    const slice = filtered.slice(from, to + 1);

    return {
      data: slice,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  },
};

