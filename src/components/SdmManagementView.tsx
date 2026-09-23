import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MasterSDM, JabatanSDM } from '../types';
import {
  Users,
  UserPlus,
  Sparkles,
  Trash2,
  Edit2,
  X,
  Check,
  UserCheck,
  Shield,
  HelpCircle,
  Phone,
  MapPin,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export const SdmManagementView: React.FC = () => {
  const {
    activeBO,
    activeBoSDM,
    addSDM,
    updateSDM,
    deleteSDM,
    convertPlaceholder,
    seedDemoSDMForBO,
  } = useApp();

  const [filterJabatan, setFilterJabatan] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPlaceholderModalOpen, setIsPlaceholderModalOpen] = useState(false);
  const [editingSdm, setEditingSdm] = useState<MasterSDM | null>(null);
  const [convertingSdm, setConvertingSdm] = useState<MasterSDM | null>(null);

  // Form states for Regular SDM
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState<JabatanSDM>('Sales');
  const [noHp, setNoHp] = useState('');
  const [wilayahKerja, setWilayahKerja] = useState('');

  // Form states for Placeholder
  const [kodePlaceholder, setKodePlaceholder] = useState('SRBaru01');
  const [wilayahPlaceholder, setWilayahPlaceholder] = useState('');

  // Form states for Convert Placeholder
  const [convertRealName, setConvertRealName] = useState('');
  const [convertNoHp, setConvertNoHp] = useState('');

  // Filtered list
  const filteredSdm = activeBoSDM.filter((s) => {
    if (filterJabatan === 'ALL') return true;
    if (filterJabatan === 'PLACEHOLDER') return s.is_placeholder;
    return s.jabatan === filterJabatan;
  });

  const handleCreateRegularSdm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBO || !nama.trim() || !wilayahKerja.trim()) return;

    addSDM({
      bo_id: activeBO.id,
      nama: nama.trim(),
      jabatan,
      no_hp: noHp.trim() || '-',
      wilayah_kerja: wilayahKerja.trim(),
      is_placeholder: false,
      status_aktif: true,
    });

    setIsAddModalOpen(false);
    setNama('');
    setNoHp('');
    setWilayahKerja('');
  };

  const handleCreatePlaceholderSdm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBO || !kodePlaceholder.trim()) return;

    addSDM({
      bo_id: activeBO.id,
      nama: `${kodePlaceholder.trim()} (Sales Rekrutmen Baru - Placeholder)`,
      jabatan: 'Sales',
      no_hp: '-',
      wilayah_kerja: wilayahPlaceholder.trim() || 'Wilayah Prospek Cabang',
      is_placeholder: true,
      kode_placeholder: kodePlaceholder.trim(),
      status_aktif: true,
    });

    setIsPlaceholderModalOpen(false);
    setKodePlaceholder('');
    setWilayahPlaceholder('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSdm) return;
    updateSDM(editingSdm.id, {
      nama: editingSdm.nama,
      jabatan: editingSdm.jabatan,
      no_hp: editingSdm.no_hp,
      wilayah_kerja: editingSdm.wilayah_kerja,
    });
    setEditingSdm(null);
  };

  const handleExecuteConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingSdm || !convertRealName.trim()) return;
    convertPlaceholder(convertingSdm.id, convertRealName.trim(), convertNoHp.trim() || '-');
    setConvertingSdm(null);
    setConvertRealName('');
    setConvertNoHp('');
  };

  if (!activeBO) return null;

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Fondasi Gatekeeper Rule</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-slate-700">{activeBO.nama_bo}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Pendataan SDM Cabang & Sales Placeholder
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Sesuai aturan alur bertahap, data SDM (termasuk sales dummy untuk rekrutmen mendatang)
            wajib didaftarkan sebelum target penjualan dapat dialokasikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeBoSDM.length === 0 && (
            <button
              onClick={() => seedDemoSDMForBO(activeBO.id)}
              className="px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              Auto-Seed SDM Demo
            </button>
          )}

          <button
            onClick={() => setIsPlaceholderModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 text-amber-700" />
            + Tambah Sales Placeholder
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            + Tambah SDM Karyawan
          </button>
        </div>
      </div>

      {/* Stats and Filter Segment */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500">Total SDM Terdaftar</div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {activeBoSDM.length} Personil
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            {activeBoSDM.length > 0 ? '✓ Syarat Gatekeeper Terpenuhi' : '✕ Belum Terpenuhi'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500">Sales Tetap Aktif</div>
          <div className="text-xl font-bold font-mono text-blue-800 mt-1">
            {activeBoSDM.filter((s) => s.jabatan === 'Sales' && !s.is_placeholder).length} Orang
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tenaga penjual lapangan aktif</div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 shadow-xs">
          <div className="text-amber-900 font-medium">Sales Placeholder</div>
          <div className="text-xl font-bold font-mono text-amber-900 mt-1">
            {activeBoSDM.filter((s) => s.is_placeholder).length} Dummy
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">Alokasi proyeksi rekrutmen</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500">Staf Manajemen / Gudang</div>
          <div className="text-xl font-bold font-mono text-slate-700 mt-1">
            {activeBoSDM.filter((s) => s.jabatan !== 'Sales').length} Orang
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">BM, WBM, BA, WH, Pimpas</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
        {[
          { key: 'ALL', label: 'Semua SDM' },
          { key: 'Sales', label: 'Sales Rep' },
          { key: 'PLACEHOLDER', label: 'Sales Placeholder' },
          { key: 'BM', label: 'Branch Manager (BM)' },
          { key: 'WBM', label: 'Wakil BM' },
          { key: 'Pimpas', label: 'Pimpinan Pasar' },
          { key: 'WH', label: 'Gudang (WH)' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterJabatan(tab.key)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterJabatan === tab.key
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SDM Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-400 font-medium text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-3">Jabatan</th>
                <th className="py-3 px-3">Status Pegawai</th>
                <th className="py-3 px-3">No. HP / WhatsApp</th>
                <th className="py-3 px-4">Wilayah Kerja / Teritori</th>
                <th className="py-3 pr-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSdm.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                    {activeBoSDM.length === 0
                      ? 'Belum ada SDM terdaftar untuk kantor cabang ini. Daftarkan SDM sekarang untuk membuka akses target!'
                      : 'Tidak ada data SDM untuk filter jabatan ini.'}
                  </td>
                </tr>
              ) : (
                filteredSdm.map((sdm) => {
                  return (
                    <tr key={sdm.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Nama */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{sdm.nama}</div>
                        {sdm.is_placeholder && (
                          <div className="text-[11px] font-mono text-amber-700 mt-0.5">
                            Kode Dummy: {sdm.kode_placeholder}
                          </div>
                        )}
                      </td>

                      {/* Jabatan */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            sdm.jabatan === 'BM' || sdm.jabatan === 'WBM'
                              ? 'bg-purple-100 text-purple-900'
                              : sdm.jabatan === 'Sales'
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {sdm.jabatan}
                        </span>
                      </td>

                      {/* Status Pegawai */}
                      <td className="py-3.5 px-3">
                        {sdm.is_placeholder ? (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-medium">
                            Placeholder / Calon
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                            Karyawan Tetap
                          </span>
                        )}
                      </td>

                      {/* No HP */}
                      <td className="py-3.5 px-3 font-mono text-slate-600">
                        {sdm.no_hp}
                      </td>

                      {/* Wilayah Kerja */}
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{sdm.wilayah_kerja}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {sdm.is_placeholder && (
                            <button
                              onClick={() => {
                                setConvertingSdm(sdm);
                                setConvertRealName('');
                                setConvertNoHp('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded transition-colors"
                              title="Ubah placeholder ini menjadi karyawan riil setelah direkrut"
                            >
                              Konversi Tetap
                            </button>
                          )}

                          <button
                            onClick={() => setEditingSdm(sdm)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                            title="Edit SDM"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus ${sdm.nama}?`)) {
                                deleteSDM(sdm.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Hapus SDM"
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
          </table>
        </div>
      </div>

      {/* MODAL: TAMBAH SDM KARYAWAN BIASA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Pendaftaran SDM Baru — {activeBO.nama_bo}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRegularSdm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Tri Wahyuni, S.Pd."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jabatan</label>
                  <select
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value as JabatanSDM)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="Sales">Sales Representative</option>
                    <option value="Pimpas">Pimpinan Pasar (Pimpas)</option>
                    <option value="Korpos">Koordinator Pos (Korpos)</option>
                    <option value="BM">Branch Manager (BM)</option>
                    <option value="WBM">Wakil BM (WBM)</option>
                    <option value="BA">Branch Admin (BA)</option>
                    <option value="WH">Warehouse / Gudang (WH)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Wilayah Kerja / Teritori</label>
                <input
                  type="text"
                  value={wilayahKerja}
                  onChange={(e) => setWilayahKerja(e.target.value)}
                  placeholder="Contoh: Surabaya Selatan & Sidoarjo Utara"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-xs"
                >
                  Simpan SDM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH SALES PLACEHOLDER */}
      {isPlaceholderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-amber-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Fitur Khusus Rekrutmen
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Tambah Sales Placeholder / Dummy
                </h3>
              </div>
              <button
                onClick={() => setIsPlaceholderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Gunakan placeholder untuk mengalokasikan target penjualan pada personil sales yang sedang dalam tahap rekrutmen atau distributor mitra.
            </p>

            <form onSubmit={handleCreatePlaceholderSdm} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Kode / Nama Placeholder (Contoh: "SRBaru01", "SRDSTB01")
                </label>
                <input
                  type="text"
                  value={kodePlaceholder}
                  onChange={(e) => setKodePlaceholder(e.target.value)}
                  placeholder="Contoh: SRBaru01 atau SRDSTB01"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-amber-900 bg-amber-50/50"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Wilayah Kerja Prospek</label>
                <input
                  type="text"
                  value={wilayahPlaceholder}
                  onChange={(e) => setWilayahPlaceholder(e.target.value)}
                  placeholder="Contoh: Gresik & Surabaya Barat"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlaceholderModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-md shadow-xs"
                >
                  Daftarkan Placeholder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONVERSI PLACEHOLDER KE KARYAWAN TETAP */}
      {convertingSdm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Konversi Rekrutmen Selesai
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Aktivasi Karyawan Tetap: {convertingSdm.nama}
                </h3>
              </div>
              <button onClick={() => setConvertingSdm(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Sales telah resmi bergabung. Seluruh target yang sebelumnya dialokasikan pada placeholder ini akan otomatis berpindah ke nama personil baru tanpa merusak histori kalkulasi.
            </p>

            <form onSubmit={handleExecuteConvert} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Asli Karyawan Baru
                </label>
                <input
                  type="text"
                  value={convertRealName}
                  onChange={(e) => setConvertRealName(e.target.value)}
                  placeholder="Contoh: Rian Hidayat, S.E."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">No. HP / WhatsApp</label>
                <input
                  type="text"
                  value={convertNoHp}
                  onChange={(e) => setConvertNoHp(e.target.value)}
                  placeholder="0813-xxxx-xxxx"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertingSdm(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-xs"
                >
                  Simpan & Konversi Tetap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SDM */}
      {editingSdm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Ubah Data SDM</h3>
              <button onClick={() => setEditingSdm(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingSdm.nama}
                  onChange={(e) => setEditingSdm({ ...editingSdm, nama: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jabatan</label>
                  <select
                    value={editingSdm.jabatan}
                    onChange={(e) => setEditingSdm({ ...editingSdm, jabatan: e.target.value as JabatanSDM })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-medium"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Pimpas">Pimpas</option>
                    <option value="Korpos">Korpos</option>
                    <option value="BM">BM</option>
                    <option value="WBM">WBM</option>
                    <option value="BA">BA</option>
                    <option value="WH">WH</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">No. HP</label>
                  <input
                    type="text"
                    value={editingSdm.no_hp}
                    onChange={(e) => setEditingSdm({ ...editingSdm, no_hp: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Wilayah Kerja</label>
                <input
                  type="text"
                  value={editingSdm.wilayah_kerja}
                  onChange={(e) => setEditingSdm({ ...editingSdm, wilayah_kerja: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSdm(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
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
