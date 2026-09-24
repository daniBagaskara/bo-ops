import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
  AppNavKey,
} from '../../types';
import { apiService } from '../../services/apiService';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { OperationalSummaryView } from '../dashboard/OperationalSummaryView';
import { MasterBoCrud } from '../superadmin/MasterBoCrud';
import { MasterSdmCrud } from '../superadmin/MasterSdmCrud';
import { MasterRelasiCrud } from '../superadmin/MasterRelasiCrud';
import { MasterProdukCrud } from '../superadmin/MasterProdukCrud';
import { MasterHargaCrud } from '../superadmin/MasterHargaCrud';
import { TargetDetailCrud } from '../superadmin/TargetDetailCrud';
import { UserManagementView } from '../superadmin/UserManagementView';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AppMainLayoutProps {
  currentUser: UserProfile;
  onLogout: () => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const AppMainLayout: React.FC<AppMainLayoutProps> = ({
  currentUser,
  onLogout,
  showToast,
}) => {
  const isSuperAdmin = currentUser.role === 'superadmin';

  // Navigation state
  const [currentNav, setCurrentNav] = useState<AppNavKey>(() => {
    return isSuperAdmin ? 'dashboard_overview' : 'target_operasional';
  });

  // Sidebar responsive collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Table Data States
  const [isLoading, setIsLoading] = useState(false);
  const [boList, setBoList] = useState<MasterBO[]>([]);
  const [sdmList, setSdmList] = useState<MasterSDM[]>([]);
  const [relasiList, setRelasiList] = useState<MasterRelasi[]>([]);
  const [produkList, setProdukList] = useState<MasterProduk[]>([]);
  const [hargaList, setHargaList] = useState<MasterProdukHarga[]>([]);
  const [targetList, setTargetList] = useState<TargetPenjualanDetail[]>([]);

  // Fetch all operational data directly from Cloud SQL backend
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const isBM = currentUser.role === 'branch_manager';
      const boFilter = isBM ? currentUser.assigned_bo_id : undefined;

      const [bos, sdms, relasis, produks, hargas, targetResult] = await Promise.all([
        apiService.getBranchOffices(),
        apiService.getSdmList(boFilter),
        apiService.getRelasiList(boFilter),
        apiService.getProdukList(),
        apiService.getHargaMatrix(),
        apiService.getTargets({ bo_id: boFilter, limit: 100 }),
      ]);

      setBoList(bos);
      setSdmList(sdms);
      setRelasiList(relasis);
      setProdukList(produks);
      setHargaList(hargas);
      setTargetList(targetResult.data);
    } catch (err: any) {
      console.error('Error fetching database records:', err);
      showToast('error', 'Gagal Sinkronisasi Data', err.message || 'Koneksi ke database gagal.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Security Route Guard: Enforce BM boundaries
  useEffect(() => {
    const superAdminOnlyNavs: AppNavKey[] = [
      'master_bo',
      'master_sdm',
      'master_relasi',
      'master_produk',
      'master_harga',
      'manajemen_user',
    ];

    if (!isSuperAdmin && superAdminOnlyNavs.includes(currentNav)) {
      showToast(
        'warning',
        'Akses Terbatas',
        'Menu Master Data & Pengaturan hanya dapat diakses oleh Kantor Pusat / Super Admin.'
      );
      setCurrentNav('target_operasional');
    }
  }, [currentNav, isSuperAdmin, showToast]);

  // 1. BO Handlers
  const handleAddBo = async (data: Omit<MasterBO, 'id'>) => {
    try {
      const res = await apiService.createBranchOffice(data);
      setBoList((prev) => [res, ...prev]);
      showToast('success', 'Cabang Ditambahkan', `BO ${data.nama_bo} berhasil didaftarkan ke Cloud SQL.`);
    } catch (err: any) {
      showToast('error', 'Gagal Menambah BO', err.message);
    }
  };

  const handleUpdateBo = async (id: string, data: Partial<MasterBO>) => {
    try {
      const res = await apiService.updateBranchOffice(id, data);
      setBoList((prev) => prev.map((b) => (b.id === id ? res : b)));
      showToast('success', 'Perubahan Disimpan', 'Data kantor cabang diperbarui.');
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui BO', err.message);
    }
  };

  const handleDeleteBo = async (id: string) => {
    try {
      await apiService.deleteBranchOffice(id);
      setBoList((prev) => prev.filter((b) => b.id !== id));
      showToast('info', 'Cabang Dihapus', 'Data kantor cabang telah dihapus dari sistem.');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus BO', err.message);
    }
  };

  // 2. SDM Handlers
  const handleAddSdm = async (data: Omit<MasterSDM, 'id'>) => {
    try {
      const res = await apiService.createSdm(data);
      setSdmList((prev) => [res, ...prev]);
      showToast('success', 'SDM Ditambahkan', `${data.nama} berhasil didaftarkan.`);
    } catch (err: any) {
      showToast('error', 'Gagal Menambah SDM', err.message);
    }
  };

  const handleUpdateSdm = async (id: string, data: Partial<MasterSDM>) => {
    try {
      const res = await apiService.updateSdm(id, data);
      setSdmList((prev) => prev.map((s) => (s.id === id ? res : s)));
      showToast('success', 'SDM Diperbarui', 'Data SDM berhasil diperbarui.');
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui SDM', err.message);
    }
  };

  const handleDeleteSdm = async (id: string) => {
    try {
      await apiService.deleteSdm(id);
      setSdmList((prev) => prev.filter((s) => s.id !== id));
      showToast('info', 'SDM Dihapus', 'Data SDM telah dihapus.');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus SDM', err.message);
    }
  };

  // 3. Relasi Handlers
  const handleAddRelasi = async (data: Omit<MasterRelasi, 'id'>) => {
    try {
      const res = await apiService.createRelasi(data);
      setRelasiList((prev) => [res, ...prev]);
      showToast('success', 'Relasi Ditambahkan', `${data.nama_relasi} berhasil disimpan.`);
    } catch (err: any) {
      showToast('error', 'Gagal Menambah Relasi', err.message);
    }
  };

  const handleUpdateRelasi = async (id: string, data: Partial<MasterRelasi>) => {
    try {
      const res = await apiService.updateRelasi(id, data);
      setRelasiList((prev) => prev.map((r) => (r.id === id ? res : r)));
      showToast('success', 'Relasi Diperbarui', 'Data relasi berhasil diperbarui.');
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Relasi', err.message);
    }
  };

  const handleDeleteRelasi = async (id: string) => {
    try {
      await apiService.deleteRelasi(id);
      setRelasiList((prev) => prev.filter((r) => r.id !== id));
      showToast('info', 'Relasi Dihapus', 'Data relasi telah dihapus.');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Relasi', err.message);
    }
  };

  // 4. Produk Handlers
  const handleAddProduk = async (data: Omit<MasterProduk, 'id'>) => {
    try {
      const res = await apiService.createProduk(data);
      setProdukList((prev) => [res, ...prev]);
      showToast('success', 'Produk Ditambahkan', `${data.judul_buku} tersimpan.`);
    } catch (err: any) {
      showToast('error', 'Gagal Menambah Produk', err.message);
    }
  };

  const handleUpdateProduk = async (id: string, data: Partial<MasterProduk>) => {
    try {
      const res = await apiService.updateProduk(id, data);
      setProdukList((prev) => prev.map((p) => (p.id === id ? res : p)));
      showToast('success', 'Produk Diperbarui', 'Data produk berhasil diupdate.');
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Produk', err.message);
    }
  };

  const handleDeleteProduk = async (id: string) => {
    try {
      await apiService.deleteProduk(id);
      setProdukList((prev) => prev.filter((p) => p.id !== id));
      showToast('info', 'Produk Dihapus', 'Data produk telah dihapus.');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Produk', err.message);
    }
  };

  // 5. Harga Handlers
  const handleAddHarga = async (data: Omit<MasterProdukHarga, 'id'>) => {
    try {
      const res = await apiService.saveHarga(data as any);
      setHargaList((prev) => [res, ...prev]);
      showToast('success', 'Tarif Disimpan', 'Tarif resmi buku berhasil disimpan.');
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Tarif', err.message);
    }
  };

  const handleUpdateHarga = async (_id: string, data: Partial<MasterProdukHarga>) => {
    try {
      const res = await apiService.saveHarga(data as any);
      setHargaList((prev) => prev.map((h) => (h.id === res.id ? res : h)));
      showToast('success', 'Tarif Diperbarui', 'Tarif harga berhasil diupdate.');
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Tarif', err.message);
    }
  };

  const handleDeleteHarga = async (id: string) => {
    setHargaList((prev) => prev.filter((h) => h.id !== id));
    showToast('info', 'Tarif Dihapus', 'Tarif harga buku dihapus.');
  };

  // 6. Target Handlers
  const handleAddTarget = async (data: any) => {
    const targetPayload = !isSuperAdmin && currentUser.assigned_bo_id
      ? { ...data, bo_id: currentUser.assigned_bo_id }
      : data;

    try {
      const res = await apiService.createTarget(targetPayload);
      setTargetList((prev) => [res, ...prev]);
      showToast('success', 'Target Disimpan', 'Alokasi target penjualan berhasil disimpan ke Cloud SQL.');
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Target', err.message);
    }
  };

  const handleUpdateTarget = async (id: string, data: any) => {
    try {
      const res = await apiService.updateTarget(id, data);
      setTargetList((prev) => prev.map((t) => (t.id === id ? res : t)));
      showToast('success', 'Target Diperbarui', 'Kalkulasi target berhasil diperbarui.');
    } catch (err: any) {
      showToast('error', 'Gagal Memperbarui Target', err.message);
    }
  };

  const handleDeleteTarget = async (id: string) => {
    try {
      await apiService.deleteTarget(id);
      setTargetList((prev) => prev.filter((t) => t.id !== id));
      showToast('info', 'Target Dihapus', 'Item target penjualan telah dihapus.');
    } catch (err: any) {
      showToast('error', 'Gagal Menghapus Target', err.message);
    }
  };

  // Badge counts
  const badgeCounts = {
    bo: boList.length,
    sdm: sdmList.length,
    relasi: relasiList.length,
    produk: produkList.length,
    harga: hargaList.length,
    target: targetList.length,
  };

  // Content switcher
  const renderContent = () => {
    switch (currentNav) {
      case 'dashboard_overview':
        return (
          <OperationalSummaryView
            currentUser={currentUser}
            branchOffices={boList}
            sdmList={sdmList}
            relasiList={relasiList}
            produkList={produkList}
            targetList={targetList}
            onNavigate={(nav) => setCurrentNav(nav)}
          />
        );

      case 'target_operasional':
        return (
          <TargetDetailCrud
            currentUser={currentUser}
            items={targetList}
            boList={boList}
            sdmList={sdmList}
            relasiList={relasiList}
            produkList={produkList}
            hargaMatrix={hargaList}
            onAdd={handleAddTarget}
            onUpdate={handleUpdateTarget}
            onDelete={handleDeleteTarget}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        );

      case 'master_bo':
        if (!isSuperAdmin) return <UnauthorizedNotice onBack={() => setCurrentNav('target_operasional')} />;
        return (
          <MasterBoCrud
            items={boList}
            onAdd={handleAddBo}
            onUpdate={handleUpdateBo}
            onDelete={handleDeleteBo}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        );

      case 'master_sdm':
        if (!isSuperAdmin) return <UnauthorizedNotice onBack={() => setCurrentNav('target_operasional')} />;
        return (
          <MasterSdmCrud
            items={sdmList}
            boList={boList}
            onAdd={handleAddSdm}
            onUpdate={handleUpdateSdm}
            onDelete={handleDeleteSdm}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        );

      case 'master_relasi':
        if (!isSuperAdmin) return <UnauthorizedNotice onBack={() => setCurrentNav('target_operasional')} />;
        return (
          <MasterRelasiCrud
            items={relasiList}
            boList={boList}
            onAdd={handleAddRelasi}
            onUpdate={handleUpdateRelasi}
            onDelete={handleDeleteRelasi}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        );

      case 'master_produk':
        if (!isSuperAdmin) return <UnauthorizedNotice onBack={() => setCurrentNav('target_operasional')} />;
        return (
          <MasterProdukCrud
            items={produkList}
            onAdd={handleAddProduk}
            onUpdate={handleUpdateProduk}
            onDelete={handleDeleteProduk}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        );

      case 'master_harga':
        if (!isSuperAdmin) return <UnauthorizedNotice onBack={() => setCurrentNav('target_operasional')} />;
        return (
          <MasterHargaCrud
            items={hargaList}
            produkList={produkList}
            onAdd={handleAddHarga}
            onUpdate={handleUpdateHarga}
            onDelete={handleDeleteHarga}
            onRefresh={loadAllData}
            isLoading={isLoading}
          />
        );

      case 'manajemen_user':
        if (!isSuperAdmin) return <UnauthorizedNotice onBack={() => setCurrentNav('target_operasional')} />;
        return (
          <UserManagementView
            branchOffices={boList}
            onShowToast={showToast}
          />
        );

      default:
        return (
          <OperationalSummaryView
            currentUser={currentUser}
            branchOffices={boList}
            sdmList={sdmList}
            relasiList={relasiList}
            produkList={produkList}
            targetList={targetList}
            onNavigate={(nav) => setCurrentNav(nav)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <AppSidebar
        currentNav={currentNav}
        onSelectNav={(nav) => setCurrentNav(nav)}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        counts={badgeCounts}
      />

      {/* Main Body Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader
          currentUser={currentUser}
          onLogout={onLogout}
          onToggleSidebar={() => {
            if (window.innerWidth < 1024) {
              setIsMobileSidebarOpen(!isMobileSidebarOpen);
            } else {
              setIsSidebarCollapsed(!isSidebarCollapsed);
            }
          }}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Page Main Content */}
        <main className="flex-1 px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-9 max-w-7xl w-full mx-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const UnauthorizedNotice: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="bg-white rounded-xl border border-rose-200 p-8 text-center max-w-md mx-auto shadow-xs my-12">
    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
      <ShieldAlert className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-slate-900">Akses Tidak Diizinkan</h3>
    <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
      Halaman ini hanya dapat diakses oleh akun dengan wewenang Super Admin (Kantor Pusat). Anda tidak memiliki hak akses untuk memodifikasi master data.
    </p>
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
    >
      <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
      Kembali ke Target Operasional
    </button>
  </div>
);
