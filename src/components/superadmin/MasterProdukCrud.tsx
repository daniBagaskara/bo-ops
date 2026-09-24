import React, { useState } from 'react';
import { MasterProduk, JenjangPendidikan } from '../../types';
import { ImportDataModal } from '../modals/ImportDataModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  X,
  Check,
  RefreshCw,
  Percent,
  Upload,
} from 'lucide-react';

interface MasterProdukCrudProps {
  items: MasterProduk[];
  onAdd: (data: Omit<MasterProduk, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<MasterProduk>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
  isLoading: boolean;
}

const JENJANG_LIST: JenjangPendidikan[] = [
  'PAUD/TK',
  'SD/MI',
  'SMP/MTs',
  'SMA/MA',
  'SMK',
  'Umum',
];

export const MasterProdukCrud: React.FC<MasterProdukCrudProps> = ({
  items,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJenjangFilter, setSelectedJenjangFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterProduk | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [kodeSku, setKodeSku] = useState('');
  const [judulBuku, setJudulBuku] = useState('');
  const [jenjang, setJenjang] = useState<JenjangPendidikan>('SD/MI');
  const [mataPelajaran, setMataPelajaran] = useState('');
  const [kurikulum, setKurikulum] = useState('Kurikulum Merdeka');
  const [penulis, setPenulis] = useState('');
  const [halaman, setHalaman] = useState<number>(160);
  const [defaultHppPersen, setDefaultHppPersen] = useState<number>(35);

  const openAddModal = () => {
    setEditingItem(null);
    setKodeSku('');
    setJudulBuku('');
    setJenjang('SD/MI');
    setMataPelajaran('');
    setKurikulum('Kurikulum Merdeka');
    setPenulis('');
    setHalaman(160);
    setDefaultHppPersen(35);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterProduk) => {
    setEditingItem(item);
    setKodeSku(item.kode_sku);
    setJudulBuku(item.judul_buku);
    setJenjang(item.jenjang);
    setMataPelajaran(item.mata_pelajaran);
    setKurikulum(item.kurikulum);
    setPenulis(item.penulis || '');
    setHalaman(item.halaman || 160);
    setDefaultHppPersen(item.default_hpp_persen);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          kode_sku: kodeSku.trim().toUpperCase(),
          judul_buku: judulBuku.trim(),
          jenjang,
          mata_pelajaran: mataPelajaran.trim(),
          kurikulum: kurikulum.trim(),
          penulis: penulis.trim(),
          halaman: Number(halaman),
          default_hpp_persen: Number(defaultHppPersen),
        });
      } else {
        await onAdd({
          kode_sku: kodeSku.trim().toUpperCase(),
          judul_buku: judulBuku.trim(),
          jenjang,
          mata_pelajaran: mataPelajaran.trim(),
          kurikulum: kurikulum.trim(),
          penulis: penulis.trim(),
          halaman: Number(halaman),
          default_hpp_persen: Number(defaultHppPersen),
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus Produk Buku ini?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredItems = items.filter((p) => {
    const matchesSearch =
      p.kode_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.judul_buku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.mata_pelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.penulis && p.penulis.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesJenjang = selectedJenjangFilter === 'ALL' || p.jenjang === selectedJenjangFilter;
    return matchesSearch && matchesJenjang;
  });

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Master Produk Buku (Katalog Edukasi)
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              {items.length} Produk
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabel <code className="text-slate-700 bg-slate-200/70 px-1 py-0.5 rounded font-mono">master_produk</code>: Buku Kurikulum Merdeka, jenjang pendidikan, dan parameter persentase HPP.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Jenjang Filter */}
          <select
            value={selectedJenjangFilter}
            onChange={(e) => setSelectedJenjangFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Jenjang</option>
            {JENJANG_LIST.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SKU, judul, mapel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Impor
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Kode SKU</th>
              <th className="py-3 px-4">Judul Buku Edukasi</th>
              <th className="py-3 px-4">Jenjang & Mapel</th>
              <th className="py-3 px-4">Kurikulum</th>
              <th className="py-3 px-4">Penulis & Hal.</th>
              <th className="py-3 px-4 text-center">Default HPP</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat katalog produk...</span>
                    </div>
                  ) : (
                    <div>
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">Belum ada data produk buku.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tambahkan produk buku kurikulum merdeka untuk disetting harganya.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {prod.kode_sku}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{prod.judul_buku}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {prod.jenjang}
                      </span>
                      <div className="text-[11px] text-slate-600 font-medium">{prod.mata_pelajaran}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {prod.kurikulum}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{prod.penulis || '-'}</div>
                    <div className="text-[11px] text-slate-400">{prod.halaman} Halaman</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Percent className="w-2.5 h-2.5 mr-0.5" />
                      {prod.default_hpp_persen}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(prod.id)}
                      disabled={deletingId === prod.id}
                      className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                      title="Hapus Produk"
                    >
                      {deletingId === prod.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))
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
                {editingItem ? 'Edit Metadata Produk Buku' : 'Tambah Master Produk Buku'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kode SKU <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kodeSku}
                    onChange={(e) => setKodeSku(e.target.value.toUpperCase())}
                    placeholder="Contoh: SKU-KM-SD01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jenjang <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jenjang}
                    onChange={(e) => setJenjang(e.target.value as JenjangPendidikan)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {JENJANG_LIST.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Judul Buku Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={judulBuku}
                  onChange={(e) => setJudulBuku(e.target.value)}
                  placeholder="Contoh: Buku Siswa Matematika Kelas 1 SD"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={mataPelajaran}
                    onChange={(e) => setMataPelajaran(e.target.value)}
                    placeholder="Matematika, IPA, IPAS"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kurikulum <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kurikulum}
                    onChange={(e) => setKurikulum(e.target.value)}
                    placeholder="Kurikulum Merdeka"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-medium text-slate-700 mb-1">
                    Penulis
                  </label>
                  <input
                    type="text"
                    value={penulis}
                    onChange={(e) => setPenulis(e.target.value)}
                    placeholder="Tim Penulis"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-medium text-slate-700 mb-1">
                    Halaman
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={halaman}
                    onChange={(e) => setHalaman(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block font-medium text-slate-700 mb-1">
                    HPP (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultHppPersen}
                    onChange={(e) => setDefaultHppPersen(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
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
                  {editingItem ? 'Simpan Produk' : 'Tambah Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        tableType="master_produk"
        onImportSuccess={() => {
          onRefresh?.();
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
};
