import React, { useState, useEffect } from 'react';
import {
  TargetPenjualanDetail,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  UserProfile,
} from '../../types';
import {
  formatRupiah,
  formatRupiahCompact,
  calculateTargetColumns,
  calculateFinancials,
} from '../../utils/calculations';
import { ImportDataModal } from '../modals/ImportDataModal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Target,
  Calculator,
  Building2,
  Users,
  Building,
  BookOpen,
  X,
  Check,
  RefreshCw,
  TrendingUp,
  Upload,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TargetDetailCrudProps {
  items: TargetPenjualanDetail[];
  boList: MasterBO[];
  sdmList: MasterSDM[];
  relasiList: MasterRelasi[];
  produkList: MasterProduk[];
  hargaMatrix: MasterProdukHarga[];
  currentUser?: UserProfile;
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
  isLoading: boolean;
}

export const TargetDetailCrud: React.FC<TargetDetailCrudProps> = ({
  items,
  boList,
  sdmList,
  relasiList,
  produkList,
  hargaMatrix,
  currentUser,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
  isLoading,
}) => {
  const isBM = currentUser?.role === 'branch_manager';
  const assignedBoId = currentUser?.assigned_bo_id || '';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoFilter, setSelectedBoFilter] = useState(isBM && assignedBoId ? assignedBoId : 'ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TargetPenjualanDetail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    if (isBM && assignedBoId) {
      setSelectedBoFilter(assignedBoId);
    }
  }, [isBM, assignedBoId]);

  // Form states
  const [boId, setBoId] = useState('');
  const [sdmId, setSdmId] = useState('');
  const [relasiId, setRelasiId] = useState('');
  const [produkId, setProdukId] = useState('');
  const [tahunAnggaran, setTahunAnggaran] = useState<number>(2026);
  const [qty, setQty] = useState<number>(100);
  const [persenKeyakinan, setPersenKeyakinan] = useState<number>(100);
  const [persenRabat, setPersenRabat] = useState<number>(20);
  const [persenBsr, setPersenBsr] = useState<number>(5);
  const [persenHpp, setPersenHpp] = useState<number>(35);
  const [catatan, setCatatan] = useState('');

  // Selected BO & derived values
  const currentBo = boList.find((b) => b.id === boId) || boList[0];
  const currentZona = currentBo ? currentBo.zona_id : 1;

  // Auto price lookup
  const lookupPrice = (pId: string, yr: number, zId: number) => {
    const found = hargaMatrix.find(
      (m) => m.produk_id === pId && m.tahun_anggaran === yr && m.zona_id === zId
    );
    return found ? found.harga_satuan : 75000;
  };

  const calculatedUnitPrice = lookupPrice(produkId, tahunAnggaran, currentZona);
  const previewFinancials = calculateFinancials(
    qty,
    calculatedUnitPrice,
    persenRabat,
    persenBsr,
    persenHpp,
    persenKeyakinan
  );

  const availableSdmForBo = sdmList.filter((s) => !boId || s.bo_id === boId);
  const availableRelasiForBo = relasiList.filter((r) => !boId || r.bo_id === boId);

  const openAddModal = () => {
    setEditingItem(null);
    const initialBoId = isBM && assignedBoId ? assignedBoId : boList[0]?.id || '';
    setBoId(initialBoId);

    const initialSdm = sdmList.find((s) => s.bo_id === initialBoId);
    setSdmId(initialSdm?.id || sdmList[0]?.id || '');

    const initialRelasi = relasiList.find((r) => r.bo_id === initialBoId);
    setRelasiId(initialRelasi?.id || relasiList[0]?.id || '');
    setProdukId(produkList[0]?.id || '');

    setTahunAnggaran(2026);
    setQty(100);
    setPersenKeyakinan(100);
    setPersenRabat(initialRelasi?.default_rabat_persen || 20);
    setPersenBsr(5);
    setPersenHpp(35);
    setCatatan('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: TargetPenjualanDetail) => {
    setEditingItem(item);
    setBoId(item.bo_id);
    setSdmId(item.sdm_id);
    setRelasiId(item.relasi_id);
    setProdukId(item.produk_id);
    setTahunAnggaran(item.tahun_anggaran);
    setQty(item.qty);
    setPersenKeyakinan(item.persen_keyakinan);
    setPersenRabat(item.persen_rabat);
    setPersenBsr(item.persen_bsr);
    setPersenHpp(item.persen_hpp);
    setCatatan(item.catatan || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boId || !sdmId || !relasiId || !produkId) {
      alert('Lengkapi pemilihan BO, SDM, Relasi, dan Produk.');
      return;
    }

    setIsSubmitting(true);
    try {
      const computed = calculateTargetColumns(
        qty,
        calculatedUnitPrice,
        persenRabat,
        persenBsr,
        persenHpp,
        persenKeyakinan
      );

      const payload = {
        bo_id: boId,
        sdm_id: sdmId,
        relasi_id: relasiId,
        produk_id: produkId,
        tahun_anggaran: Number(tahunAnggaran),
        zona_id: currentZona,
        harga_satuan: calculatedUnitPrice,
        qty: Number(qty),
        persen_keyakinan: Number(persenKeyakinan),
        persen_rabat: Number(persenRabat),
        persen_bsr: Number(persenBsr),
        persen_hpp: Number(persenHpp),
        ...computed,
        catatan: catatan.trim() || undefined,
      };

      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus item target penjualan ini?')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getBo = (id: string) => boList.find((b) => b.id === id);
  const getSdm = (id: string) => sdmList.find((s) => s.id === id);
  const getRelasi = (id: string) => relasiList.find((r) => r.id === id);
  const getProduk = (id: string) => produkList.find((p) => p.id === id);

  const filteredItems = items.filter((t) => {
    const sdm = getSdm(t.sdm_id);
    const rel = getRelasi(t.relasi_id);
    const prod = getProduk(t.produk_id);

    const matchesSearch =
      !searchTerm ||
      (sdm && sdm.nama.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (rel && rel.nama_relasi.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (prod && prod.judul_buku.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBo = selectedBoFilter === 'ALL' || t.bo_id === selectedBoFilter;

    return matchesSearch && matchesBo;
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Target Penjualan Detail & Proyeksi Finansial
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
              {filteredItems.length} Alokasi
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Alokasi target buku per tim sales dan sekolah mitra dengan formula proyeksi brutto, rabat, BSR, dan laba kotor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* BO Filter or Locked Branch Badge */}
          {isBM ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>{boList.find((b) => b.id === assignedBoId)?.nama_bo || 'Cabang Terkunci'}</span>
            </div>
          ) : (
            <select
              value={selectedBoFilter}
              onChange={(e) => {
                setSelectedBoFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Cabang (Nasional)</option>
              {boList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.kode_bo} - {b.nama_bo}
                </option>
              ))}
            </select>
          )}

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari sales, relasi, buku..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors"
            title="Impor target dari file Excel / CSV"
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
            Tambah Target
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Sales / SDM</th>
              <th className="py-3 px-4">Mitra Relasi</th>
              <th className="py-3 px-4">Produk Buku</th>
              <th className="py-3 px-4 text-center">Qty & Keyakinan</th>
              <th className="py-3 px-4 text-right">Nilai Brutto</th>
              <th className="py-3 px-4 text-right">Nilai Netto</th>
              <th className="py-3 px-4 text-right">Laba Kotor</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Memuat data target penjualan...</span>
                    </div>
                  ) : (
                    <div>
                      <Target className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">Belum ada data target penjualan.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Alokasikan target per sales, relasi, dan produk untuk memproyeksikan omzet.
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const sdm = getSdm(item.sdm_id);
                const rel = getRelasi(item.relasi_id);
                const prod = getProduk(item.produk_id);
                const bo = getBo(item.bo_id);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {sdm ? sdm.nama : 'SDM: ' + item.sdm_id}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {bo?.kode_bo || 'BO'} • Zona {item.zona_id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {rel ? rel.nama_relasi : 'Relasi: ' + item.relasi_id}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Rabat {item.persen_rabat}% • BSR {item.persen_bsr}%
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="font-medium text-slate-900 truncate">
                        {prod ? prod.judul_buku : 'SKU: ' + item.produk_id}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        @{formatRupiah(item.harga_satuan)}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold text-slate-900 font-mono">
                        {item.qty.toLocaleString()} eks
                      </div>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.persen_keyakinan}% Keyakinan
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiahCompact(item.nilai_brutto)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatRupiahCompact(item.nilai_netto)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatRupiahCompact(item.laba_kotor)}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit Target"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-50"
                        title="Hapus Target"
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

      {/* Pagination Controls */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>
            Menampilkan{' '}
            <strong className="text-slate-900">
              {filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-900">
              {Math.min(currentPage * pageSize, filteredItems.length)}
            </strong>{' '}
            dari <strong className="text-slate-900">{filteredItems.length.toLocaleString('id-ID')}</strong> data
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-1.5 py-0.5 bg-white text-xs text-slate-800"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            Halaman {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Halaman Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Calculator className="w-4 h-4 mr-1.5 text-blue-600" />
                {editingItem ? 'Edit Target Penjualan Detail' : 'Input Target Penjualan Baru'}
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
                    Kantor Cabang (BO) <span className="text-rose-500">*</span>
                  </label>
                  {isBM ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{boList.find((b) => b.id === assignedBoId)?.nama_bo || 'Cabang Terkunci'}</span>
                    </div>
                  ) : (
                    <select
                      required
                      value={boId}
                      onChange={(e) => {
                        const newBoId = e.target.value;
                        setBoId(newBoId);
                        const firstSdm = sdmList.find((s) => s.bo_id === newBoId);
                        if (firstSdm) setSdmId(firstSdm.id);
                        const firstRel = relasiList.find((r) => r.bo_id === newBoId);
                        if (firstRel) setRelasiId(firstRel.id);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {boList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.kode_bo} - {b.nama_bo} (Zona {b.zona_id})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Tahun Anggaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={tahunAnggaran}
                    onChange={(e) => setTahunAnggaran(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Sales / SDM Penanggung Jawab <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={sdmId}
                    onChange={(e) => setSdmId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Pilih Sales</option>
                    {availableSdmForBo.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.jabatan}) {s.is_placeholder ? '[Placeholder]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Mitra Relasi / Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={relasiId}
                    onChange={(e) => {
                      setRelasiId(e.target.value);
                      const rel = relasiList.find((r) => r.id === e.target.value);
                      if (rel) setPersenRabat(rel.default_rabat_persen);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>Pilih Sekolah / Mitra</option>
                    {availableRelasiForBo.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.kode_relasi} - {r.nama_relasi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Produk Buku (SKU) <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={produkId}
                  onChange={(e) => setProdukId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Pilih Buku</option>
                  {produkList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode_sku} - {p.judul_buku} ({p.jenjang})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-blue-700 font-mono mt-1">
                  Tarif Satuan (Zona {currentZona}): {formatRupiah(calculatedUnitPrice)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Target Kuantitas (Eks) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Keyakinan / Confidence (%) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={persenKeyakinan}
                    onChange={(e) => setPersenKeyakinan(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    % Rabat Relasi
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={persenRabat}
                    onChange={(e) => setPersenRabat(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    % Biaya BSR
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={persenBsr}
                    onChange={(e) => setPersenBsr(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    % Biaya HPP
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={persenHpp}
                    onChange={(e) => setPersenHpp(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Real-Time Formula Calculation Summary Box */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 font-sans font-semibold text-[11px] pb-1 border-b border-slate-800">
                  <span className="flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    Kalkulasi Otomatis (Real-Time)
                  </span>
                  <span>Margin: {previewFinancials.marginPersen.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">1. Nilai Brutto (Qty × Harga):</span>
                  <span className="font-bold text-white">{formatRupiah(previewFinancials.nilaiBrutto)}</span>
                </div>
                <div className="flex justify-between text-rose-300">
                  <span className="text-slate-400">2. Rabat Relasi ({persenRabat}%):</span>
                  <span>- {formatRupiah(previewFinancials.nilaiRabat)}</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span className="text-slate-400">3. BSR ({persenBsr}%):</span>
                  <span>- {formatRupiah(previewFinancials.nilaiBsr)}</span>
                </div>
                <div className="flex justify-between text-blue-300 font-semibold pt-1 border-t border-slate-800">
                  <span>4. Nilai Netto:</span>
                  <span>{formatRupiah(previewFinancials.nilaiNetto)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>5. Laba Kotor (Netto - HPP):</span>
                  <span>{formatRupiah(previewFinancials.labaKotor)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Nilai Tertimbang ({persenKeyakinan}%):</span>
                  <span>{formatRupiah(previewFinancials.nilaiTertimbang)}</span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="e.g. Alokasi semester 1 kurikulum merdeka..."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  {editingItem ? 'Simpan Target' : 'Alokasikan Target'}
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
        tableType="target_detail"
        onImportSuccess={() => {
          onRefresh?.();
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
};
