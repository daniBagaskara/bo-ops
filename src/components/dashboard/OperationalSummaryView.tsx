import React from 'react';
import {
  UserProfile,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  TargetPenjualanDetail,
  AppNavKey,
} from '../../types';
import {
  Building2,
  Users,
  Building,
  BookOpen,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';

interface OperationalSummaryViewProps {
  currentUser: UserProfile;
  branchOffices: MasterBO[];
  sdmList: MasterSDM[];
  relasiList: MasterRelasi[];
  produkList: MasterProduk[];
  targetList: TargetPenjualanDetail[];
  onNavigate: (nav: AppNavKey) => void;
}

export const OperationalSummaryView: React.FC<OperationalSummaryViewProps> = ({
  currentUser,
  branchOffices,
  sdmList,
  relasiList,
  produkList,
  targetList,
  onNavigate,
}) => {
  const isSuperAdmin = currentUser.role === 'superadmin';

  // Branch Manager branch isolation
  const activeBo = isSuperAdmin
    ? null
    : branchOffices.find((b) => b.id === currentUser.assigned_bo_id) || branchOffices[0];

  // Filter data by branch if BM
  const displaySdm = isSuperAdmin
    ? sdmList
    : sdmList.filter((s) => s.bo_id === activeBo?.id);

  const displayRelasi = isSuperAdmin
    ? relasiList
    : relasiList.filter((r) => r.bo_id === activeBo?.id);

  const displayTargets = isSuperAdmin
    ? targetList
    : targetList.filter((t) => t.bo_id === activeBo?.id);

  // Financial aggregates
  const totalBrutto = displayTargets.reduce((acc, t) => acc + (t.nilai_brutto || 0), 0);
  const totalNetto = displayTargets.reduce((acc, t) => acc + (t.nilai_netto || 0), 0);
  const totalLabaKotor = displayTargets.reduce((acc, t) => acc + (t.laba_kotor || 0), 0);
  const totalTertimbang = displayTargets.reduce(
    (acc, t) => acc + (t.nilai_tertimbang_brutto || 0),
    0
  );
  const totalQty = displayTargets.reduce((acc, t) => acc + (t.qty || 0), 0);

  const formatIDR = (num: number) => {
    if (num >= 1_000_000_000) {
      return `Rp ${(num / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Milyar`;
    }
    if (num >= 1_000_000) {
      return `Rp ${(num / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Juta`;
    }
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            {isSuperAdmin
              ? 'Konsol Operasional Nasional'
              : `Operasional Cabang: ${activeBo?.nama_bo || 'Branch Office'}`}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Selamat Datang, {currentUser.nama}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            {isSuperAdmin
              ? 'Kelola alokasi target penjualan buku, jaringan cabang, tim sales, dan mitra sekolah secara terpusat dan terintegrasi.'
              : `Kelola dan pantau realisasi target penjualan buku dan kinerja tim sales untuk wilayah ${activeBo?.wilayah || 'cabang'}.`}
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('target_operasional')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
            >
              Buka Target Penjualan
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </button>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('manajemen_user')}
                className="inline-flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium border border-white/20 transition-all"
              >
                Kelola Akses Pengguna
              </button>
            )}
          </div>
        </div>

        {/* Decorative background watermark */}
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none hidden sm:block">
          <TrendingUp className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Nilai Brutto Target */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Target Brutto</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">{formatIDR(totalBrutto)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {displayTargets.length} alokasi penjualan ({totalQty.toLocaleString('id-ID')} eksemplar)
          </p>
        </div>

        {/* Card 2: Proyeksi Tertimbang */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Proyeksi Tertimbang</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">{formatIDR(totalTertimbang)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Disesuaikan dengan tingkat keyakinan sales
          </p>
        </div>

        {/* Card 3: Nilai Netto & Rabat */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Estimasi Nilai Netto</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-700">{formatIDR(totalNetto)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Potensi Laba Kotor: {formatIDR(totalLabaKotor)}
          </p>
        </div>

        {/* Card 4: Sumber Daya & Mitra */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">
              {isSuperAdmin ? 'Cakupan Nasional' : 'Kekuatan Cabang'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {displaySdm.length} <span className="text-xs font-normal text-slate-500">Personil</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {displayRelasi.length} Mitra Relasi & Sekolah binaan
          </p>
        </div>
      </div>

      {/* Operational Fast Links for Super Admin */}
      {isSuperAdmin && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Pusat Pengelolaan Data Master
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => onNavigate('master_bo')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <Building2 className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Master BO</div>
              <div className="text-[11px] text-slate-500">{branchOffices.length} Kantor Cabang</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('master_sdm')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <Users className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">SDM & Sales</div>
              <div className="text-[11px] text-slate-500">{sdmList.length} Personil</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('master_relasi')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <Building className="w-5 h-5 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Mitra Relasi</div>
              <div className="text-[11px] text-slate-500">{relasiList.length} Sekolah & Mitra</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('master_produk')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <BookOpen className="w-5 h-5 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Katalog Buku</div>
              <div className="text-[11px] text-slate-500">{produkList.length} Judul SKU</div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('target_operasional')}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group"
            >
              <Target className="w-5 h-5 text-rose-600 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">Target Detail</div>
              <div className="text-[11px] text-slate-500">{targetList.length} Target Aktif</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
