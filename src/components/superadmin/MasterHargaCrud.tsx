import React, { useState } from 'react';
import { MasterProdukHarga, MasterProduk } from '../../types';
import { formatRupiah, ZONA_DESCRIPTIONS } from '../../utils/calculations';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  DollarSign,
  X,
  Check,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

interface MasterHargaCrudProps {
  items: MasterProdukHarga[];
  produkList: MasterProduk[];
  onAdd: (data: Omit<MasterProdukHarga, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<MasterProdukHarga>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const MasterHargaCrud: React.FC<MasterHargaCrudProps> = ({
  items,
  produkList,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTahunFilter, setSelectedTahunFilter] = useState('ALL');
  const [selectedZonaFilter, setSelectedZonaFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterProdukHarga | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [produkId, setProdukId] = useState('');
  const [tahunAnggaran, setTahunAnggaran] = useState<number>(2026);
  const [zonaId, setZonaId] = useState<number>(1);
  const [hargaSatuan, setHargaSatuan] = useState<number>(75000);

  const openAddModal = () => {
    setEditingItem(null);
    setProdukId(produkList[0]?.id || '');
    setTahunAnggaran(2026);
    setZonaId(1);
    setHargaSatuan(75000);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterProdukHarga) => {
    setEditingItem(item);
    setProdukId(item.produk_id);
    setTahunAnggaran(item.tahun_anggaran);
    setZonaId(item.zona_id);
    setHargaSatuan(item.harga_satuan);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produkId) {
      alert('Pilih produk buku terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          produk_id: produkId,
          tahun_anggaran: Number(tahunAnggaran),
          zona_id: Number(zonaId),
          harga_satuan: Number(hargaSatuan),
        });
      } else {
        await onAdd({
          produk_id: produkId,
          tahun_anggaran: Number(tahunAnggaran),
          zona_id: Number(zonaId),
          harga_satuan: Number(hargaSatuan),
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus tarif harga ini?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getProductInfo = (pId: string) => {
    return produkList.find((p) => p.id === pId);
  };

  const filteredItems = items.filter((h) => {
    const prod = getProductInfo(h.produk_id);
    const matchesSearch =
      !searchTerm ||
      (prod && prod.judul_buku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod && prod.kode_sku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTahun =
      selectedTahunFilter === 'ALL' || h.tahun_anggaran.toString() === selectedTahunFilter;
    const matchesZona =
      selectedZonaFilter === 'ALL' || h.zona_id.toString() === selectedZonaFilter;

    return matchesSearch && matchesTahun && matchesZona;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Master Matriks Harga (Multi-Tahun & Multi-Zona 1-13)
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              {items.length} Tarif
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabel <code className="text-slate-700 bg-slate-200/70 px-1 py-0.5 rounded font-mono">master_produk_harga</code>: Matriks harga jual resmi per SKU, tahun anggaran, dan zona logistik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tahun Filter */}
          <select
            value={selectedTahunFilter}
            onChange={(e) => setSelectedTahunFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Tahun</option>
            <option value="2025">TA 2025</option>
            <option value="2026">TA 2026</option>
            <option value="2027">TA 2027</option>
          </select>

          {/* Zona Filter */}
          <select
            value={selectedZonaFilter}
            onChange={(e) => setSelectedZonaFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Zona (1-13)</option>
            {Array.from({ length: 13 }, (_, i) => i + 1).map((z) => (
              <option key={z} value={z.toString()}>
                Zona {z}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk / SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-36 sm:w-44"
            />
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah Tarif
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Produk Buku (SKU)</th>
              <th className="py-3 px-4">Tahun Anggaran</th>
              <th className="py-3 px-4">Zona Logistik</th>
              <th className="py-3 px-4 text-right">Harga Satuan Resmi</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat tarif harga...</span>
                    </div>
                  ) : (
                    <div>
                      <DollarSign className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">Belum ada data matriks harga.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tambahkan harga buku per zona untuk kalkulasi alokasi target.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const prod = getProductInfo(item.produk_id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {prod ? prod.judul_buku : 'ID: ' + item.produk_id}
                          </div>
                          <div className="text-[11px] font-mono text-blue-600">
                            {prod ? prod.kode_sku : '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      TA {item.tahun_anggaran}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Zona {item.zona_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatRupiah(item.harga_satuan)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Tarif"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                        title="Hapus Tarif"
                      >
                        {deletingId === item.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Matriks Tarif Harga' : 'Tambah Tarif Harga Produk'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Pilih Produk Buku <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={produkId}
                  onChange={(e) => setProdukId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="" disabled>Pilih Produk</option>
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode_sku} - {p.judul_buku} ({p.jenjang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tahun Anggaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="2024"
                    max="2035"
                    value={tahunAnggaran}
                    onChange={(e) => setTahunAnggaran(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Zona Logistik (1-13) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={zonaId}
                    onChange={(e) => setZonaId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: 13 }, (_, i) => i + 1).map((z) => (
                      <option key={z} value={z}>
                        Zona {z}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 italic">
                  {ZONA_DESCRIPTIONS[zonaId] || `Zona ${zonaId}`}
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Harga Satuan Resmi (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="500"
                    value={hargaSatuan}
                    onChange={(e) => setHargaSatuan(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {editingItem ? 'Simpan Tarif' : 'Tambah Tarif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
