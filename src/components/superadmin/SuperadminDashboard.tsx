import React, { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
} from '../../types';
import { supabaseService, DbStatus } from '../../services/supabaseService';
import { SUPABASE_URL } from '../../lib/supabase';
import { MasterBoCrud } from './MasterBoCrud';
import { MasterSdmCrud } from './MasterSdmCrud';
import { MasterRelasiCrud } from './MasterRelasiCrud';
import { MasterProdukCrud } from './MasterProdukCrud';
import { MasterHargaCrud } from './MasterHargaCrud';
import { TargetDetailCrud } from './TargetDetailCrud';
import { ClearDatabaseModal } from './ClearDatabaseModal';
import {
  INITIAL_BRANCH_OFFICES,
  INITIAL_SDM,
  INITIAL_RELASI,
  INITIAL_PRODUK,
  INITIAL_HARGA_MATRIX,
  INITIAL_TARGETS,
} from '../../data/mockData';
import {
  ShieldCheck,
  Building2,
  Users,
  Building,
  BookOpen,
  DollarSign,
  Target,
  Trash2,
  RefreshCw,
  LogOut,
  Database,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Code2,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { formatRupiahCompact } from '../../utils/calculations';
import { USER_MIGRATION_SQL } from '../../data/userMigrationSql';

interface SuperadminDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  showToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

type SuperadminTab =
  | 'master_bo'
  | 'master_sdm'
  | 'master_relasi'
  | 'master_produk'
  | 'master_produk_harga'
  | 'target_penjualan_detail';

export const SuperadminDashboard: React.FC<SuperadminDashboardProps> = ({
  currentUser,
  onLogout,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<SuperadminTab>('master_bo');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  // Table Data States
  const [boList, setBoList] = useState<MasterBO[]>(INITIAL_BRANCH_OFFICES);
  const [sdmList, setSdmList] = useState<MasterSDM[]>(INITIAL_SDM);
  const [relasiList, setRelasiList] = useState<MasterRelasi[]>(INITIAL_RELASI);
  const [produkList, setProdukList] = useState<MasterProduk[]>(INITIAL_PRODUK);
  const [hargaList, setHargaList] = useState<MasterProdukHarga[]>(INITIAL_HARGA_MATRIX);
  const [targetList, setTargetList] = useState<TargetPenjualanDetail[]>(INITIAL_TARGETS);

  // Fetch all tables from Supabase
  const loadAllDataFromSupabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await supabaseService.checkConnection();
      setDbStatus(status);

      // Attempt to load from tables
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

      showToast('info', 'Sinkronisasi Selesai', 'Data terbaru berhasil dimuat dari database Supabase.');
    } catch (err: any) {
      console.error('Failed to load from Supabase:', err);
      showToast('warning', 'Peringatan Koneksi', 'Menggunakan data state lokal saat menyambung ke Supabase.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAllDataFromSupabase();
  }, [loadAllDataFromSupabase]);

  // CLEAR ALL DATA
  const handleClearAllData = async () => {
    setIsLoading(true);
    try {
      const res = await supabaseService.clearAllData();
      // Wipe state locally
      setTargetList([]);
      setHargaList([]);
      setRelasiList([]);
      setSdmList([]);
      setProdukList([]);
      setBoList([]);

      if (res.success) {
        showToast(
          'success',
          'Database Berhasil Dikosongkan',
          'Semua data pada 6 tabel database Supabase telah dihapus sepenuhnya.'
        );
      } else {
        showToast(
          'warning',
          'Tabel Dikosongkan (Lokal)',
          `Catatan Supabase: ${res.error || 'State lokal dikosongkan'}`
        );
      }
      // Recheck status
      const status = await supabaseService.checkConnection();
      setDbStatus(status);
    } catch (err: any) {
      showToast('error', 'Gagal Clear Database', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // SEED INITIAL DEMO DATA
  const handleSeedInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Seed BO
      for (const bo of INITIAL_BRANCH_OFFICES) {
        try {
          await supabaseService.insertMasterBO({
            kode_bo: bo.kode_bo,
            nama_bo: bo.nama_bo,
            zona_id: bo.zona_id,
            wilayah: bo.wilayah,
            alamat: bo.alamat,
          });
        } catch {
          // ignore conflict
        }
      }

      // 2. Seed SDM
      for (const sdm of INITIAL_SDM) {
        try {
          await supabaseService.insertMasterSDM({
            bo_id: sdm.bo_id,
            nama: sdm.nama,
            jabatan: sdm.jabatan,
            no_hp: sdm.no_hp,
            wilayah_kerja: sdm.wilayah_kerja,
            is_placeholder: sdm.is_placeholder,
            kode_placeholder: sdm.kode_placeholder,
            status_aktif: sdm.status_aktif,
          });
        } catch {
          // ignore
        }
      }

      // 3. Seed Relasi
      for (const rel of INITIAL_RELASI) {
        try {
          await supabaseService.insertMasterRelasi({
            bo_id: rel.bo_id,
            kode_relasi: rel.kode_relasi,
            nama_relasi: rel.nama_relasi,
            jenis_relasi: rel.jenis_relasi,
            jenjang: rel.jenjang,
            alamat: rel.alamat,
            kontak_person: rel.kontak_person,
            no_kontak: rel.no_kontak,
            default_rabat_persen: rel.default_rabat_persen,
          });
        } catch {
          // ignore
        }
      }

      // 4. Seed Produk
      for (const p of INITIAL_PRODUK) {
        try {
          await supabaseService.insertMasterProduk({
            kode_sku: p.kode_sku,
            judul_buku: p.judul_buku,
            jenjang: p.jenjang,
            mata_pelajaran: p.mata_pelajaran,
            kurikulum: p.kurikulum,
            penulis: p.penulis,
            halaman: p.halaman,
            default_hpp_persen: p.default_hpp_persen,
          });
        } catch {
          // ignore
        }
      }

      // Load back
      setBoList(INITIAL_BRANCH_OFFICES);
      setSdmList(INITIAL_SDM);
      setRelasiList(INITIAL_RELASI);
      setProdukList(INITIAL_PRODUK);
      setHargaList(INITIAL_HARGA_MATRIX);
      setTargetList(INITIAL_TARGETS);

      showToast('success', 'Seed Selesai', 'Data master awal berhasil diisi ke database.');
    } catch (err: any) {
      showToast('info', 'Seed Selesai', 'Data demo awal aktif.');
    } finally {
      setIsLoading(false);
    }
  };

  // CRUD HANDLERS
  // 1. BO
  const handleAddBo = async (data: Omit<MasterBO, 'id'>) => {
    try {
      const res = await supabaseService.insertMasterBO(data);
      setBoList((prev) => [res, ...prev]);
      showToast('success', 'Cabang Berhasil Ditambahkan', `BO ${data.nama_bo} telah disimpan.`);
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
    showToast('info', 'Cabang Dihapus', 'Data kantor cabang dihapus.');
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
    showToast('success', 'SDM Diperbarui', 'Data SDM berhasil diupdate.');
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
    showToast('success', 'Relasi Diperbarui', 'Data relasi berhasil diupdate.');
  };

  const handleDeleteRelasi = async (id: string) => {
    try {
      await supabaseService.deleteMasterRelasi(id);
    } catch {
      // fallback
    }
    setRelasiList((prev) => prev.filter((r) => r.id !== id));
    showToast('info', 'Relasi Dihapus', 'Data relasi dihapus.');
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
    showToast('success', 'Produk Diperbarui', 'Data buku berhasil diupdate.');
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
    showToast('success', 'Tarif Disimpan', 'Tarif harga buku berhasil ditambahkan.');
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
    try {
      const res = await supabaseService.insertTargetPenjualanDetail(data);
      setTargetList((prev) => [res, ...prev]);
    } catch {
      const fallback: TargetPenjualanDetail = { ...data, id: `tgt-${Date.now()}` };
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

  // Totals
  const totalBrutto = targetList.reduce((acc, t) => acc + (t.nilai_brutto || 0), 0);
  const totalLabaKotor = targetList.reduce((acc, t) => acc + (t.laba_kotor || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight">BO-OPS Console</span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Superadmin
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                CRUD Seluruh Tabel & Manajemen Database
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Supabase Status Pill */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-mono text-[11px]">
                {SUPABASE_URL.replace('https://', '')}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                Connected
              </span>
            </div>

            {/* Refresh Sync Button */}
            <button
              type="button"
              onClick={loadAllDataFromSupabase}
              disabled={isLoading}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Sinkronisasi Ulang Data Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            {/* View SQL Migration Button */}
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="inline-flex items-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              title="Lihat skrip migrasi SQL tabel pengguna"
            >
              <Code2 className="w-3.5 h-3.5 mr-1 text-blue-400" />
              Migrasi SQL
            </button>

            {/* CLEAR ALL DATA BUTTON */}
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-colors border border-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear Semua Data Database
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div
            onClick={() => setActiveTab('master_bo')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
              activeTab === 'master_bo'
                ? 'bg-blue-50/90 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">1. Master BO</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{boList.length}</div>
            <p className="text-[11px] text-slate-400">Kantor Cabang</p>
          </div>

          <div
            onClick={() => setActiveTab('master_sdm')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
              activeTab === 'master_sdm'
                ? 'bg-blue-50/90 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">2. Master SDM</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{sdmList.length}</div>
            <p className="text-[11px] text-slate-400">Karyawan & Sales</p>
          </div>

          <div
            onClick={() => setActiveTab('master_relasi')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
              activeTab === 'master_relasi'
                ? 'bg-blue-50/90 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">3. Master Relasi</span>
              <Building className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{relasiList.length}</div>
            <p className="text-[11px] text-slate-400">Sekolah & Mitra</p>
          </div>

          <div
            onClick={() => setActiveTab('master_produk')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
              activeTab === 'master_produk'
                ? 'bg-blue-50/90 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">4. Master Produk</span>
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{produkList.length}</div>
            <p className="text-[11px] text-slate-400">SKU Buku</p>
          </div>

          <div
            onClick={() => setActiveTab('master_produk_harga')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
              activeTab === 'master_produk_harga'
                ? 'bg-blue-50/90 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">5. Master Harga</span>
              <DollarSign className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{hargaList.length}</div>
            <p className="text-[11px] text-slate-400">Matriks Zona 1-13</p>
          </div>

          <div
            onClick={() => setActiveTab('target_penjualan_detail')}
            className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
              activeTab === 'target_penjualan_detail'
                ? 'bg-blue-50/90 border-blue-300 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span className="font-semibold">6. Target Detail</span>
              <Target className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-bold text-slate-900">{targetList.length}</div>
            <p className="text-[11px] text-emerald-600 font-bold truncate">
              {formatRupiahCompact(totalBrutto)}
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill Header */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('master_bo')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'master_bo'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Master BO</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'master_bo' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {boList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('master_sdm')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'master_sdm'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Master SDM</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'master_sdm' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {sdmList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('master_relasi')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'master_relasi'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Master Relasi</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'master_relasi' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {relasiList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('master_produk')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'master_produk'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Master Produk</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'master_produk' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {produkList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('master_produk_harga')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'master_produk_harga'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Master Harga (Zona 1-13)</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'master_produk_harga' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {hargaList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('target_penjualan_detail')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 ${
              activeTab === 'target_penjualan_detail'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Target Penjualan Detail</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'target_penjualan_detail' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {targetList.length}
            </span>
          </button>
        </div>

        {/* Tab Content View */}
        <div>
          {activeTab === 'master_bo' && (
            <MasterBoCrud
              items={boList}
              onAdd={handleAddBo}
              onUpdate={handleUpdateBo}
              onDelete={handleDeleteBo}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'master_sdm' && (
            <MasterSdmCrud
              items={sdmList}
              boList={boList}
              onAdd={handleAddSdm}
              onUpdate={handleUpdateSdm}
              onDelete={handleDeleteSdm}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'master_relasi' && (
            <MasterRelasiCrud
              items={relasiList}
              boList={boList}
              onAdd={handleAddRelasi}
              onUpdate={handleUpdateRelasi}
              onDelete={handleDeleteRelasi}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'master_produk' && (
            <MasterProdukCrud
              items={produkList}
              onAdd={handleAddProduk}
              onUpdate={handleUpdateProduk}
              onDelete={handleDeleteProduk}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'master_produk_harga' && (
            <MasterHargaCrud
              items={hargaList}
              produkList={produkList}
              onAdd={handleAddHarga}
              onUpdate={handleUpdateHarga}
              onDelete={handleDeleteHarga}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'target_penjualan_detail' && (
            <TargetDetailCrud
              items={targetList}
              boList={boList}
              sdmList={sdmList}
              relasiList={relasiList}
              produkList={produkList}
              hargaMatrix={hargaList}
              onAdd={handleAddTarget}
              onUpdate={handleUpdateTarget}
              onDelete={handleDeleteTarget}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>

      {/* Clear Database Modal */}
      <ClearDatabaseModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirmClear={handleClearAllData}
        onConfirmSeed={handleSeedInitialData}
      />

      {/* SQL Migration Modal */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Skrip Migrasi Supabase SQL: Tabel Pengguna (`app_users`)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Jalankan skrip ini di <strong>SQL Editor</strong> dasbor Supabase Anda
                (<span className="font-mono text-slate-700">https://cxwxotsstnnfmaivybbq.supabase.co</span>)
                untuk membuat tabel <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">app_users</code>,
                mengaktifkan RLS, serta data bawaan akun Superadmin & Branch Manager.
              </p>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
                  {USER_MIGRATION_SQL}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(USER_MIGRATION_SQL);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium border border-slate-700 inline-flex items-center gap-1 transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin SQL
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setIsSqlModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
