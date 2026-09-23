import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TargetPenjualanDetail } from '../types';
import {
  Search,
  Filter,
  Download,
  PlusCircle,
  Trash2,
  Edit2,
  X,
  Check,
  Building,
  Layers,
  Sparkles,
} from 'lucide-react';
import { formatRupiah, formatNumber, formatPercent } from '../utils/calculations';

interface Props {
  onOpenTargetWizard: () => void;
}

export const TargetListView: React.FC<Props> = ({ onOpenTargetWizard }) => {
  const {
    activeBO,
    activeYear,
    targetList,
    sdmList,
    relasiList,
    produkList,
    deleteTargetDetail,
    updateTargetDetail,
    canInputTarget,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [salesFilter, setSalesFilter] = useState('ALL');
  const [relasiFilter, setRelasiFilter] = useState('ALL');
  const [editingTarget, setEditingTarget] = useState<TargetPenjualanDetail | null>(null);

  // Targets for this BO & Year
  const currentTargets = useMemo(() => {
    if (!activeBO) return [];
    return targetList.filter((t) => t.bo_id === activeBO.id && t.tahun_anggaran === activeYear);
  }, [targetList, activeBO, activeYear]);

  // Filtered targets
  const filteredTargets = useMemo(() => {
    return currentTargets.filter((t) => {
      const sdm = sdmList.find((s) => s.id === t.sdm_id);
      const rel = relasiList.find((r) => r.id === t.relasi_id);
      const prod = produkList.find((p) => p.id === t.produk_id);

      if (salesFilter !== 'ALL' && t.sdm_id !== salesFilter) return false;
      if (relasiFilter !== 'ALL' && rel?.jenis_relasi !== relasiFilter) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const sdmMatch = sdm?.nama.toLowerCase().includes(query);
        const relMatch = rel?.nama_relasi.toLowerCase().includes(query);
        const prodMatch = prod?.judul_buku.toLowerCase().includes(query) || prod?.kode_sku.toLowerCase().includes(query);
        const catMatch = t.catatan?.toLowerCase().includes(query);
        return sdmMatch || relMatch || prodMatch || catMatch;
      }

      return true;
    });
  }, [currentTargets, salesFilter, relasiFilter, searchQuery, sdmList, relasiList, produkList]);

  // Total summary for filtered targets
  const summary = useMemo(() => {
    return filteredTargets.reduce(
      (acc, t) => {
        acc.qty += t.qty;
        acc.brutto += t.nilai_brutto;
        acc.rabat += t.nilai_rabat;
        acc.bsr += t.nilai_bsr;
        acc.netto += t.nilai_netto;
        acc.hpp += t.nilai_hpp;
        acc.labaKotor += t.laba_kotor;
        acc.tertimbang += t.nilai_tertimbang_brutto;
        return acc;
      },
      { qty: 0, brutto: 0, rabat: 0, bsr: 0, netto: 0, hpp: 0, labaKotor: 0, tertimbang: 0 }
    );
  }, [filteredTargets]);

  // CSV Exporter
  const handleExportCSV = () => {
    const headers = [
      'ID Target',
      'Tahun Anggaran',
      'Branch Office',
      'Zona',
      'Sales PIC',
      'Is Placeholder',
      'Mitra Relasi',
      'Jenis Relasi',
      'SKU Produk',
      'Judul Buku',
      'Harga Satuan Zona',
      'Qty Eksemplar',
      'Persen Keyakinan',
      'Persen Rabat',
      'Persen BSR',
      'Persen HPP',
      'Nilai Brutto',
      'Nominal Rabat',
      'Nominal BSR',
      'Nilai Netto',
      'Nominal HPP',
      'Laba Kotor',
      'Nilai Tertimbang',
      'Catatan',
    ];

    const rows = filteredTargets.map((t) => {
      const sdm = sdmList.find((s) => s.id === t.sdm_id);
      const rel = relasiList.find((r) => r.id === t.relasi_id);
      const prod = produkList.find((p) => p.id === t.produk_id);

      return [
        t.id,
        t.tahun_anggaran,
        activeBO?.nama_bo,
        t.zona_id,
        `"${sdm?.nama || ''}"`,
        sdm?.is_placeholder ? 'YES' : 'NO',
        `"${rel?.nama_relasi || ''}"`,
        rel?.jenis_relasi,
        prod?.kode_sku,
        `"${prod?.judul_buku || ''}"`,
        t.harga_satuan,
        t.qty,
        t.persen_keyakinan,
        t.persen_rabat,
        t.persen_bsr,
        t.persen_hpp,
        t.nilai_brutto,
        t.nilai_rabat,
        t.nilai_bsr,
        t.nilai_netto,
        t.nilai_hpp,
        t.laba_kotor,
        t.nilai_tertimbang_brutto,
        `"${t.catatan || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Target_Breakdown_${activeBO?.kode_bo}_TA${activeYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save Edit Target
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;
    updateTargetDetail(editingTarget.id, {
      qty: editingTarget.qty,
      persen_keyakinan: editingTarget.persen_keyakinan,
      persen_rabat: editingTarget.persen_rabat,
      persen_bsr: editingTarget.persen_bsr,
      persen_hpp: editingTarget.persen_hpp,
      catatan: editingTarget.catatan,
    });
    setEditingTarget(null);
  };

  if (!activeBO) return null;

  return (
    <div className="space-y-5">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Hierarki Penjualan Edukasi: Sales → Relasi → Produk (SKU)
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Breakdown & Spreadsheet Target Penjualan ({activeBO.nama_bo})
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
            title="Download data tabel ke format CSV / Microsoft Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={onOpenTargetWizard}
            disabled={!canInputTarget}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              canInputTarget
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Alokasi Target Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search box */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Sales, Relasi, SKU, atau Buku..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white text-xs text-slate-900"
            />
          </div>

          {/* Sales Filter */}
          <select
            value={salesFilter}
            onChange={(e) => setSalesFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Sales PIC (Termasuk Placeholder)</option>
            {sdmList
              .filter((s) => s.bo_id === activeBO.id)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama} {s.is_placeholder ? '(Placeholder)' : ''}
                </option>
              ))}
          </select>

          {/* Relasi Type Filter */}
          <select
            value={relasiFilter}
            onChange={(e) => setRelasiFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Jenis Relasi</option>
            <option value="Sekolah">Sekolah</option>
            <option value="K3S">K3S</option>
            <option value="IGTKI">IGTKI</option>
            <option value="MKKS">MKKS</option>
          </select>
        </div>

        <div className="text-slate-500 font-mono text-[11px] shrink-0">
          Menampilkan {filteredTargets.length} dari {currentTargets.length} entri target
        </div>
      </div>

      {/* Main Breakdown Spreadsheet Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3">Sales PIC (SDM)</th>
                <th className="py-3 px-3">Mitra Relasi</th>
                <th className="py-3 px-3">SKU & Judul Buku</th>
                <th className="py-3 px-3 text-right">Qty</th>
                <th className="py-3 px-3 text-right">Harga Z{activeBO.zona_id}</th>
                <th className="py-3 px-3 text-right font-bold text-slate-800">1. Nilai Brutto</th>
                <th className="py-3 px-3 text-right text-amber-700">2. Rabat</th>
                <th className="py-3 px-3 text-right text-amber-700">3. BSR</th>
                <th className="py-3 px-3 text-right font-bold text-blue-900">4. Nilai Netto</th>
                <th className="py-3 px-3 text-right text-slate-600">5. HPP</th>
                <th className="py-3 px-3 text-right font-bold text-emerald-800">6. Laba Kotor</th>
                <th className="py-3 px-2 text-center">% Yakin</th>
                <th className="py-3 px-3 text-right font-bold text-indigo-900">Nilai Tertimbang</th>
                <th className="py-3 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredTargets.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400 font-sans">
                    Tidak ada data target penjualan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTargets.map((tgt) => {
                  const sdm = sdmList.find((s) => s.id === tgt.sdm_id);
                  const rel = relasiList.find((r) => r.id === tgt.relasi_id);
                  const prod = produkList.find((p) => p.id === tgt.produk_id);

                  return (
                    <tr key={tgt.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Sales */}
                      <td className="py-3 px-3 font-sans max-w-[140px]">
                        <div className="font-semibold text-slate-900 truncate">{sdm?.nama || '-'}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {sdm?.is_placeholder ? 'Sales Placeholder' : sdm?.wilayah_kerja}
                        </div>
                      </td>

                      {/* Relasi */}
                      <td className="py-3 px-3 font-sans max-w-[150px]">
                        <div className="font-medium text-slate-800 truncate">{rel?.nama_relasi || '-'}</div>
                        <div className="text-[11px] text-slate-400">
                          {rel?.jenis_relasi} · {rel?.jenjang}
                        </div>
                      </td>

                      {/* Produk */}
                      <td className="py-3 px-3 font-sans max-w-[180px]">
                        <div className="font-medium text-slate-800 truncate leading-snug">
                          {prod?.judul_buku || tgt.produk_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SKU: {prod?.kode_sku}
                        </div>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-900">
                        {formatNumber(tgt.qty)}
                      </td>

                      {/* Harga Satuan */}
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatRupiah(tgt.harga_satuan)}
                      </td>

                      {/* Nilai Brutto */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatRupiah(tgt.nilai_brutto)}
                      </td>

                      {/* Rabat */}
                      <td className="py-3 px-3 text-right text-amber-700">
                        <div>{formatRupiah(tgt.nilai_rabat)}</div>
                        <div className="text-[10px] text-slate-400">({tgt.persen_rabat}%)</div>
                      </td>

                      {/* BSR */}
                      <td className="py-3 px-3 text-right text-amber-700">
                        <div>{formatRupiah(tgt.nilai_bsr)}</div>
                        <div className="text-[10px] text-slate-400">({tgt.persen_bsr}%)</div>
                      </td>

                      {/* Nilai Netto */}
                      <td className="py-3 px-3 text-right font-bold text-blue-900 bg-blue-50/20">
                        {formatRupiah(tgt.nilai_netto)}
                      </td>

                      {/* HPP */}
                      <td className="py-3 px-3 text-right text-slate-600">
                        <div>{formatRupiah(tgt.nilai_hpp)}</div>
                        <div className="text-[10px] text-slate-400">({tgt.persen_hpp}%)</div>
                      </td>

                      {/* Laba Kotor */}
                      <td className="py-3 px-3 text-right font-bold text-emerald-800 bg-emerald-50/20">
                        <div>{formatRupiah(tgt.laba_kotor)}</div>
                        <div className="text-[10px] text-emerald-600 font-sans">
                          {formatPercent(tgt.nilai_brutto > 0 ? (tgt.laba_kotor / tgt.nilai_brutto) * 100 : 0)}
                        </div>
                      </td>

                      {/* % Keyakinan */}
                      <td className="py-3 px-2 text-center">
                        <span className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-sans font-medium">
                          {tgt.persen_keyakinan}%
                        </span>
                      </td>

                      {/* Nilai Tertimbang */}
                      <td className="py-3 px-3 text-right font-bold text-indigo-900">
                        {formatRupiah(tgt.nilai_tertimbang_brutto)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 pr-4 text-center font-sans">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingTarget(tgt)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Edit Target"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Yakin ingin menghapus item target penjualan ini?')) {
                                deleteTargetDetail(tgt.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Hapus Target"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Table Footer with Summary */}
            {filteredTargets.length > 0 && (
              <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-mono font-bold text-slate-900 text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-3 font-sans">
                    TOTAL KESELURUHAN ({filteredTargets.length} Baris Target)
                  </td>
                  <td className="py-3 px-3 text-right">{formatNumber(summary.qty)}</td>
                  <td className="py-3 px-3 text-right text-slate-400">-</td>
                  <td className="py-3 px-3 text-right">{formatRupiah(summary.brutto)}</td>
                  <td className="py-3 px-3 text-right text-amber-700">{formatRupiah(summary.rabat)}</td>
                  <td className="py-3 px-3 text-right text-amber-700">{formatRupiah(summary.bsr)}</td>
                  <td className="py-3 px-3 text-right text-blue-900">{formatRupiah(summary.netto)}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{formatRupiah(summary.hpp)}</td>
                  <td className="py-3 px-3 text-right text-emerald-800">{formatRupiah(summary.labaKotor)}</td>
                  <td className="py-3 px-2 text-center text-slate-400">-</td>
                  <td className="py-3 px-3 text-right text-indigo-900">{formatRupiah(summary.tertimbang)}</td>
                  <td className="py-3 pr-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* QUICK INLINE EDIT MODAL */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Ubah Parameter Target Penjualan
              </h3>
              <button
                onClick={() => setEditingTarget(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kuantitas (Qty)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingTarget.qty}
                    onChange={(e) =>
                      setEditingTarget({
                        ...editingTarget,
                        qty: Math.max(1, parseInt(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">% Keyakinan</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editingTarget.persen_keyakinan}
                    onChange={(e) =>
                      setEditingTarget({
                        ...editingTarget,
                        persen_keyakinan: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)),
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">% Rabat Relasi</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={editingTarget.persen_rabat}
                    onChange={(e) =>
                      setEditingTarget({
                        ...editingTarget,
                        persen_rabat: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">% BSR</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={editingTarget.persen_bsr}
                    onChange={(e) =>
                      setEditingTarget({
                        ...editingTarget,
                        persen_bsr: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">% HPP</label>
                  <input
                    type="number"
                    step="0.5"
                    min="10"
                    max="60"
                    value={editingTarget.persen_hpp}
                    onChange={(e) =>
                      setEditingTarget({
                        ...editingTarget,
                        persen_hpp: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingTarget.catatan || ''}
                  onChange={(e) =>
                    setEditingTarget({
                      ...editingTarget,
                      catatan: e.target.value,
                    })
                  }
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTarget(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
