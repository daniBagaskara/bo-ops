import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Users,
  Building,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
  PlusCircle,
  FileCode,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  formatRupiah,
  formatRupiahCompact,
  formatPercent,
  formatNumber,
  ZONA_DESCRIPTIONS,
} from '../utils/calculations';
import { GatekeeperBanner } from './GatekeeperBanner';

interface Props {
  onOpenTargetWizard: () => void;
  onOpenSdmModal: () => void;
}

export const DashboardOverview: React.FC<Props> = ({ onOpenTargetWizard, onOpenSdmModal }) => {
  const {
    currentUser,
    activeBO,
    activeYear,
    targetList,
    sdmList,
    relasiList,
    produkList,
    setActiveTab,
    canInputTarget,
  } = useApp();

  // Targets filtered for current BO and current Year
  const currentTargets = useMemo(() => {
    if (!activeBO) return [];
    return targetList.filter((t) => t.bo_id === activeBO.id && t.tahun_anggaran === activeYear);
  }, [targetList, activeBO, activeYear]);

  // Aggregate Financial Calculations
  const totals = useMemo(() => {
    return currentTargets.reduce(
      (acc, t) => {
        acc.totalQty += t.qty;
        acc.totalBrutto += t.nilai_brutto;
        acc.totalRabat += t.nilai_rabat;
        acc.totalBsr += t.nilai_bsr;
        acc.totalNetto += t.nilai_netto;
        acc.totalHpp += t.nilai_hpp;
        acc.totalLabaKotor += t.laba_kotor;
        acc.totalTertimbang += t.nilai_tertimbang_brutto;
        return acc;
      },
      {
        totalQty: 0,
        totalBrutto: 0,
        totalRabat: 0,
        totalBsr: 0,
        totalNetto: 0,
        totalHpp: 0,
        totalLabaKotor: 0,
        totalTertimbang: 0,
      }
    );
  }, [currentTargets]);

  const effectiveMargin = totals.totalBrutto > 0 ? (totals.totalLabaKotor / totals.totalBrutto) * 100 : 0;
  const effectiveRabat = totals.totalBrutto > 0 ? (totals.totalRabat / totals.totalBrutto) * 100 : 0;
  const effectiveBsr = totals.totalBrutto > 0 ? (totals.totalBsr / totals.totalBrutto) * 100 : 0;
  const effectiveHpp = totals.totalBrutto > 0 ? (totals.totalHpp / totals.totalBrutto) * 100 : 0;

  // Breakdown by Sales
  const salesBreakdown = useMemo(() => {
    const map = new Map<string, { sdm: (typeof sdmList)[0] | undefined; brutto: number; qty: number; count: number }>();

    for (const t of currentTargets) {
      const existing = map.get(t.sdm_id) || {
        sdm: sdmList.find((s) => s.id === t.sdm_id),
        brutto: 0,
        qty: 0,
        count: 0,
      };
      existing.brutto += t.nilai_brutto;
      existing.qty += t.qty;
      existing.count += 1;
      map.set(t.sdm_id, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.brutto - a.brutto);
  }, [currentTargets, sdmList]);

  // Breakdown by Jenis Relasi
  const relasiBreakdown = useMemo(() => {
    const map = new Map<string, { jenis: string; brutto: number; count: number }>();

    for (const t of currentTargets) {
      const rel = relasiList.find((r) => r.id === t.relasi_id);
      const jenis = rel?.jenis_relasi || 'Lainnya';
      const existing = map.get(jenis) || { jenis, brutto: 0, count: 0 };
      existing.brutto += t.nilai_brutto;
      existing.count += 1;
      map.set(jenis, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.brutto - a.brutto);
  }, [currentTargets, relasiList]);

  // Breakdown by Jenjang
  const jenjangBreakdown = useMemo(() => {
    const map = new Map<string, { jenjang: string; brutto: number; qty: number }>();

    for (const t of currentTargets) {
      const prod = produkList.find((p) => p.id === t.produk_id);
      const jenjang = prod?.jenjang || 'Umum';
      const existing = map.get(jenjang) || { jenjang, brutto: 0, qty: 0 };
      existing.brutto += t.nilai_brutto;
      existing.qty += t.qty;
      map.set(jenjang, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.brutto - a.brutto);
  }, [currentTargets, produkList]);

  if (!activeBO) return null;

  return (
    <div className="space-y-6">
      {/* Context Kicker & Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Branch Office Monitoring</span>
            <span aria-hidden="true">·</span>
            <span>Tahun Anggaran {activeYear}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">{ZONA_DESCRIPTIONS[activeBO.zona_id]}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Dashboard Target & Alokasi Biaya — {activeBO.nama_bo}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('sql_migration')}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Skrip SQL Supabase</span>
          </button>

          <button
            onClick={onOpenTargetWizard}
            disabled={!canInputTarget}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
              canInputTarget
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Input Target Baru</span>
          </button>
        </div>
      </div>

      {/* Gatekeeper Rule Banner */}
      <GatekeeperBanner onOpenSdmModal={onOpenSdmModal} />

      {/* PRIMARY FINANCIAL KPI CARDS (Real-time Calculated) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Nilai Brutto */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">1. Total Nilai Brutto (Target)</span>
              <span className="font-mono text-slate-400">{formatNumber(totals.totalQty)} Eks</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-2 tracking-tight">
              {formatRupiah(totals.totalBrutto)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Nilai Tertimbang (% Keyakinan):</span>
            <span className="font-mono font-bold text-indigo-700">
              {formatRupiah(totals.totalTertimbang)}
            </span>
          </div>
        </div>

        {/* 2. Total Netto */}
        <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-blue-900 font-medium">
              <span>4. Nilai Netto (Pendapatan Cabang)</span>
              <span className="font-mono text-blue-700">
                {totals.totalBrutto > 0 ? formatPercent((totals.totalNetto / totals.totalBrutto) * 100) : '0%'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-950 mt-2 tracking-tight">
              {formatRupiah(totals.totalNetto)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs">
            <span className="text-blue-800">Dipotong Rabat & BSR:</span>
            <span className="font-mono font-bold text-blue-900">
              - {formatRupiah(totals.totalRabat + totals.totalBsr)}
            </span>
          </div>
        </div>

        {/* 3. Laba Kotor */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-900 font-medium">
              <span>6. Estimasi Laba Kotor (Gross Profit)</span>
              <span className="font-mono font-bold text-emerald-700">
                Margin: {formatPercent(effectiveMargin)}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-950 mt-2 tracking-tight">
              {formatRupiah(totals.totalLabaKotor)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs">
            <span className="text-emerald-800">Formula: Netto - HPP</span>
            <span className="font-mono font-bold text-emerald-900">
              {totals.totalLabaKotor > 0 ? 'Surplus Operasional' : 'Belum Ada Target'}
            </span>
          </div>
        </div>

        {/* 4. Rabat ke Relasi */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>2. Rabat ke Relasi (Nominal)</span>
            <span className="font-mono text-amber-700 font-semibold">{formatPercent(effectiveRabat)}</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1.5">
            {formatRupiah(totals.totalRabat)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Alokasi diskon resmi ke Sekolah & Organisasi Guru
          </div>
        </div>

        {/* 5. BSR (Biaya Sarana Relasi) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>3. Biaya Sarana Relasi (BSR)</span>
            <span className="font-mono text-amber-700 font-semibold">{formatPercent(effectiveBsr)}</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1.5">
            {formatRupiah(totals.totalBsr)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Alokasi sarana presentasi, sampel buku, & kemitraan
          </div>
        </div>

        {/* 6. HPP Nominal */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>5. Harga Pokok Produksi (HPP)</span>
            <span className="font-mono text-slate-600 font-semibold">{formatPercent(effectiveHpp)}</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1.5">
            {formatRupiah(totals.totalHpp)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Beban cetak & kertas pusat penerbitan
          </div>
        </div>
      </div>

      {/* MATHEMATICAL FORMULA EXPLAINER STRIP */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-slate-700 font-bold">
          <Info className="w-4 h-4 text-blue-600" />
          <span>Verifikasi Formula Finansial Real-Time (SOP Penerbitan):</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-600 font-mono text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">Nilai Netto:</span>
            <span>Brutto ({formatRupiahCompact(totals.totalBrutto)})</span>
            <span className="text-amber-700"> - Rabat ({formatRupiahCompact(totals.totalRabat)})</span>
            <span className="text-amber-700"> - BSR ({formatRupiahCompact(totals.totalBsr)})</span>
            <span className="block mt-1 font-bold text-blue-800">= {formatRupiah(totals.totalNetto)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">Laba Kotor:</span>
            <span>Netto ({formatRupiahCompact(totals.totalNetto)})</span>
            <span className="text-slate-600"> - HPP ({formatRupiahCompact(totals.totalHpp)})</span>
            <span className="block mt-1 font-bold text-emerald-800">= {formatRupiah(totals.totalLabaKotor)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">Penetapan Tarif Zona:</span>
            <span>Harga Satuan = Matriks Zona {activeBO.zona_id}</span>
            <span className="text-slate-500 block">Disesuaikan indeks logistik pulau & Tahun Anggaran</span>
          </div>
        </div>
      </div>

      {/* BREAKDOWN SECTION: SALES & RELASI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakdown by Sales Representative */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Alokasi Target per Sales Representative
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hierarki Level 1: Kontribusi target per personil sales & placeholder
                </p>
              </div>
              <button
                onClick={() => setActiveTab('sdm')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                Kelola SDM
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {salesBreakdown.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada target yang dialokasikan ke sales
              </div>
            ) : (
              <div className="space-y-3.5">
                {salesBreakdown.map((item, idx) => {
                  const percent = totals.totalBrutto > 0 ? (item.brutto / totals.totalBrutto) * 100 : 0;
                  const isPlaceholder = item.sdm?.is_placeholder;

                  return (
                    <div key={idx} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-semibold text-slate-800 truncate">
                            {item.sdm ? item.sdm.nama : 'Sales Tidak Diketahui'}
                          </span>
                          {isPlaceholder && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded font-medium shrink-0">
                              Placeholder
                            </span>
                          )}
                        </div>
                        <div className="font-mono font-bold text-slate-900 shrink-0 ml-2">
                          {formatRupiah(item.brutto)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPlaceholder ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, percent))}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 w-10 text-right shrink-0">
                          {formatPercent(percent)}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400">
                        {item.count} Alokasi SKU · {formatNumber(item.qty)} Eksemplar
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Breakdown by Jenis Relasi & Jenjang */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Target per Jenis Mitra Relasi Edukasi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hierarki Level 2: Portofolio Sekolah vs K3S vs IGTKI
                </p>
              </div>
              <button
                onClick={() => setActiveTab('relasi')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                Kelola Relasi
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {relasiBreakdown.map((item, idx) => {
                const percent = totals.totalBrutto > 0 ? (item.brutto / totals.totalBrutto) * 100 : 0;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="text-slate-500 text-[11px] font-medium">{item.jenis}</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {formatRupiahCompact(item.brutto)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                      <span>{item.count} Kontrak</span>
                      <span className="font-semibold text-blue-700">{formatPercent(percent)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Jenjang Segment breakdown */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                Distribusi per Jenjang Pendidikan:
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {jenjangBreakdown.map((j, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-slate-100 rounded-md text-slate-700 font-mono text-[11px]"
                  >
                    {j.jenjang}: <strong className="text-slate-900">{formatRupiahCompact(j.brutto)}</strong> ({formatNumber(j.qty)} eks)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK TARGET RECENT TABLE */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Target Aktif — {activeBO.nama_bo} ({currentTargets.length} Item)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tinjauan alokasi terkini dengan rincian brutto, rabat, BSR, netto, dan laba kotor
            </p>
          </div>

          <button
            onClick={() => setActiveTab('target_list')}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1"
          >
            Buka Spreadsheet Lengkap
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {currentTargets.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500">
            Belum ada target penjualan yang diinput untuk tahun anggaran {activeYear} di {activeBO.nama_bo}.
            <div className="mt-2">
              <button
                onClick={onOpenTargetWizard}
                disabled={!canInputTarget}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                + Mulai Input Target Pertama
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-medium uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 pr-3">Sales PIC</th>
                  <th className="py-2.5 px-3">Relasi (Institusi)</th>
                  <th className="py-2.5 px-3">Produk (SKU)</th>
                  <th className="py-2.5 px-3 text-right">Qty</th>
                  <th className="py-2.5 px-3 text-right">Harga Z{activeBO.zona_id}</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-700">Nilai Brutto</th>
                  <th className="py-2.5 px-3 text-right text-amber-700">Rabat</th>
                  <th className="py-2.5 px-3 text-right text-amber-700">BSR</th>
                  <th className="py-2.5 px-3 text-right font-bold text-blue-800">Nilai Netto</th>
                  <th className="py-2.5 px-3 text-right font-bold text-emerald-800">Laba Kotor</th>
                  <th className="py-2.5 pl-3 text-center">% Yakin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentTargets.slice(0, 6).map((tgt) => {
                  const sdm = sdmList.find((s) => s.id === tgt.sdm_id);
                  const rel = relasiList.find((r) => r.id === tgt.relasi_id);
                  const prod = produkList.find((p) => p.id === tgt.produk_id);

                  return (
                    <tr key={tgt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 pr-3 font-sans font-medium text-slate-900 max-w-[130px] truncate">
                        {sdm?.nama || '-'}
                        {sdm?.is_placeholder && (
                          <span className="block text-[10px] text-amber-700 font-normal">
                            [Placeholder]
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700 max-w-[140px] truncate">
                        {rel?.nama_relasi || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700 max-w-[160px] truncate">
                        {prod?.judul_buku || tgt.produk_id}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        {formatNumber(tgt.qty)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {formatRupiah(tgt.harga_satuan)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {formatRupiah(tgt.nilai_brutto)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700">
                        {formatRupiah(tgt.nilai_rabat)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-700">
                        {formatRupiah(tgt.nilai_bsr)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-blue-900">
                        {formatRupiah(tgt.nilai_netto)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {formatRupiah(tgt.laba_kotor)}
                      </td>
                      <td className="py-2.5 pl-3 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                          {tgt.persen_keyakinan}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
