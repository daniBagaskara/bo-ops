import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  UserProfile,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
  ActiveTab,
} from '../types';
import { apiService } from '../services/apiService';

interface ToastInfo {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
}

interface AppContextType {
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  logout: () => void;
  isLoadingUser: boolean;

  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  activeYear: number;
  setActiveYear: (year: number) => void;

  activeBoId: string;
  setActiveBoId: (boId: string) => void;
  activeBO: MasterBO | undefined;

  branchOffices: MasterBO[];
  sdmList: MasterSDM[];
  relasiList: MasterRelasi[];
  produkList: MasterProduk[];
  hargaMatrix: MasterProdukHarga[];
  targetList: TargetPenjualanDetail[];
  isLoadingData: boolean;
  refreshData: () => Promise<void>;

  // Gatekeeper check
  activeBoSDM: MasterSDM[];
  canInputTarget: boolean;
  sdmCountForActiveBO: number;
  salesCountForActiveBO: number;
  placeholderCountForActiveBO: number;

  // Actions
  addSDM: (data: Omit<MasterSDM, 'id'>) => Promise<MasterSDM>;
  updateSDM: (id: string, data: Partial<MasterSDM>) => Promise<void>;
  deleteSDM: (id: string) => Promise<void>;

  addRelasi: (data: Omit<MasterRelasi, 'id'>) => Promise<MasterRelasi>;
  updateRelasi: (id: string, data: Partial<MasterRelasi>) => Promise<void>;
  deleteRelasi: (id: string) => Promise<void>;

  addTargetDetail: (data: any) => Promise<{ success: boolean; error?: string }>;
  updateTargetDetail: (id: string, data: Partial<TargetPenjualanDetail>) => Promise<void>;
  deleteTargetDetail: (id: string) => Promise<void>;

  getProductPrice: (produkId: string, year?: number, zonaId?: number) => number;

