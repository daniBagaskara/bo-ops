import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  Search,
  Globe2,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Building,
} from 'lucide-react';
import {
  formatRupiah,
  formatPercent,
  ZONA_DESCRIPTIONS,
} from '../utils/calculations';

export const ProdukHargaView: React.FC = () => {
  const {
    activeBO,
    activeYear,
    setActiveYear,
    produkList,
    getProductPrice,
  } = useApp();

  const [selectedZona, setSelectedZona] = useState<number>(activeBO?.zona_id || 2);
  const [search, setSearch] = useState('');
  const [jenjangFilter, setJenjangFilter] = useState('ALL');

  const filteredProducts = produkList.filter((p) => {
    if (jenjangFilter !== 'ALL' && p.jenjang !== jenjangFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.judul_buku.toLowerCase().includes(q) || p.kode_sku.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Matriks Skalabilitas Multi-Tahun & Multi-Zona</span>
            <span aria-hidden="true">·</span>
            <span>Zona 1 s.d. Zona 13 se-Indonesia</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Katalog Produk & Matriks Tarif Harga Zona
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Sesuai regulasi industri buku nasional, harga buku sekolah dibedakan ke dalam 13 zona geografis berdasarkan indeks biaya logistik distribusi kepulauan serta tahun anggaran berjalan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setActiveYear(2026)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeYear === 2026 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tahun Anggaran 2026
            </button>
            <button
              onClick={() => setActiveYear(2027)}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeYear === 2027 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tahun Anggaran 2027 (+5%)
            </button>
          </div>
        </div>
      </div>

      {/* Zona Selector Strip (Zona 1 - 13) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Globe2 className="w-4 h-4 text-blue-600" />
            <span>Pilih Zona Pengiriman & Distribusi (Zona 1 s.d. 13):</span>
          </div>
          {activeBO && (
            <span className="text-xs text-slate-500">
              Kantor Aktif: <strong>{activeBO.nama_bo}</strong> ada di{' '}
              <strong className="text-blue-700">Zona {activeBO.zona_id}</strong>
            </span>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {Array.from({ length: 13 }, (_, i) => i + 1).map((z) => {
            const isSelected = selectedZona === z;
            const isBoZona = activeBO?.zona_id === z;

            return (
              <button
                key={z}
                onClick={() => setSelectedZona(z)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-semibold transition-all shrink-0 flex flex-col items-center min-w-[68px] ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isBoZona
                    ? 'bg-blue-50 text-blue-900 border border-blue-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>ZONA {z}</span>
                <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {isBoZona ? '★ Cabang' : `x${(1 + (z - 1) * 0.05).toFixed(2)}`}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-900">Cakupan Wilayah Zona {selectedZona}: </span>
            <span className="text-slate-600">{ZONA_DESCRIPTIONS[selectedZona]}</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Indeks Logistik Penggali: <strong>{(1 + (selectedZona - 1) * 0.05).toFixed(2)}x dari Zona 1</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative min-w-[240px] flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari SKU atau judul buku..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={jenjangFilter}
            onChange={(e) => setJenjangFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Jenjang</option>
            <option value="PAUD/TK">PAUD / TK</option>
            <option value="SD/MI">SD / MI</option>
            <option value="SMP/MTs">SMP / MTs</option>
            <option value="SMA/MA">SMA / MA</option>
            <option value="SMK">SMK</option>
          </select>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Kode SKU</th>
                <th className="py-3 px-4">Judul Buku Edukasi</th>
                <th className="py-3 px-3">Jenjang</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3 text-right">Harga Zona 1 (Jawa)</th>
                <th className="py-3 px-4 text-right font-bold text-blue-900 bg-blue-50/40">
                  Harga Zona {selectedZona} (Terpilih)
                </th>
                <th className="py-3 px-3 text-right">Harga Zona 13 (Papua)</th>
                <th className="py-3 pr-4 text-right">Default HPP %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredProducts.map((p) => {
                const priceZ1 = getProductPrice(p.id, activeYear, 1);
                const priceSelected = getProductPrice(p.id, activeYear, selectedZona);
                const priceZ13 = getProductPrice(p.id, activeYear, 13);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{p.kode_sku}</td>
                    <td className="py-3 px-4 font-sans font-medium text-slate-900 max-w-[240px]">
                      {p.judul_buku}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                        {p.jenjang}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-500">{p.kurikulum}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatRupiah(priceZ1)}</td>
                    <td className="py-3 px-4 text-right font-bold text-blue-900 bg-blue-50/40">
                      {formatRupiah(priceSelected)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatRupiah(priceZ13)}</td>
                    <td className="py-3 pr-4 text-right text-slate-700 font-bold">
                      {formatPercent(p.default_hpp_persen)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
