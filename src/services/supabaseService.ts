import { supabase } from '../lib/supabase';
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
  ImportMode,
  ImportJobReport,
  ImportRowError,
} from '../types';

const SESSION_KEY = 'bo_ops_current_user';

export const supabaseService = {
  // ==========================================
  // 1. AUTENTIKASI & SESI PENGGUNA
  // ==========================================
  async login(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    // Query dari tabel app_users di Supabase
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, password, nama, role, bo_id, status_aktif')
      .eq('email', cleanEmail)
      .limit(1);

    if (error) {
      console.error('Supabase user lookup error:', error);
      throw new Error(`Gagal menghubungi database Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('Email atau kata sandi tidak sesuai.');
    }

    const user = data[0];

    // Verifikasi password (plaintext atau hash)
    if (user.password !== password.trim()) {
      throw new Error('Email atau kata sandi tidak sesuai.');
    }

    if (!user.status_aktif) {
      throw new Error('Akun Anda dinonaktifkan. Silakan hubungi Super Admin Pusat.');
    }

    let boNama: string | undefined = undefined;
    if (user.bo_id) {
      const { data: boData } = await supabase
        .from('master_bo')
        .select('nama_bo')
        .eq('id', user.bo_id)
        .single();
      boNama = boData?.nama_bo;
    }

    const profile: UserProfile = {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      assigned_bo_id: user.bo_id || undefined,
      assigned_bo_nama: boNama,
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return profile;
  },

  getCurrentUser(): UserProfile | null {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  },

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
  },

  // ==========================================
  // 2. MASTER BRANCH OFFICE (BO)
  // ==========================================
  async getMasterBo(): Promise<MasterBO[]> {
    const { data, error } = await supabase
      .from('master_bo')
      .select('*')
      .order('nama_bo', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createMasterBo(bo: Omit<MasterBO, 'id' | 'created_at'>): Promise<MasterBO> {
    const { data, error } = await supabase
      .from('master_bo')
      .insert([bo])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateMasterBo(id: string, bo: Partial<MasterBO>): Promise<MasterBO> {
    const { data, error } = await supabase
      .from('master_bo')
      .update(bo)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteMasterBo(id: string): Promise<void> {
    const { error } = await supabase.from('master_bo').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ==========================================
  // 3. MASTER SDM & SALES
  // ==========================================
  async getMasterSdm(boId?: string): Promise<MasterSDM[]> {
    let query = supabase.from('master_sdm').select('*');
    if (boId) {
      query = query.eq('bo_id', boId);
    }
    const { data, error } = await query.order('nama', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createMasterSdm(sdm: Omit<MasterSDM, 'id' | 'created_at'>): Promise<MasterSDM> {
    const { data, error } = await supabase
      .from('master_sdm')
      .insert([sdm])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateMasterSdm(id: string, sdm: Partial<MasterSDM>): Promise<MasterSDM> {
    const { data, error } = await supabase
      .from('master_sdm')
      .update(sdm)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteMasterSdm(id: string): Promise<void> {
    const { error } = await supabase.from('master_sdm').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ==========================================
  // 4. MASTER RELASI
  // ==========================================
  async getMasterRelasi(boId?: string): Promise<MasterRelasi[]> {
    let query = supabase.from('master_relasi').select('*');
    if (boId) {
      query = query.eq('bo_id', boId);
    }
    const { data, error } = await query.order('nama_relasi', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createMasterRelasi(
    relasi: Omit<MasterRelasi, 'id' | 'created_at'>
  ): Promise<MasterRelasi> {
    const { data, error } = await supabase
      .from('master_relasi')
      .insert([relasi])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateMasterRelasi(
    id: string,
    relasi: Partial<MasterRelasi>
  ): Promise<MasterRelasi> {
    const { data, error } = await supabase
      .from('master_relasi')
      .update(relasi)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteMasterRelasi(id: string): Promise<void> {
    const { error } = await supabase.from('master_relasi').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ==========================================
  // 5. MASTER PRODUK
  // ==========================================
  async getMasterProduk(): Promise<MasterProduk[]> {
    const { data, error } = await supabase
      .from('master_produk')
      .select('*')
      .order('kode_sku', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  async createMasterProduk(
    produk: Omit<MasterProduk, 'id' | 'created_at'>
  ): Promise<MasterProduk> {
    const { data, error } = await supabase
      .from('master_produk')
      .insert([produk])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateMasterProduk(
    id: string,
    produk: Partial<MasterProduk>
  ): Promise<MasterProduk> {
    const { data, error } = await supabase
      .from('master_produk')
      .update(produk)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteMasterProduk(id: string): Promise<void> {
    const { error } = await supabase.from('master_produk').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // ==========================================
  // 6. MATRIKS HARGA PRODUK (MULTI-ZONA 1-13)
  // ==========================================
  async getMasterProdukHarga(tahun?: number, zona?: number): Promise<MasterProdukHarga[]> {
    let query = supabase.from('master_produk_harga').select('*');
    if (tahun) query = query.eq('tahun_anggaran', tahun);
    if (zona) query = query.eq('zona_id', zona);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data || [];
  },

  async upsertMasterProdukHarga(
    items: Omit<MasterProdukHarga, 'id'>[]
  ): Promise<MasterProdukHarga[]> {
    const { data, error } = await supabase
      .from('master_produk_harga')
      .upsert(items, { onConflict: 'produk_id,tahun_anggaran,zona_id' })
      .select();

    if (error) throw new Error(error.message);
    return data || [];
  },

  // ==========================================
  // 7. TARGET PENJUALAN DETAIL (OPERASIONAL & FORMULA)
  // ==========================================
  async getTargetPenjualan(params: {
    page?: number;
    limit?: number;
    boId?: string;
    tahun?: number;
    sdmId?: string;
    search?: string;
  }): Promise<{
    data: TargetPenjualanDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalBrutto: number;
      totalNetto: number;
      totalLaba: number;
      totalTertimbang: number;
      totalQty: number;
    };
  }> {
    const page = params.page || 1;
    const limit = params.limit || 25;
    const offset = (page - 1) * limit;

    let query = supabase.from('target_penjualan_detail').select(
      `
      *,
      master_bo:bo_id (nama_bo, kode_bo),
      master_sdm:sdm_id (nama),
      master_relasi:relasi_id (nama_relasi, kode_relasi),
      master_produk:produk_id (judul_buku, kode_sku)
      `,
      { count: 'exact' }
    );

    // Filter BO (Isolasi data BM)
    const currentUser = this.getCurrentUser();
    if (currentUser?.role === 'branch_manager' && currentUser.assigned_bo_id) {
      query = query.eq('bo_id', currentUser.assigned_bo_id);
    } else if (params.boId && params.boId !== 'all') {
      query = query.eq('bo_id', params.boId);
    }

    if (params.tahun) {
      query = query.eq('tahun_anggaran', params.tahun);
    }

    if (params.sdmId) {
      query = query.eq('sdm_id', params.sdmId);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    // Format joined records
    const formatted: TargetPenjualanDetail[] = (data || []).map((row: any) => ({
      id: row.id,
      bo_id: row.bo_id,
      sdm_id: row.sdm_id,
      relasi_id: row.relasi_id,
      produk_id: row.produk_id,
      tahun_anggaran: row.tahun_anggaran,
      zona_id: row.zona_id,
      harga_satuan: Number(row.harga_satuan),
      qty: Number(row.qty),
      persen_keyakinan: Number(row.persen_keyakinan),
      persen_rabat: Number(row.persen_rabat),
      persen_bsr: Number(row.persen_bsr),
      persen_hpp: Number(row.persen_hpp),
      nilai_brutto: Number(row.nilai_brutto),
      nilai_rabat: Number(row.nilai_rabat),
      nilai_bsr: Number(row.nilai_bsr),
      nilai_netto: Number(row.nilai_netto),
      nilai_hpp: Number(row.nilai_hpp),
      laba_kotor: Number(row.laba_kotor),
      nilai_tertimbang_brutto: Number(row.nilai_tertimbang_brutto),
      catatan: row.catatan,
      created_at: row.created_at,
      bo_nama: row.master_bo?.nama_bo,
      bo_kode: row.master_bo?.kode_bo,
      sdm_nama: row.master_sdm?.nama,
      relasi_nama: row.master_relasi?.nama_relasi,
      relasi_kode: row.master_relasi?.kode_relasi,
      produk_judul: row.master_produk?.judul_buku,
      produk_sku: row.master_produk?.kode_sku,
    }));

    // Summary calculation
    const summary = formatted.reduce(
      (acc, cur) => ({
        totalBrutto: acc.totalBrutto + cur.nilai_brutto,
        totalNetto: acc.totalNetto + cur.nilai_netto,
        totalLaba: acc.totalLaba + cur.laba_kotor,
        totalTertimbang: acc.totalTertimbang + cur.nilai_tertimbang_brutto,
        totalQty: acc.totalQty + cur.qty,
      }),
      {
        totalBrutto: 0,
        totalNetto: 0,
        totalLaba: 0,
        totalTertimbang: 0,
        totalQty: 0,
      }
    );

    const total = count || 0;
    return {
      data: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary,
    };
  },

  async createTargetPenjualan(
    payload: Omit<
      TargetPenjualanDetail,
      | 'id'
      | 'nilai_brutto'
      | 'nilai_rabat'
      | 'nilai_bsr'
      | 'nilai_netto'
      | 'nilai_hpp'
      | 'laba_kotor'
      | 'nilai_tertimbang_brutto'
      | 'created_at'
    >
  ): Promise<TargetPenjualanDetail> {
    // 1. Gatekeeper Rule Check: Cabang WAJIB memiliki SDM aktif sebelum menginput target
    const { count: sdmCount, error: sdmErr } = await supabase
      .from('master_sdm')
      .select('id', { count: 'exact', head: true })
      .eq('bo_id', payload.bo_id)
      .eq('status_aktif', true);

    if (sdmErr) throw new Error(sdmErr.message);

    if (!sdmCount || sdmCount === 0) {
      throw new Error(
        'ATURAN GATEKEEPER: Anda belum dapat menginput data target penjualan sebelum mendaftarkan SDM / Karyawan pada cabang ini.'
      );
    }

    // 2. Hitung Formula Finansial Presisi
    const qty = Number(payload.qty) || 0;
    const hargaSatuan = Number(payload.harga_satuan) || 0;
    const persenKeyakinan = Number(payload.persen_keyakinan) || 0;
    const persenRabat = Number(payload.persen_rabat) || 0;
    const persenBsr = Number(payload.persen_bsr) || 0;
    const persenHpp = Number(payload.persen_hpp) || 0;

    const nilaiBrutto = Math.round(qty * hargaSatuan * 100) / 100;
    const nilaiRabat = Math.round(nilaiBrutto * (persenRabat / 100) * 100) / 100;
    const nilaiBsr = Math.round(nilaiBrutto * (persenBsr / 100) * 100) / 100;
    const nilaiNetto = Math.round((nilaiBrutto - nilaiRabat - nilaiBsr) * 100) / 100;
    const nilaiHpp = Math.round(nilaiBrutto * (persenHpp / 100) * 100) / 100;
    const labaKotor = Math.round((nilaiNetto - nilaiHpp) * 100) / 100;
    const nilaiTertimbang =
      Math.round(nilaiBrutto * (persenKeyakinan / 100) * 100) / 100;

    const recordToInsert = {
      bo_id: payload.bo_id,
      sdm_id: payload.sdm_id,
      relasi_id: payload.relasi_id,
      produk_id: payload.produk_id,
      tahun_anggaran: Number(payload.tahun_anggaran),
      zona_id: Number(payload.zona_id),
      harga_satuan: hargaSatuan,
      qty,
      persen_keyakinan: persenKeyakinan,
      persen_rabat: persenRabat,
      persen_bsr: persenBsr,
      persen_hpp: persenHpp,
      nilai_brutto: nilaiBrutto,
      nilai_rabat: nilaiRabat,
      nilai_bsr: nilaiBsr,
      nilai_netto: nilaiNetto,
      nilai_hpp: nilaiHpp,
      laba_kotor: labaKotor,
      nilai_tertimbang_brutto: nilaiTertimbang,
      catatan: payload.catatan || null,
    };

    const { data, error } = await supabase
      .from('target_penjualan_detail')
      .insert([recordToInsert])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateTargetPenjualan(
    id: string,
    payload: Partial<TargetPenjualanDetail>
  ): Promise<TargetPenjualanDetail> {
    // Ambil data lama untuk kalkulasi formula
    const { data: old, error: fetchErr } = await supabase
      .from('target_penjualan_detail')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !old) throw new Error('Data target tidak ditemukan.');

    const qty = payload.qty !== undefined ? Number(payload.qty) : Number(old.qty);
    const hargaSatuan =
      payload.harga_satuan !== undefined
        ? Number(payload.harga_satuan)
        : Number(old.harga_satuan);
    const persenKeyakinan =
      payload.persen_keyakinan !== undefined
        ? Number(payload.persen_keyakinan)
        : Number(old.persen_keyakinan);
    const persenRabat =
      payload.persen_rabat !== undefined
        ? Number(payload.persen_rabat)
        : Number(old.persen_rabat);
    const persenBsr =
      payload.persen_bsr !== undefined
        ? Number(payload.persen_bsr)
        : Number(old.persen_bsr);
    const persenHpp =
      payload.persen_hpp !== undefined
        ? Number(payload.persen_hpp)
        : Number(old.persen_hpp);

    const nilaiBrutto = Math.round(qty * hargaSatuan * 100) / 100;
    const nilaiRabat = Math.round(nilaiBrutto * (persenRabat / 100) * 100) / 100;
    const nilaiBsr = Math.round(nilaiBrutto * (persenBsr / 100) * 100) / 100;
    const nilaiNetto = Math.round((nilaiBrutto - nilaiRabat - nilaiBsr) * 100) / 100;
    const nilaiHpp = Math.round(nilaiBrutto * (persenHpp / 100) * 100) / 100;
    const labaKotor = Math.round((nilaiNetto - nilaiHpp) * 100) / 100;
    const nilaiTertimbang =
      Math.round(nilaiBrutto * (persenKeyakinan / 100) * 100) / 100;

    const updatePayload = {
      ...payload,
      qty,
      harga_satuan: hargaSatuan,
      persen_keyakinan: persenKeyakinan,
      persen_rabat: persenRabat,
      persen_bsr: persenBsr,
      persen_hpp: persenHpp,
      nilai_brutto: nilaiBrutto,
      nilai_rabat: nilaiRabat,
      nilai_bsr: nilaiBsr,
      nilai_netto: nilaiNetto,
      nilai_hpp: nilaiHpp,
      laba_kotor: labaKotor,
      nilai_tertimbang_brutto: nilaiTertimbang,
    };

    const { data, error } = await supabase
      .from('target_penjualan_detail')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async deleteTargetPenjualan(id: string): Promise<void> {
    const { error } = await supabase
      .from('target_penjualan_detail')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ==========================================
  // 8. PENGELOLAAN PENGGUNA (APP USERS)
  // ==========================================
  async getAppUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('app_users')
      .select('id, email, nama, role, bo_id, status_aktif, created_at, master_bo:bo_id(nama_bo)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      nama: u.nama,
      role: u.role,
      bo_id: u.bo_id,
      bo_nama: u.master_bo?.nama_bo,
      status_aktif: u.status_aktif,
      created_at: u.created_at,
    }));
  },

  async createAppUser(user: {
    nama: string;
    email: string;
    password?: string;
    role: string;
    bo_id?: string | null;
  }): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .insert([
        {
          nama: user.nama,
          email: user.email.toLowerCase().trim(),
          password: user.password || 'admin123',
          role: user.role,
          bo_id: user.role === 'branch_manager' ? user.bo_id : null,
          status_aktif: true,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async updateAppUser(
    id: string,
    updates: {
      nama: string;
      role: string;
      bo_id?: string | null;
      status_aktif: boolean;
    }
  ): Promise<AppUser> {
    const { data, error } = await supabase
      .from('app_users')
      .update({
        nama: updates.nama,
        role: updates.role,
        bo_id: updates.role === 'branch_manager' ? updates.bo_id : null,
        status_aktif: updates.status_aktif,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async resetAppUserPassword(id: string, newPass: string): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .update({ password: newPass, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async toggleAppUserStatus(id: string, status: boolean): Promise<void> {
    const { error } = await supabase
      .from('app_users')
      .update({ status_aktif: status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  // ==========================================
  // 9. CLIENT-SIDE BATCH IMPORT (CHUNKED)
  // ==========================================
  async executeBatchImport(
    tableType: ImportTableType,
    rows: Record<string, any>[],
    mode: ImportMode = 'insert',
    onProgress?: (processed: number, total: number, curBatch: number, totalBatches: number) => void
  ): Promise<ImportJobReport> {
    const startTime = Date.now();
    const totalRows = rows.length;
    let successCount = 0;
    let failedCount = 0;
    const errors: ImportRowError[] = [];

    const tableNameMap: Record<ImportTableType, string> = {
      master_bo: 'master_bo',
      master_sdm: 'master_sdm',
      master_relasi: 'master_relasi',
      master_produk: 'master_produk',
      master_harga: 'master_produk_harga',
      target_detail: 'target_penjualan_detail',
    };

    const targetTable = tableNameMap[tableType];
    const CHUNK_SIZE = 100;
    const totalBatches = Math.ceil(totalRows / CHUNK_SIZE);

    for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
      const batch = rows.slice(i, i + CHUNK_SIZE);
      const curBatchNum = Math.floor(i / CHUNK_SIZE) + 1;

      try {
        let resultError: any = null;
        if (mode === 'upsert' && tableType === 'master_harga') {
          const { error } = await supabase
            .from(targetTable)
            .upsert(batch, { onConflict: 'produk_id,tahun_anggaran,zona_id' });
          resultError = error;
        } else {
          const { error } = await supabase.from(targetTable).insert(batch);
          resultError = error;
        }

        if (resultError) {
          failedCount += batch.length;
          errors.push({
            rowNumber: i + 1,
            identifier: `Batch-${curBatchNum}`,
            reason: resultError.message,
          });
        } else {
          successCount += batch.length;
        }
      } catch (err: any) {
        failedCount += batch.length;
        errors.push({
          rowNumber: i + 1,
          identifier: `Batch-${curBatchNum}`,
          reason: err.message || 'Kesalahan impor batch',
        });
      }

      if (onProgress) {
        onProgress(successCount, totalRows, curBatchNum, totalBatches);
      }
    }

    return {
      tableName: tableType,
      totalRows,
      successCount,
      failedCount,
      durationMs: Date.now() - startTime,
      errors,
      timestamp: new Date().toISOString(),
    };
  },
};
