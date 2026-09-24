import React, { useState } from 'react';
import { MasterBO } from '../../types';
import { ZONA_DESCRIPTIONS } from '../../utils/calculations';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';

interface MasterBoCrudProps {
  items: MasterBO[];
  onAdd: (data: Omit<MasterBO, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<MasterBO>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const MasterBoCrud: React.FC<MasterBoCrudProps> = ({
  items,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterBO | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [kodeBo, setKodeBo] = useState('');
  const [namaBo, setNamaBo] = useState('');
  const [zonaId, setZonaId] = useState<number>(1);
  const [wilayah, setWilayah] = useState('');
  const [alamat, setAlamat] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setKodeBo('');
    setNamaBo('');
    setZonaId(1);
    setWilayah('');
    setAlamat('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterBO) => {
    setEditingItem(item);
    setKodeBo(item.kode_bo);
    setNamaBo(item.nama_bo);
    setZonaId(item.zona_id);
    setWilayah(item.wilayah);
    setAlamat(item.alamat || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          kode_bo: kodeBo.trim().toUpperCase(),
          nama_bo: namaBo.trim(),
          zona_id: Number(zonaId),
          wilayah: wilayah.trim(),
          alamat: alamat.trim(),
        });
      } else {
        await onAdd({
          kode_bo: kodeBo.trim().toUpperCase(),
          nama_bo: namaBo.trim(),
          zona_id: Number(zonaId),
          wilayah: wilayah.trim(),
          alamat: alamat.trim(),
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus Kantor Cabang (BO) ini?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredItems = items.filter(
    (bo) =>
      bo.kode_bo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bo.nama_bo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bo.wilayah.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Master Branch Office (BO)
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              {items.length} Cabang
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabel <code className="text-slate-700 bg-slate-200/70 px-1 py-0.5 rounded font-mono">master_bo</code>: Kantor cabang penerbitan dan pemetaan zona logistik nasional (Zona 1-13).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode, nama, wilayah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah BO
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Kode BO</th>
              <th className="py-3 px-4">Nama Kantor Cabang</th>
              <th className="py-3 px-4">Zona Logistik</th>
              <th className="py-3 px-4">Wilayah Operasional</th>
              <th className="py-3 px-4">Alamat</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data dari Supabase...</span>
                    </div>
                  ) : (
                    <div>
                      <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">Belum ada data Kantor Cabang (BO).</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Klik tombol &quot;Tambah BO&quot; di atas untuk memasukkan data baru.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map((bo) => (
                <tr key={bo.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {bo.kode_bo}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {bo.nama_bo}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Zona {bo.zona_id}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800">
                    <span className="inline-flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                      {bo.wilayah}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={bo.alamat}>
                    {bo.alamat || '-'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(bo)}
                      className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit BO"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(bo.id)}
                      disabled={deletingId === bo.id}
                      className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                      title="Hapus BO"
                    >
                      {deletingId === bo.id ? (
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

      {/* Modal Add / Edit Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingItem ? 'Edit Master Branch Office' : 'Tambah Master Branch Office'}
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
                  Kode BO <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={kodeBo}
                  onChange={(e) => setKodeBo(e.target.value.toUpperCase())}
                  placeholder="Contoh: BO-SBY, BO-JKT"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Kantor Cabang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaBo}
                  onChange={(e) => setNamaBo(e.target.value)}
                  placeholder="Contoh: Branch Office Surabaya"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Zona Logistik (1-13) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={zonaId}
                    onChange={(e) => setZonaId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: 13 }, (_, i) => i + 1).map((z) => (
                      <option key={z} value={z}>
                        Zona {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Wilayah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={wilayah}
                    onChange={(e) => setWilayah(e.target.value)}
                    placeholder="Jawa Timur"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500 italic">
                  {ZONA_DESCRIPTIONS[zonaId] || `Zona ${zonaId}`}
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Alamat Kantor Cabang
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Rungkut Industri No. 45..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
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
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Cabang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
