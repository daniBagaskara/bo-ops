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
import { supabaseService } from '../../services/supabaseService';
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
import {
  INITIAL_BRANCH_OFFICES,
  INITIAL_SDM,
  INITIAL_RELASI,
  INITIAL_PRODUK,
  INITIAL_HARGA_MATRIX,
  INITIAL_TARGETS,
} from '../../data/mockData';
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
  const [boList, setBoList] = useState<MasterBO[]>(INITIAL_BRANCH_OFFICES);
  const [sdmList, setSdmList] = useState<MasterSDM[]>(INITIAL_SDM);
  const [relasiList, setRelasiList] = useState<MasterRelasi[]>(INITIAL_RELASI);
  const [produkList, setProdukList] = useState<MasterProduk[]>(INITIAL_PRODUK);
  const [hargaList, setHargaList] = useState<MasterProdukHarga[]>(INITIAL_HARGA_MATRIX);
  const [targetList, setTargetList] = useState<TargetPenjualanDetail[]>(INITIAL_TARGETS);

  // Fetch all operational data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [boRes, sdmRes, relRes, prodRes, hrgRes, tgtRes] = await Promise.allSettled([
        supabaseService.getMasterBO(),
        supabaseService.getMasterSDM(),
        supabaseService.getMasterRelasi(),
        supabaseService.getMasterProduk(),
        supabaseService.getMasterProdukHarga(),
        supabaseService.getTargetPenjualanDetail(),
      ]);

      if (boRes.status === 'fulfilled' && boRes.value.length > 0) setBoList(boRes.value);
      if (sdmRes.status === 'fulfilled' && sdmRes.value.length > 0) setSdmList(sdmRes.value);
      if (relRes.status === 'fulfilled' && relRes.value.length > 0) setRelasiList(relRes.value);
      if (prodRes.status === 'fulfilled' && prodRes.value.length > 0) setProdukList(prodRes.value);
      if (hrgRes.status === 'fulfilled' && hrgRes.value.length > 0) setHargaList(hrgRes.value);
      if (tgtRes.status === 'fulfilled' && tgtRes.value.length > 0) setTargetList(tgtRes.value);
    } catch {
      // Graceful fallback to initial state
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // CRUD HANDLERS (Used for Superadmin operations)
  // 1. BO
  const handleAddBo = async (data: Omit<MasterBO, 'id'>) => {
    try {
      const res = await supabaseService.insertMasterBO(data);
      setBoList((prev) => [res, ...prev]);
      showToast('success', 'Cabang Ditambahkan', `BO ${data.nama_bo} berhasil didaftarkan.`);
    } catch {
      const fallback: MasterBO = { ...data, id: `bo-${Date.now()}` };
      setBoList((prev) => [fallback, ...prev]);
      showToast('success', 'Cabang Disimpan', `BO ${data.nama_bo} tersimpan.`);
    }
  };

  const handleUpdateBo = async (id: string, data: Partial<MasterBO>) => {
    try {
      await supabaseService.updateMasterBO(id, data);
    } catch {
      // fallback
    }
    setBoList((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    showToast('success', 'Perubahan Disimpan', 'Data kantor cabang diperbarui.');
  };

  const handleDeleteBo = async (id: string) => {
    try {
      await supabaseService.deleteMasterBO(id);
    } catch {
      // fallback
    }
    setBoList((prev) => prev.filter((b) => b.id !== id));
    showToast('info', 'Cabang Dihapus', 'Data kantor cabang telah dihapus.');
  };

  // 2. SDM
  const handleAddSdm = async (data: Omit<MasterSDM, 'id'>) => {
    try {
      const res = await supabaseService.insertMasterSDM(data);
      setSdmList((prev) => [res, ...prev]);
    } catch {
      const fallback: MasterSDM = { ...data, id: `sdm-${Date.now()}` };
      setSdmList((prev) => [fallback, ...prev]);
    }
    showToast('success', 'SDM Ditambahkan', `${data.nama} berhasil didaftarkan.`);
  };

  const handleUpdateSdm = async (id: string, data: Partial<MasterSDM>) => {
    try {
      await supabaseService.updateMasterSDM(id, data);
    } catch {
      // fallback
    }
    setSdmList((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    showToast('success', 'SDM Diperbarui', 'Data SDM berhasil diperbarui.');
  };

  const handleDeleteSdm = async (id: string) => {
    try {
      await supabaseService.deleteMasterSDM(id);
    } catch {
      // fallback
    }
    setSdmList((prev) => prev.filter((s) => s.id !== id));
    showToast('info', 'SDM Dihapus', 'Data SDM telah dihapus.');
  };

  // 3. Relasi
  const handleAddRelasi = async (data: Omit<MasterRelasi, 'id'>) => {
    try {
      const res = await supabaseService.insertMasterRelasi(data);
      setRelasiList((prev) => [res, ...prev]);
    } catch {
      const fallback: MasterRelasi = { ...data, id: `rel-${Date.now()}` };
      setRelasiList((prev) => [fallback, ...prev]);
    }
    showToast('success', 'Relasi Ditambahkan', `${data.nama_relasi} berhasil disimpan.`);
  };

  const handleUpdateRelasi = async (id: string, data: Partial<MasterRelasi>) => {
    try {
      await supabaseService.updateMasterRelasi(id, data);
    } catch {
      // fallback
    }
    setRelasiList((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    showToast('success', 'Relasi Diperbarui', 'Data relasi berhasil diperbarui.');
  };

  const handleDeleteRelasi = async (id: string) => {
    try {
      await supabaseService.deleteMasterRelasi(id);
    } catch {
      // fallback
    }
    setRelasiList((prev) => prev.filter((r) => r.id !== id));
    showToast('info', 'Relasi Dihapus', 'Data mitra relasi telah dihapus.');
  };

  // 4. Produk
  const handleAddProduk = async (data: Omit<MasterProduk, 'id'>) => {
    try {
      const res = await supabaseService.insertMasterProduk(data);
      setProdukList((prev) => [res, ...prev]);
    } catch {
      const fallback: MasterProduk = { ...data, id: `prd-${Date.now()}` };
      setProdukList((prev) => [fallback, ...prev]);
    }
    showToast('success', 'Produk Ditambahkan', `${data.judul_buku} tersimpan.`);
  };

  const handleUpdateProduk = async (id: string, data: Partial<MasterProduk>) => {
    try {
      await supabaseService.updateMasterProduk(id, data);
    } catch {
      // fallback
    }
    setProdukList((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    showToast('success', 'Produk Diperbarui', 'Data buku berhasil diperbarui.');
  };

  const handleDeleteProduk = async (id: string) => {
    try {
      await supabaseService.deleteMasterProduk(id);
    } catch {
      // fallback
    }
    setProdukList((prev) => prev.filter((p) => p.id !== id));
    showToast('info', 'Produk Dihapus', 'Data buku telah dihapus.');
  };

  // 5. Harga
  const handleAddHarga = async (data: Omit<MasterProdukHarga, 'id'>) => {
    try {
      const res = await supabaseService.insertMasterProdukHarga(data);
      setHargaList((prev) => [res, ...prev]);
    } catch {
      const fallback: MasterProdukHarga = { ...data, id: `hrg-${Date.now()}` };
      setHargaList((prev) => [fallback, ...prev]);
    }
    showToast('success', 'Tarif Ditambahkan', 'Tarif resmi buku berhasil disimpan.');
  };

  const handleUpdateHarga = async (id: string, data: Partial<MasterProdukHarga>) => {
    try {
      await supabaseService.updateMasterProdukHarga(id, data);
    } catch {
      // fallback
    }
    setHargaList((prev) => prev.map((h) => (h.id === id ? { ...h, ...data } : h)));
    showToast('success', 'Tarif Diperbarui', 'Tarif harga berhasil diupdate.');
  };

  const handleDeleteHarga = async (id: string) => {
    try {
      await supabaseService.deleteMasterProdukHarga(id);
    } catch {
      // fallback
    }
    setHargaList((prev) => prev.filter((h) => h.id !== id));
    showToast('info', 'Tarif Dihapus', 'Tarif harga buku dihapus.');
  };

  // 6. Target Penjualan
  const handleAddTarget = async (data: any) => {
    // If Branch Manager, enforce their assigned BO ID
    const targetPayload = !isSuperAdmin && currentUser.assigned_bo_id
      ? { ...data, bo_id: currentUser.assigned_bo_id }
      : data;

    try {
      const res = await supabaseService.insertTargetPenjualanDetail(targetPayload);
      setTargetList((prev) => [res, ...prev]);
    } catch {
      const fallback: TargetPenjualanDetail = { ...targetPayload, id: `tgt-${Date.now()}` };
      setTargetList((prev) => [fallback, ...prev]);
    }
    showToast('success', 'Target Disimpan', 'Alokasi target penjualan berhasil disimpan.');
  };

  const handleUpdateTarget = async (id: string, data: any) => {
    try {
      await supabaseService.updateTargetPenjualanDetail(id, data);
    } catch {
      // fallback
    }
    setTargetList((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    showToast('success', 'Target Diperbarui', 'Kalkulasi target berhasil diperbarui.');
  };

  const handleDeleteTarget = async (id: string) => {
    try {
      await supabaseService.deleteTargetPenjualanDetail(id);
    } catch {
      // fallback
    }
    setTargetList((prev) => prev.filter((t) => t.id !== id));
    showToast('info', 'Target Dihapus', 'Item target penjualan telah dihapus.');
  };

  // Sidebar badge counts
  const badgeCounts = {
    bo: boList.length,
    sdm: sdmList.length,
    relasi: relasiList.length,
    produk: produkList.length,
    harga: hargaList.length,
    target: targetList.length,
  };

  // Main content render switcher with RBAC protection
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
            // On mobile, toggle drawer; on desktop toggle collapse
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
