import React, { useState } from 'react';
import { MasterSDM, MasterBO, JabatanSDM } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Building2,
  X,
  Check,
  RefreshCw,
  Phone,
  UserCheck,
  Tag,
} from 'lucide-react';

interface MasterSdmCrudProps {
  items: MasterSDM[];
  boList: MasterBO[];
  onAdd: (data: Omit<MasterSDM, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<MasterSDM>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

const JABATAN_OPTIONS: { value: JabatanSDM; label: string }[] = [
  { value: 'BM', label: 'Branch Manager (BM)' },
  { value: 'WBM', label: 'Wakil Branch Manager (WBM)' },
  { value: 'BA', label: 'Branch Admin (BA)' },
  { value: 'WH', label: 'Warehouse Staff (WH)' },
  { value: 'Pimpas', label: 'Pimpinan Pasar (Pimpas)' },
  { value: 'Korpos', label: 'Koordinator Pos (Korpos)' },
  { value: 'Sales', label: 'Sales Representative' },
];

export const MasterSdmCrud: React.FC<MasterSdmCrudProps> = ({
  items,
  boList,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoFilter, setSelectedBoFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterSDM | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [boId, setBoId] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState<JabatanSDM>('Sales');
  const [noHp, setNoHp] = useState('');
  const [wilayahKerja, setWilayahKerja] = useState('');
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const [kodePlaceholder, setKodePlaceholder] = useState('');
  const [statusAktif, setStatusAktif] = useState(true);

  const openAddModal = () => {
    setEditingItem(null);
    setBoId(boList[0]?.id || '');
    setNama('');
    setJabatan('Sales');
    setNoHp('-');
    setWilayahKerja('');
    setIsPlaceholder(false);
    setKodePlaceholder('');
    setStatusAktif(true);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterSDM) => {
    setEditingItem(item);
    setBoId(item.bo_id);
    setNama(item.nama);
    setJabatan(item.jabatan);
    setNoHp(item.no_hp || '-');
    setWilayahKerja(item.wilayah_kerja);
    setIsPlaceholder(item.is_placeholder);
    setKodePlaceholder(item.kode_placeholder || '');
    setStatusAktif(item.status_aktif);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boId) {
      alert('Pilih Branch Office terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate(editingItem.id, {
          bo_id: boId,
          nama: nama.trim(),
          jabatan,
          no_hp: noHp.trim() || '-',
          wilayah_kerja: wilayahKerja.trim(),
          is_placeholder: isPlaceholder,
          kode_placeholder: isPlaceholder ? kodePlaceholder.trim() : undefined,
          status_aktif: statusAktif,
        });
      } else {
        await onAdd({
          bo_id: boId,
          nama: nama.trim(),
          jabatan,
          no_hp: noHp.trim() || '-',
          wilayah_kerja: wilayahKerja.trim(),
          is_placeholder: isPlaceholder,
          kode_placeholder: isPlaceholder ? kodePlaceholder.trim() : undefined,
          status_aktif: statusAktif,
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data SDM ini?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredItems = items.filter((s) => {
    const matchesSearch =
      s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.wilayah_kerja.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.kode_placeholder && s.kode_placeholder.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBo = selectedBoFilter === 'ALL' || s.bo_id === selectedBoFilter;
    return matchesSearch && matchesBo;
  });

  const getBoName = (id: string) => {
    return boList.find((b) => b.id === id)?.nama_bo || id;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Master SDM & Karyawan Cabang
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              {items.length} SDM
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabel <code className="text-slate-700 bg-slate-200/70 px-1 py-0.5 rounded font-mono">master_sdm</code>: Karyawan BO, Branch Manager, dan Sales Placeholder untuk gatekeeper rule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BO Filter */}
          <select
            value={selectedBoFilter}
            onChange={(e) => setSelectedBoFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Cabang (BO)</option>
            {boList.map((b) => (
              <option key={b.id} value={b.id}>
                {b.kode_bo} - {b.nama_bo}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari SDM, sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40 sm:w-48"
            />
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Tambah SDM
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Nama Lengkap</th>
              <th className="py-3 px-4">Jabatan</th>
              <th className="py-3 px-4">Kantor Cabang (BO)</th>
              <th className="py-3 px-4">Wilayah Kerja</th>
              <th className="py-3 px-4">No. HP</th>
              <th className="py-3 px-4 text-center">Status</th>
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
                      <span>Memuat data SDM...</span>
                    </div>
                  ) : (
                    <div>
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">Belum ada data SDM.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tambahkan SDM agar aturan gatekeeper target terpenuhi.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map((sdm) => (
                <tr key={sdm.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="font-semibold text-slate-900">{sdm.nama}</div>
                      {sdm.is_placeholder && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <Tag className="w-2.5 h-2.5 mr-0.5" />
                          Placeholder ({sdm.kode_placeholder || 'SR'})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        sdm.jabatan === 'BM'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : sdm.jabatan === 'Sales'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}
                    >
                      {sdm.jabatan}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="inline-flex items-center">
                      <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                      {getBoName(sdm.bo_id)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{sdm.wilayah_kerja}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    <span className="inline-flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-slate-400" />
                      {sdm.no_hp || '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        sdm.status_aktif
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {sdm.status_aktif ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(sdm)}
                      className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit SDM"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sdm.id)}
                      disabled={deletingId === sdm.id}
                      className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                      title="Hapus SDM"
                    >
                      {deletingId === sdm.id ? (
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
                {editingItem ? 'Edit Data SDM' : 'Tambah SDM Cabang'}
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
                  Penugasan Branch Office (BO) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={boId}
                  onChange={(e) => setBoId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="" disabled>Pilih Kantor Cabang</option>
                  {boList.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.kode_bo} - {b.nama_bo} (Zona {b.zona_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Lengkap SDM <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Ahmad Fauzi, S.Pd. atau SRBaru01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jabatan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value as JabatanSDM)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {JABATAN_OPTIONS.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Wilayah Kerja Operasional <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={wilayahKerja}
                  onChange={(e) => setWilayahKerja(e.target.value)}
                  placeholder="Contoh: Surabaya Selatan & Rungkut"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Placeholder configuration */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPlaceholder}
                    onChange={(e) => setIsPlaceholder(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">
                    Tandai sebagai Sales Placeholder (Proyeksi Rekrutmen)
                  </span>
                </label>

                {isPlaceholder && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Kode Placeholder (e.g. SRBaru01, SRDSTB01)
                    </label>
                    <input
                      type="text"
                      value={kodePlaceholder}
                      onChange={(e) => setKodePlaceholder(e.target.value.toUpperCase())}
                      placeholder="SRBaru01"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktif"
                  checked={statusAktif}
                  onChange={(e) => setStatusAktif(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="statusAktif" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Status SDM Aktif
                </label>
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
                  {editingItem ? 'Simpan SDM' : 'Tambah SDM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
