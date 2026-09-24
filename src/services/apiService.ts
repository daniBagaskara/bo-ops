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

export const apiService = {
  // 1. Auth APIs
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const user = await supabaseService.login(email, password);
    return { token: 'supabase-session', user };
  },

  async loginWithFirebaseToken(_idToken: string): Promise<{ user: UserProfile }> {
    const user = supabaseService.getCurrentUser();
    if (!user) throw new Error('Sesi tidak ditemukan.');
    return { user };
  },

  async getMe(): Promise<{ user: UserProfile }> {
    const user = supabaseService.getCurrentUser();
    if (!user) throw new Error('Sesi tidak ditemukan.');
    return { user };
  },

  async logout(): Promise<void> {
    supabaseService.logout();
  },

  // 2. Master BO APIs
  async getBranchOffices(): Promise<MasterBO[]> {
    return supabaseService.getMasterBo();
  },

  async createBranchOffice(data: Omit<MasterBO, 'id'>): Promise<MasterBO> {
    return supabaseService.createMasterBo(data);
  },

  async updateBranchOffice(id: string, data: Partial<MasterBO>): Promise<MasterBO> {
    return supabaseService.updateMasterBo(id, data);
  },

  async deleteBranchOffice(id: string): Promise<void> {
    return supabaseService.deleteMasterBo(id);
  },

  // 3. Master SDM APIs
  async getSdmList(boId?: string): Promise<MasterSDM[]> {
    const filter = boId && boId !== 'ALL' ? boId : undefined;
    return supabaseService.getMasterSdm(filter);
  },

  async createSdm(data: Omit<MasterSDM, 'id'>): Promise<MasterSDM> {
    return supabaseService.createMasterSdm(data);
  },

  async updateSdm(id: string, data: Partial<MasterSDM>): Promise<MasterSDM> {
    return supabaseService.updateMasterSdm(id, data);
  },

  async deleteSdm(id: string): Promise<void> {
    return supabaseService.deleteMasterSdm(id);
  },

  // 4. Master Relasi APIs
  async getRelasiList(boId?: string): Promise<MasterRelasi[]> {
    const filter = boId && boId !== 'ALL' ? boId : undefined;
    return supabaseService.getMasterRelasi(filter);
  },

  async createRelasi(data: Omit<MasterRelasi, 'id'>): Promise<MasterRelasi> {
    return supabaseService.createMasterRelasi(data);
  },

  async updateRelasi(id: string, data: Partial<MasterRelasi>): Promise<MasterRelasi> {
    return supabaseService.updateMasterRelasi(id, data);
  },

  async deleteRelasi(id: string): Promise<void> {
    return supabaseService.deleteMasterRelasi(id);
  },

  // 5. Master Produk APIs
  async getProdukList(): Promise<MasterProduk[]> {
    return supabaseService.getMasterProduk();
  },

  async createProduk(data: Omit<MasterProduk, 'id'>): Promise<MasterProduk> {
    return supabaseService.createMasterProduk(data);
  },

  async updateProduk(id: string, data: Partial<MasterProduk>): Promise<MasterProduk> {
    return supabaseService.updateMasterProduk(id, data);
  },

  async deleteProduk(id: string): Promise<void> {
    return supabaseService.deleteMasterProduk(id);
  },

  // 6. Master Produk Harga APIs
  async getHargaMatrix(tahunAnggaran?: number, zonaId?: number): Promise<MasterProdukHarga[]> {
    return supabaseService.getMasterProdukHarga(tahunAnggaran, zonaId);
  },

  async saveHarga(data: {
    produk_id: string;
    tahun_anggaran: number;
    zona_id: number;
    harga_satuan: number;
  }): Promise<MasterProdukHarga> {
    const res = await supabaseService.upsertMasterProdukHarga([data]);
    return res[0];
  },

  // 7. Target Penjualan Detail APIs
  async getTargets(params?: {
    page?: number;
    limit?: number;
    bo_id?: string;
    tahun_anggaran?: number;
    search?: string;
  }) {
    return supabaseService.getTargetPenjualan({
      page: params?.page,
      limit: params?.limit,
      boId: params?.bo_id,
      tahun: params?.tahun_anggaran,
      search: params?.search,
    });
  },

  async createTarget(data: any): Promise<TargetPenjualanDetail> {
    return supabaseService.createTargetPenjualan(data);
  },

  async updateTarget(id: string, data: any): Promise<TargetPenjualanDetail> {
    return supabaseService.updateTargetPenjualan(id, data);
  },

  async deleteTarget(id: string): Promise<void> {
    return supabaseService.deleteTargetPenjualan(id);
  },

  // 8. User Management APIs
  async getUsers(): Promise<AppUser[]> {
    return supabaseService.getAppUsers();
  },

  async createUser(data: {
    nama: string;
    email: string;
    password: string;
    role: string;
    bo_id: string | null;
  }): Promise<AppUser> {
    return supabaseService.createAppUser(data);
  },

  async updateUser(id: string, data: Partial<AppUser>): Promise<AppUser> {
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
    await supabaseService.resetAppUserPassword(id, newPassword);
    return { success: true, message: 'Kata sandi berhasil diperbarui.' };
  },

  async toggleUserStatus(
    id: string,
    status_aktif: boolean
  ): Promise<{ success: boolean; status_aktif: boolean }> {
    await supabaseService.toggleAppUserStatus(id, status_aktif);
    return { success: true, status_aktif };
  },

  // 9. Batch Import API
  async uploadImportSpreadsheet(file: File, tableType: ImportTableType): Promise<ImportJobReport> {
    const { batchImportService } = await import('./batchImportService');
    return batchImportService.executeBatchImportWithFile(tableType, file);
  },
};
