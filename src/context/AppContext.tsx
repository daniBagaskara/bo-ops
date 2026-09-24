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
  JabatanSDM,
  JenisRelasi,
  JenjangPendidikan,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_BRANCH_OFFICES,
  INITIAL_SDM,
  INITIAL_RELASI,
  INITIAL_PRODUK,
  INITIAL_HARGA_MATRIX,
  INITIAL_TARGETS,
} from '../data/mockData';
import { calculateFinancials, calculateTargetColumns } from '../utils/calculations';

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
  availableUsers: UserProfile[];

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

  // Gatekeeper check
  activeBoSDM: MasterSDM[];
  canInputTarget: boolean;
  sdmCountForActiveBO: number;
  salesCountForActiveBO: number;
  placeholderCountForActiveBO: number;

  // Actions
  addSDM: (data: Omit<MasterSDM, 'id'>) => MasterSDM;
  updateSDM: (id: string, data: Partial<MasterSDM>) => void;
  deleteSDM: (id: string) => void;
  convertPlaceholder: (id: string, realName: string, noHp: string) => void;

  addRelasi: (data: Omit<MasterRelasi, 'id'>) => MasterRelasi;
  updateRelasi: (id: string, data: Partial<MasterRelasi>) => void;
  deleteRelasi: (id: string) => void;

  addTargetDetail: (data: {
    sdm_id: string;
    relasi_id: string;
    produk_id: string;
    qty: number;
    persen_keyakinan: number;
    persen_rabat: number;
    persen_bsr: number;
    persen_hpp: number;
    catatan?: string;
  }) => { success: boolean; error?: string };

  updateTargetDetail: (id: string, data: Partial<TargetPenjualanDetail>) => void;
  deleteTargetDetail: (id: string) => void;

  getProductPrice: (produkId: string, year?: number, zonaId?: number) => number;
  resetAllData: () => void;
  seedDemoSDMForBO: (boId: string) => void;

  // Toast
  toasts: ToastInfo[];
  dismissToast: (id: string) => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY_PREFIX = 'edubranch_app_data_v1_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Current user
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}user`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null; // Start at Auth Page or user can choose role
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeYear, setActiveYear] = useState<number>(2026);

  // Active BO
  const [activeBoId, setActiveBoIdState] = useState<string>(() => {
    return currentUser?.role === 'branch_manager' && currentUser.assigned_bo_id
      ? currentUser.assigned_bo_id
      : 'b0000000-0000-0000-0000-000000000001';
  });

  // When user role changes, enforce BM BO assignment
  const handleSetCurrentUser = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}user`, JSON.stringify(user));
      if (user.role === 'branch_manager' && user.assigned_bo_id) {
        setActiveBoIdState(user.assigned_bo_id);
      }
      showToast('info', 'Login Berhasil', `Sekarang masuk sebagai: ${user.nama} (${user.role === 'superadmin' ? 'Superadmin' : 'Branch Manager'})`);
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}user`);
      showToast('info', 'Keluar', 'Anda telah keluar dari sistem.');
    }
  };

  const logout = () => {
    handleSetCurrentUser(null);
  };

  const setActiveBoId = (boId: string) => {
    if (currentUser?.role === 'branch_manager' && currentUser.assigned_bo_id && currentUser.assigned_bo_id !== boId) {
      showToast('warning', 'Akses Terbatas', 'Branch Manager hanya dapat mengelola Branch Office yang ditugaskan.');
      return;
    }
    setActiveBoIdState(boId);
  };

  // State collections with LocalStorage persistence
  const [branchOffices, setBranchOffices] = useState<MasterBO[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}bo`);
    return saved ? JSON.parse(saved) : INITIAL_BRANCH_OFFICES;
  });

  const [sdmList, setSdmList] = useState<MasterSDM[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}sdm`);
    return saved ? JSON.parse(saved) : INITIAL_SDM;
  });

  const [relasiList, setRelasiList] = useState<MasterRelasi[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}relasi`);
    return saved ? JSON.parse(saved) : INITIAL_RELASI;
  });

  const [produkList] = useState<MasterProduk[]>(INITIAL_PRODUK);
  const [hargaMatrix] = useState<MasterProdukHarga[]>(INITIAL_HARGA_MATRIX);

  const [targetList, setTargetList] = useState<TargetPenjualanDetail[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}targets`);
    return saved ? JSON.parse(saved) : INITIAL_TARGETS;
  });

  const [toasts, setToasts] = useState<ToastInfo[]>([]);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}sdm`, JSON.stringify(sdmList));
  }, [sdmList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}relasi`, JSON.stringify(relasiList));
  }, [relasiList]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}targets`, JSON.stringify(targetList));
  }, [targetList]);

  const showToast = useCallback(
    (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => {
        // Prevent duplicate toasts with the exact same title & message
        if (prev.some((t) => t.title === title && t.message === message)) {
          return prev;
        }
        // Limit max active toasts to 3
        const next = [...prev, { id, type, title, message }];
        return next.slice(-3);
      });

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Current active BO object
  const activeBO = useMemo(() => {
    return branchOffices.find((bo) => bo.id === activeBoId) || branchOffices[0];
  }, [branchOffices, activeBoId]);

  // SDM for active BO
  const activeBoSDM = useMemo(() => {
    return sdmList.filter((s) => s.bo_id === activeBoId && s.status_aktif);
  }, [sdmList, activeBoId]);

  // GATEKEEPER RULE:
  // BM cannot input target before registering SDM for their BO!
  const sdmCountForActiveBO = activeBoSDM.length;
  const canInputTarget = sdmCountForActiveBO > 0;

  const salesCountForActiveBO = useMemo(() => {
    return activeBoSDM.filter((s) => s.jabatan === 'Sales' && !s.is_placeholder).length;
  }, [activeBoSDM]);

  const placeholderCountForActiveBO = useMemo(() => {
    return activeBoSDM.filter((s) => s.is_placeholder).length;
  }, [activeBoSDM]);

  // Price lookup helper based on Year and BO Zone
  const getProductPrice = (produkId: string, year: number = activeYear, zonaId?: number): number => {
    const targetZona = zonaId ?? (activeBO ? activeBO.zona_id : 1);
    const found = hargaMatrix.find(
      (m) => m.produk_id === produkId && m.tahun_anggaran === year && m.zona_id === targetZona
    );
    if (found) return found.harga_satuan;
    // Fallback default
    return 75000;
  };

  // SDM Actions
  const addSDM = (data: Omit<MasterSDM, 'id'>): MasterSDM => {
    const newId = `sdm-${Date.now()}`;
    const newSDM: MasterSDM = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setSdmList((prev) => [newSDM, ...prev]);
    showToast('success', 'SDM Berhasil Ditambahkan', `${data.nama} telah didaftarkan.`);
    return newSDM;
  };

  const updateSDM = (id: string, data: Partial<MasterSDM>) => {
    setSdmList((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
    showToast('success', 'Data Diperbarui', 'Data SDM berhasil diupdate.');
  };

  const deleteSDM = (id: string) => {
    // Check if targets reference this SDM
    const hasTargets = targetList.some((t) => t.sdm_id === id);
    if (hasTargets) {
      showToast('error', 'Gagal Menghapus', 'SDM ini memiliki target penjualan aktif dan tidak dapat dihapus.');
      return;
    }
    setSdmList((prev) => prev.filter((s) => s.id !== id));
    showToast('info', 'SDM Dihapus', 'Data SDM telah dihapus.');
  };

  const convertPlaceholder = (id: string, realName: string, noHp: string) => {
    setSdmList((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            nama: realName,
            no_hp: noHp,
            is_placeholder: false,
            kode_placeholder: undefined,
          };
        }
        return s;
      })
    );
    showToast('success', 'Konversi Berhasil', `Sales placeholder kini aktif sebagai karyawan tetap: ${realName}.`);
  };

  // Relasi Actions
  const addRelasi = (data: Omit<MasterRelasi, 'id'>): MasterRelasi => {
    const newId = `rel-${Date.now()}`;
    const newRelasi: MasterRelasi = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
    };
    setRelasiList((prev) => [newRelasi, ...prev]);
    showToast('success', 'Relasi Ditambahkan', `${data.nama_relasi} berhasil didaftarkan.`);
    return newRelasi;
  };

  const updateRelasi = (id: string, data: Partial<MasterRelasi>) => {
    setRelasiList((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
    showToast('success', 'Relasi Diperbarui', 'Data mitra relasi berhasil diperbarui.');
  };

  const deleteRelasi = (id: string) => {
    const hasTargets = targetList.some((t) => t.relasi_id === id);
    if (hasTargets) {
      showToast('error', 'Gagal Menghapus', 'Relasi ini masih terkait dengan target penjualan aktif.');
      return;
    }
    setRelasiList((prev) => prev.filter((r) => r.id !== id));
    showToast('info', 'Relasi Dihapus', 'Data relasi telah dihapus.');
  };

  // Target Actions with GATEKEEPER verification & Real-Time calculations
  const addTargetDetail = (data: {
    sdm_id: string;
    relasi_id: string;
    produk_id: string;
    qty: number;
    persen_keyakinan: number;
    persen_rabat: number;
    persen_bsr: number;
    persen_hpp: number;
    catatan?: string;
  }): { success: boolean; error?: string } => {
    // GATEKEEPER CHECK:
    if (!canInputTarget) {
      const errorMsg = 'ATURAN GATEKEEPER: Branch Manager belum dapat menginput data target sebelum mendaftarkan data SDM / Karyawan BO!';
      showToast('error', 'Peringatan Gatekeeper', errorMsg);
      return { success: false, error: errorMsg };
    }

    const currentZona = activeBO ? activeBO.zona_id : 1;
    const hargaSatuan = getProductPrice(data.produk_id, activeYear, currentZona);

    const targetCols = calculateTargetColumns(
      data.qty,
      hargaSatuan,
      data.persen_rabat,
      data.persen_bsr,
      data.persen_hpp,
      data.persen_keyakinan
    );

    const newTarget: TargetPenjualanDetail = {
      id: `tgt-${Date.now()}`,
      bo_id: activeBoId,
      sdm_id: data.sdm_id,
      relasi_id: data.relasi_id,
      produk_id: data.produk_id,
      tahun_anggaran: activeYear,
      zona_id: currentZona,
      harga_satuan: hargaSatuan,
      qty: data.qty,
      persen_keyakinan: data.persen_keyakinan,
      persen_rabat: data.persen_rabat,
      persen_bsr: data.persen_bsr,
      persen_hpp: data.persen_hpp,
      ...targetCols,
      catatan: data.catatan,
      created_at: new Date().toISOString(),
    };

    setTargetList((prev) => [newTarget, ...prev]);
    showToast('success', 'Target Disimpan', `Target berhasil dialokasikan: Nilai Brutto ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(targetCols.nilai_brutto)}`);
    return { success: true };
  };

  const updateTargetDetail = (id: string, data: Partial<TargetPenjualanDetail>) => {
    setTargetList((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...data };
          // Recalculate if qty or prices or percentages changed
          const fin = calculateTargetColumns(
            updated.qty,
            updated.harga_satuan,
            updated.persen_rabat,
            updated.persen_bsr,
            updated.persen_hpp,
            updated.persen_keyakinan
          );
          return {
            ...updated,
            ...fin,
          };
        }
        return t;
      })
    );
    showToast('success', 'Target Diperbarui', 'Kalkulasi target berhasil dihitung ulang.');
  };

  const deleteTargetDetail = (id: string) => {
    setTargetList((prev) => prev.filter((t) => t.id !== id));
    showToast('info', 'Target Dihapus', 'Item target penjualan telah dihapus.');
  };

  const resetAllData = () => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}sdm`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}relasi`);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}targets`);
    setSdmList(INITIAL_SDM);
    setRelasiList(INITIAL_RELASI);
    setTargetList(INITIAL_TARGETS);
    showToast('info', 'Reset Selesai', 'Data telah dikembalikan ke kondisi awal (demo).');
  };

  const seedDemoSDMForBO = (boId: string) => {
    const targetBO = branchOffices.find((b) => b.id === boId);
    const boName = targetBO ? targetBO.nama_bo : 'Cabang';

    const newItems: MasterSDM[] = [
      {
        id: `sdm-${boId}-01`,
        bo_id: boId,
        nama: `BM ${targetBO?.kode_bo || 'Cabang'}`,
        jabatan: 'BM',
        no_hp: '0812-9999-1111',
        wilayah_kerja: `Seluruh Wilayah ${boName}`,
        is_placeholder: false,
        status_aktif: true,
      },
      {
        id: `sdm-${boId}-02`,
        bo_id: boId,
        nama: `Sales Area 1 (${targetBO?.wilayah || 'Wilayah'})`,
        jabatan: 'Sales',
        no_hp: '0813-8888-2222',
        wilayah_kerja: 'Wilayah Barat & Pusat',
        is_placeholder: false,
        status_aktif: true,
      },
      {
        id: `sdm-${boId}-03`,
        bo_id: boId,
        nama: 'SRBaru01 (Sales Rekrutmen Baru - Placeholder)',
        jabatan: 'Sales',
        no_hp: '-',
        wilayah_kerja: 'Wilayah Timur & Prospek Baru',
        is_placeholder: true,
        kode_placeholder: 'SRBaru01',
        status_aktif: true,
      },
    ];

    setSdmList((prev) => [...newItems, ...prev]);
    showToast('success', 'SDM Berhasil Di-Seed', `3 Data SDM (termasuk sales placeholder) berhasil ditambahkan untuk ${boName}. Gatekeeper telah terbuka!`);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        logout,
        availableUsers: INITIAL_USERS,

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

        activeBoSDM,
        canInputTarget,
        sdmCountForActiveBO,
        salesCountForActiveBO,
        placeholderCountForActiveBO,

        addSDM,
        updateSDM,
        deleteSDM,
        convertPlaceholder,

        addRelasi,
        updateRelasi,
        deleteRelasi,

        addTargetDetail,
        updateTargetDetail,
        deleteTargetDetail,

        getProductPrice,
        resetAllData,
        seedDemoSDMForBO,

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