  // Toast
  toasts: ToastInfo[];
  dismissToast: (id: string) => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeYear, setActiveYear] = useState<number>(2026);
  const [activeBoId, setActiveBoIdState] = useState<string>('');

  const [branchOffices, setBranchOffices] = useState<MasterBO[]>([]);
  const [sdmList, setSdmList] = useState<MasterSDM[]>([]);
  const [relasiList, setRelasiList] = useState<MasterRelasi[]>([]);
  const [produkList, setProdukList] = useState<MasterProduk[]>([]);
  const [hargaMatrix, setHargaMatrix] = useState<MasterProdukHarga[]>([]);
  const [targetList, setTargetList] = useState<TargetPenjualanDetail[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  const showToast = useCallback(
    (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => {
        if (prev.some((t) => t.title === title && t.message === message)) return prev;
        return [...prev.slice(-2), { id, type, title, message }];
      });
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check current session on mount and listen to auth events
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      showToast('warning', 'Sesi Kedaluwarsa', 'Silakan masuk kembali untuk melanjutkan.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const initAuth = async () => {
      setIsLoadingUser(true);
      try {
        const res = await apiService.getMe();
        if (res.user) {
          setCurrentUser(res.user);
          if (res.user.role === 'branch_manager' && res.user.assigned_bo_id) {
            setActiveBoIdState(res.user.assigned_bo_id);
          }
        }
      } catch {
        // Not logged in, invalid token, or expired -> eject to Login Page
        setCurrentUser(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    initAuth();

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [showToast]);

  // Refresh all application data from backend
  const refreshData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoadingData(true);
    try {
      const [bos, sdms, relasis, produks, hargas, targetsRes] = await Promise.all([
        apiService.getBranchOffices(),
        apiService.getSdmList(currentUser.role === 'branch_manager' ? currentUser.assigned_bo_id : undefined),
        apiService.getRelasiList(currentUser.role === 'branch_manager' ? currentUser.assigned_bo_id : undefined),
        apiService.getProdukList(),
        apiService.getHargaMatrix(),
        apiService.getTargets({
          bo_id: currentUser.role === 'branch_manager' ? currentUser.assigned_bo_id : undefined,
          limit: 100,
        }),
      ]);

      setBranchOffices(bos);
      setSdmList(sdms);
      setRelasiList(relasis);
      setProdukList(produks);
      setHargaMatrix(hargas);
      setTargetList(targetsRes.data);

      // Auto-set active BO
      if (currentUser.role === 'branch_manager' && currentUser.assigned_bo_id) {
        setActiveBoIdState(currentUser.assigned_bo_id);
      } else if (bos.length > 0 && !activeBoId) {
        setActiveBoIdState(bos[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      showToast('error', 'Gagal Memuat Data', err.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setIsLoadingData(false);
    }
  }, [currentUser, activeBoId, showToast]);

  useEffect(() => {
    if (currentUser) {
      refreshData();
    }
  }, [currentUser, refreshData]);

  const handleSetCurrentUser = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      if (user.role === 'branch_manager' && user.assigned_bo_id) {
        setActiveBoIdState(user.assigned_bo_id);
      }
      showToast('info', 'Selamat Datang', `Masuk sebagai: ${user.nama} (${user.role === 'superadmin' ? 'Super Admin' : 'Branch Manager'})`);
    } else {
      setTargetList([]);
    }
  };

  const logout = async () => {
    await apiService.logout();
    handleSetCurrentUser(null);
  };

  const setActiveBoId = (boId: string) => {
    if (currentUser?.role === 'branch_manager' && currentUser.assigned_bo_id && currentUser.assigned_bo_id !== boId) {
      showToast('warning', 'Akses Dibatasi', 'Branch Manager hanya dapat mengakses kantor cabang yang ditugaskan.');
      return;
    }
    setActiveBoIdState(boId);
  };

  const activeBO = useMemo(() => {
    return branchOffices.find((bo) => bo.id === activeBoId) || branchOffices[0];
  }, [branchOffices, activeBoId]);

  const activeBoSDM = useMemo(() => {
    return sdmList.filter((s) => s.bo_id === activeBoId && s.status_aktif);
  }, [sdmList, activeBoId]);

  const sdmCountForActiveBO = activeBoSDM.length;
  const canInputTarget = sdmCountForActiveBO > 0;

  const salesCountForActiveBO = useMemo(() => {
    return activeBoSDM.filter((s) => s.jabatan === 'Sales' && !s.is_placeholder).length;
  }, [activeBoSDM]);

  const placeholderCountForActiveBO = useMemo(() => {
    return activeBoSDM.filter((s) => s.is_placeholder).length;
  }, [activeBoSDM]);

  const getProductPrice = (produkId: string, year: number = activeYear, zonaId?: number): number => {
    const targetZona = zonaId ?? (activeBO ? activeBO.zona_id : 1);
    const found = hargaMatrix.find(
      (m) => m.produk_id === produkId && m.tahun_anggaran === year && m.zona_id === targetZona
    );
    return found ? found.harga_satuan : 75000;
  };

  // SDM Actions
  const addSDM = async (data: Omit<MasterSDM, 'id'>): Promise<MasterSDM> => {
    const created = await apiService.createSdm(data);
    setSdmList((prev) => [created, ...prev]);
    showToast('success', 'SDM Berhasil Ditambahkan', `${data.nama} telah terdaftar.`);
    return created;
  };

  const updateSDM = async (id: string, data: Partial<MasterSDM>) => {
    const updated = await apiService.updateSdm(id, data);
    setSdmList((prev) => prev.map((s) => (s.id === id ? updated : s)));
    showToast('success', 'Perubahan Disimpan', 'Data SDM berhasil diperbarui.');
  };

  const deleteSDM = async (id: string) => {
    await apiService.deleteSdm(id);
    setSdmList((prev) => prev.filter((s) => s.id !== id));
    showToast('info', 'SDM Dihapus', 'Data SDM telah dihapus.');
  };

  // Relasi Actions
  const addRelasi = async (data: Omit<MasterRelasi, 'id'>): Promise<MasterRelasi> => {
    const created = await apiService.createRelasi(data);
    setRelasiList((prev) => [created, ...prev]);
    showToast('success', 'Relasi Ditambahkan', `${data.nama_relasi} berhasil disimpan.`);
    return created;
  };

  const updateRelasi = async (id: string, data: Partial<MasterRelasi>) => {
    const updated = await apiService.updateRelasi(id, data);
    setRelasiList((prev) => prev.map((r) => (r.id === id ? updated : r)));
    showToast('success', 'Relasi Diperbarui', 'Data relasi berhasil diupdate.');
  };

  const deleteRelasi = async (id: string) => {
    await apiService.deleteRelasi(id);
    setRelasiList((prev) => prev.filter((r) => r.id !== id));
    showToast('info', 'Relasi Dihapus', 'Data relasi telah dihapus.');
  };

  // Target Actions
  const addTargetDetail = async (data: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const created = await apiService.createTarget({
        ...data,
        bo_id: currentUser?.role === 'branch_manager' ? currentUser.assigned_bo_id : (data.bo_id || activeBoId),
        tahun_anggaran: activeYear,
      });
      setTargetList((prev) => [created, ...prev]);
      showToast('success', 'Target Disimpan', `Target berhasil dialokasikan.`);
      return { success: true };
    } catch (err: any) {
      showToast('error', 'Gagal Menyimpan Target', err.message);
      return { success: false, error: err.message };
    }
  };

  const updateTargetDetail = async (id: string, data: Partial<TargetPenjualanDetail>) => {
    const updated = await apiService.updateTarget(id, data);
    setTargetList((prev) => prev.map((t) => (t.id === id ? updated : t)));
    showToast('success', 'Target Diperbarui', 'Perubahan target berhasil disimpan.');
  };

  const deleteTargetDetail = async (id: string) => {
    await apiService.deleteTarget(id);
    setTargetList((prev) => prev.filter((t) => t.id !== id));
    showToast('info', 'Target Dihapus', 'Item target berhasil dihapus.');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        logout,
        isLoadingUser,

        activeTab,
        setActiveTab,

        activeYear,
        setActiveYear,

        activeBoId,
        setActiveBoId,
        activeBO,

        branchOffices,
        sdmList,
        relasiList,
        produkList,
        hargaMatrix,
        targetList,
        isLoadingData,
        refreshData,

        activeBoSDM,
        canInputTarget,
        sdmCountForActiveBO,
        salesCountForActiveBO,
        placeholderCountForActiveBO,

        addSDM,
        updateSDM,
        deleteSDM,

        addRelasi,
        updateRelasi,
        deleteRelasi,

        addTargetDetail,
        updateTargetDetail,
        deleteTargetDetail,

        getProductPrice,

        toasts,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
