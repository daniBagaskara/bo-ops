import React, { useState } from 'react';
import { MasterRelasi, MasterBO, JenisRelasi, JenjangPendidikan } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Building,
  Building2,
  X,
  Check,
  RefreshCw,
  Percent,
} from 'lucide-react';

interface MasterRelasiCrudProps {
  items: MasterRelasi[];
  boList: MasterBO[];
  onAdd: (data: Omit<MasterRelasi, 'id'>) => Promise<void>;
  onUpdate: (id: string, data: Partial<MasterRelasi>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isLoading: boolean;
}

const JENIS_RELASI_LIST: JenisRelasi[] = [
  'Sekolah',
  'K3S',
  'IGTKI',
  'MKKS',
  'Dinas Pendidikan',
  'Yayasan Pendidikan',
];

const JENJANG_LIST: JenjangPendidikan[] = [
  'PAUD/TK',
  'SD/MI',
  'SMP/MTs',
  'SMA/MA',
  'SMK',
  'Umum',
];

export const MasterRelasiCrud: React.FC<MasterRelasiCrudProps> = ({
  items,
  boList,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoFilter, setSelectedBoFilter] = useState('ALL');
  const [selectedJenisFilter, setSelectedJenisFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterRelasi | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [boId, setBoId] = useState('');
  const [kodeRelasi, setKodeRelasi] = useState('');
  const [namaRelasi, setNamaRelasi] = useState('');
  const [jenisRelasi, setJenisRelasi] = useState<JenisRelasi>('Sekolah');
  const [jenjang, setJenjang] = useState<JenjangPendidikan>('SD/MI');
  const [alamat, setAlamat] = useState('');
  const [kontakPerson, setKontakPerson] = useState('');
  const [noKontak, setNoKontak] = useState('');
  const [defaultRabatPersen, setDefaultRabatPersen] = useState<number>(20);

  const openAddModal = () => {
    setEditingItem(null);
    setBoId(boList[0]?.id || '');
    setKodeRelasi('');
    setNamaRelasi('');
    setJenisRelasi('Sekolah');
    setJenjang('SD/MI');
    setAlamat('');
    setKontakPerson('');
    setNoKontak('');
    setDefaultRabatPersen(20);
    setIsModalOpen(true);
  };

  const openEditModal = (item: MasterRelasi) => {
    setEditingItem(item);
    setBoId(item.bo_id);
    setKodeRelasi(item.kode_relasi);
    setNamaRelasi(item.nama_relasi);
    setJenisRelasi(item.jenis_relasi);
    setJenjang(item.jenjang);
    setAlamat(item.alamat || '');
    setKontakPerson(item.kontak_person || '');
    setNoKontak(item.no_kontak || '');
    setDefaultRabatPersen(item.default_rabat_persen);
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
          kode_relasi: kodeRelasi.trim().toUpperCase(),
          nama_relasi: namaRelasi.trim(),
          jenis_relasi: jenisRelasi,
          jenjang,
          alamat: alamat.trim(),
          kontak_person: kontakPerson.trim(),
          no_kontak: noKontak.trim(),
          default_rabat_persen: Number(defaultRabatPersen),
        });
      } else {
        await onAdd({
          bo_id: boId,
          kode_relasi: kodeRelasi.trim().toUpperCase(),
          nama_relasi: namaRelasi.trim(),
          jenis_relasi: jenisRelasi,
          jenjang,
          alamat: alamat.trim(),
          kontak_person: kontakPerson.trim(),
          no_kontak: noKontak.trim(),
          default_rabat_persen: Number(defaultRabatPersen),
        });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus data Mitra Relasi ini?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const filteredItems = items.filter((r) => {
    const matchesSearch =
      r.kode_relasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.nama_relasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.kontak_person && r.kontak_person.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBo = selectedBoFilter === 'ALL' || r.bo_id === selectedBoFilter;
    const matchesJenis = selectedJenisFilter === 'ALL' || r.jenis_relasi === selectedJenisFilter;
    return matchesSearch && matchesBo && matchesJenis;
  });

  const getBoName = (id: string) => {
    return boList.find((b) => b.id === id)?.nama_bo || id;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Master Relasi & Mitra Sekolah
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              {items.length} Relasi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabel <code className="text-slate-700 bg-slate-200/70 px-1 py-0.5 rounded font-mono">master_relasi</code>: Sekolah, K3S, MKKS, IGTKI, dan Dinas Pendidikan per Cabang.
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

          {/* Jenis Filter */}
          <select
            value={selectedJenisFilter}
            onChange={(e) => setSelectedJenisFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Jenis</option>
            {JENIS_RELASI_LIST.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama relasi, kode..."
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
            Tambah Relasi
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Kode Relasi</th>
              <th className="py-3 px-4">Nama Mitra / Sekolah</th>
              <th className="py-3 px-4">Jenis & Jenjang</th>
              <th className="py-3 px-4">Kantor Cabang (BO)</th>
              <th className="py-3 px-4">Kontak Person</th>
              <th className="py-3 px-4 text-center">Default Rabat</th>
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
                      <span>Memuat data relasi...</span>
                    </div>
                  ) : (
                    <div>
                      <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">Belum ada data relasi / sekolah.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tambahkan data sekolah atau mitra untuk alokasi target penjualan.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              filteredItems.map((rel) => (
                <tr key={rel.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">
                    {rel.kode_relasi}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{rel.nama_relasi}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{rel.alamat || '-'}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {rel.jenis_relasi}
                      </span>
                      <span className="inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                        {rel.jenjang}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="inline-flex items-center">
                      <Building2 className="w-3 h-3 mr-1 text-slate-400" />
                      {getBoName(rel.bo_id)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div>{rel.kontak_person || '-'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{rel.no_kontak || '-'}</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Percent className="w-2.5 h-2.5 mr-0.5" />
                      {rel.default_rabat_persen}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openEditModal(rel)}
                      className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit Relasi"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(rel.id)}
                      disabled={deletingId === rel.id}
                      className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                      title="Hapus Relasi"
                    >
                      {deletingId === rel.id ? (
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
                {editingItem ? 'Edit Data Mitra Relasi' : 'Tambah Mitra Relasi / Sekolah'}
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
                  Kantor Cabang (BO) Penaung <span className="text-rose-500">*</span>
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
                      {b.kode_bo} - {b.nama_bo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kode Relasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={kodeRelasi}
                    onChange={(e) => setKodeRelasi(e.target.value.toUpperCase())}
                    placeholder="Contoh: REL-SBY-001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Default Rabat (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.5"
                    value={defaultRabatPersen}
                    onChange={(e) => setDefaultRabatPersen(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Mitra Relasi / Nama Sekolah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaRelasi}
                  onChange={(e) => setNamaRelasi(e.target.value)}
                  placeholder="Contoh: SDN Rungkut Menanggal I / K3S Gubeng"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jenis Relasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={jenisRelasi}
                    onChange={(e) => setJenisRelasi(e.target.value as JenisRelasi)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {JENIS_RELASI_LIST.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kontak Person / PIC
                  </label>
                  <input
                    type="text"
                    value={kontakPerson}
                    onChange={(e) => setKontakPerson(e.target.value)}
                    placeholder="Drs. H. Sugeng, M.Pd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    No. Telepon / WA
                  </label>
                  <input
                    type="text"
                    value={noKontak}
                    onChange={(e) => setNoKontak(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Alamat Lengkap
                </label>
                <textarea
                  rows={2}
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Raya Rungkut No. 12..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  {editingItem ? 'Simpan Relasi' : 'Tambah Relasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
