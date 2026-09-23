import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MasterRelasi, JenisRelasi, JenjangPendidikan } from '../types';
import {
  Building,
  Plus,
  Trash2,
  Edit2,
  X,
  MapPin,
  Phone,
  Search,
  School,
  GraduationCap,
} from 'lucide-react';
import { formatPercent } from '../utils/calculations';

export const RelasiManagementView: React.FC = () => {
  const { activeBO, relasiList, addRelasi, updateRelasi, deleteRelasi } = useApp();

  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelasi, setEditingRelasi] = useState<MasterRelasi | null>(null);

  // Form states
  const [kodeRelasi, setKodeRelasi] = useState('');
  const [namaRelasi, setNamaRelasi] = useState('');
  const [jenisRelasi, setJenisRelasi] = useState<JenisRelasi>('Sekolah');
  const [jenjang, setJenjang] = useState<JenjangPendidikan>('SD/MI');
  const [alamat, setAlamat] = useState('');
  const [kontakPerson, setKontakPerson] = useState('');
  const [noKontak, setNoKontak] = useState('');
  const [defaultRabat, setDefaultRabat] = useState(20);

  const currentRelasi = useMemo(() => {
    if (!activeBO) return [];
    return relasiList.filter((r) => r.bo_id === activeBO.id);
  }, [relasiList, activeBO]);

  const filtered = useMemo(() => {
    return currentRelasi.filter((r) => {
      if (filterJenis !== 'ALL' && r.jenis_relasi !== filterJenis) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        return (
          r.nama_relasi.toLowerCase().includes(query) ||
          r.kode_relasi.toLowerCase().includes(query) ||
          r.alamat.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [currentRelasi, filterJenis, search]);

  const handleOpenAdd = () => {
    setKodeRelasi(`REL-${Date.now().toString().slice(-4)}`);
    setNamaRelasi('');
    setJenisRelasi('Sekolah');
    setJenjang('SD/MI');
    setAlamat('');
    setKontakPerson('');
    setNoKontak('');
    setDefaultRabat(20);
    setIsModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBO || !namaRelasi.trim()) return;

    addRelasi({
      bo_id: activeBO.id,
      kode_relasi: kodeRelasi.trim() || `REL-${Date.now().toString().slice(-4)}`,
      nama_relasi: namaRelasi.trim(),
      jenis_relasi: jenisRelasi,
      jenjang: jenjang,
      alamat: alamat.trim() || 'Alamat institusi mitra',
      kontak_person: kontakPerson.trim() || 'PIC Pengadaan',
      no_kontak: noKontak.trim() || '-',
      default_rabat_persen: Number(defaultRabat) || 20,
    });

    setIsModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRelasi) return;

    updateRelasi(editingRelasi.id, {
      nama_relasi: editingRelasi.nama_relasi,
      jenis_relasi: editingRelasi.jenis_relasi,
      jenjang: editingRelasi.jenjang,
      alamat: editingRelasi.alamat,
      kontak_person: editingRelasi.kontak_person,
      no_kontak: editingRelasi.no_kontak,
      default_rabat_persen: editingRelasi.default_rabat_persen,
    });

    setEditingRelasi(null);
  };

  if (!activeBO) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500">
            Hierarki Level 2: Institusi & Organisasi Pendidikan
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Mitra Relasi Edukasi ({activeBO.nama_bo})
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Kelola data Sekolah, K3S (Kelompok Kerja Kepala Sekolah), IGTKI (Ikatan Guru TK Indonesia), MKKS, dan Yayasan Pendidikan.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Mitra Relasi Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama sekolah, K3S, atau IGTKI..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Jenis Relasi</option>
            <option value="Sekolah">Sekolah</option>
            <option value="K3S">K3S</option>
            <option value="IGTKI">IGTKI</option>
            <option value="MKKS">MKKS</option>
            <option value="Dinas Pendidikan">Dinas Pendidikan</option>
          </select>
        </div>
      </div>

      {/* Relasi Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
            Tidak ada data mitra relasi yang terdaftar atau cocok dengan pencarian.
          </div>
        ) : (
          filtered.map((rel) => {
            return (
              <div
                key={rel.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-slate-500 font-medium">{rel.kode_relasi}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {rel.jenis_relasi}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1">
                    {rel.nama_relasi}
                  </h3>

                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Jenjang: <strong>{rel.jenjang}</strong></span>
                  </div>

                  <div className="text-xs text-slate-500 mt-1 flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{rel.alamat}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Kontak PIC:</span>
                      <span className="font-medium text-slate-900 truncate max-w-[160px]">
                        {rel.kontak_person || '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>No. Telp / WA:</span>
                      <span className="font-mono text-slate-800">{rel.no_kontak || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Default % Rabat:</span>
                      <span className="font-mono font-bold text-amber-700">
                        {formatPercent(rel.default_rabat_persen)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => setEditingRelasi(rel)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded transition-colors"
                    title="Edit Relasi"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus ${rel.nama_relasi}?`)) {
                        deleteRelasi(rel.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Hapus Relasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: TAMBAH RELASI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Pendaftaran Mitra Relasi Baru — {activeBO.nama_bo}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kode Relasi</label>
                  <input
                    type="text"
                    value={kodeRelasi}
                    onChange={(e) => setKodeRelasi(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Nama Institusi / Lembaga</label>
                  <input
                    type="text"
                    value={namaRelasi}
                    onChange={(e) => setNamaRelasi(e.target.value)}
                    placeholder="Contoh: SD Negeri 5 Rungkut"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jenis Relasi</label>
                  <select
                    value={jenisRelasi}
                    onChange={(e) => setJenisRelasi(e.target.value as JenisRelasi)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Sekolah">Sekolah</option>
                    <option value="K3S">K3S</option>
                    <option value="IGTKI">IGTKI</option>
                    <option value="MKKS">MKKS</option>
                    <option value="Dinas Pendidikan">Dinas Pendidikan</option>
                    <option value="Yayasan Pendidikan">Yayasan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jenjang</label>
                  <select
                    value={jenjang}
                    onChange={(e) => setJenjang(e.target.value as JenjangPendidikan)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="PAUD/TK">PAUD/TK</option>
                    <option value="SD/MI">SD/MI</option>
                    <option value="SMP/MTs">SMP/MTs</option>
                    <option value="SMA/MA">SMA/MA</option>
                    <option value="SMK">SMK</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Default Rabat %</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={defaultRabat}
                    onChange={(e) => setDefaultRabat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Alamat Institusi</label>
                <input
                  type="text"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  placeholder="Jl. Raya ..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Kontak Person (PIC)</label>
                  <input
                    type="text"
                    value={kontakPerson}
                    onChange={(e) => setKontakPerson(e.target.value)}
                    placeholder="Nama Kepala Sekolah / Ketua"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">No. HP / Kontak</label>
                  <input
                    type="text"
                    value={noKontak}
                    onChange={(e) => setNoKontak(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs"
                >
                  Simpan Relasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT RELASI */}
      {editingRelasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Ubah Data Mitra Relasi</h3>
              <button onClick={() => setEditingRelasi(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Institusi</label>
                <input
                  type="text"
                  value={editingRelasi.nama_relasi}
                  onChange={(e) => setEditingRelasi({ ...editingRelasi, nama_relasi: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jenis Relasi</label>
                  <select
                    value={editingRelasi.jenis_relasi}
                    onChange={(e) => setEditingRelasi({ ...editingRelasi, jenis_relasi: e.target.value as JenisRelasi })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Sekolah">Sekolah</option>
                    <option value="K3S">K3S</option>
                    <option value="IGTKI">IGTKI</option>
                    <option value="MKKS">MKKS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jenjang</label>
                  <select
                    value={editingRelasi.jenjang}
                    onChange={(e) => setEditingRelasi({ ...editingRelasi, jenjang: e.target.value as JenjangPendidikan })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                  >
                    <option value="PAUD/TK">PAUD/TK</option>
                    <option value="SD/MI">SD/MI</option>
                    <option value="SMP/MTs">SMP/MTs</option>
                    <option value="SMA/MA">SMA/MA</option>
                    <option value="SMK">SMK</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Default Rabat %</label>
                  <input
                    type="number"
                    value={editingRelasi.default_rabat_persen}
                    onChange={(e) =>
                      setEditingRelasi({
                        ...editingRelasi,
                        default_rabat_persen: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Alamat Institusi</label>
                <input
                  type="text"
                  value={editingRelasi.alamat}
                  onChange={(e) => setEditingRelasi({ ...editingRelasi, alamat: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kontak Person</label>
                  <input
                    type="text"
                    value={editingRelasi.kontak_person}
                    onChange={(e) => setEditingRelasi({ ...editingRelasi, kontak_person: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">No. Kontak</label>
                  <input
                    type="text"
                    value={editingRelasi.no_kontak}
                    onChange={(e) => setEditingRelasi({ ...editingRelasi, no_kontak: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRelasi(null)}
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
