import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  UserCheck,
  Building,
  BookOpen,
  Calculator,
  Plus,
  HelpCircle,
  AlertCircle,
  Percent,
  Sparkles,
} from 'lucide-react';
import { calculateFinancials, formatRupiah, formatPercent, ZONA_DESCRIPTIONS } from '../utils/calculations';
import { MasterSDM, MasterRelasi, MasterProduk } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TargetWizardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    activeBO,
    activeYear,
    activeBoSDM,
    relasiList,
    produkList,
    getProductPrice,
    addTargetDetail,
    addSDM,
    addRelasi,
    canInputTarget,
    showToast,
  } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Selections
  const [selectedSdmId, setSelectedSdmId] = useState<string>('');
  const [selectedRelasiId, setSelectedRelasiId] = useState<string>('');
  const [selectedProdukId, setSelectedProdukId] = useState<string>('');

  // Target Parameters
  const [qty, setQty] = useState<number>(500);
  const [persenKeyakinan, setPersenKeyakinan] = useState<number>(85);
  const [persenRabat, setPersenRabat] = useState<number>(20);
  const [persenBsr, setPersenBsr] = useState<number>(5);
  const [persenHpp, setPersenHpp] = useState<number>(35);
  const [catatan, setCatatan] = useState<string>('');

  // Quick addition states
  const [showQuickAddSdm, setShowQuickAddSdm] = useState(false);
  const [newPlaceholderCode, setNewPlaceholderCode] = useState('SRBaru02');
  const [newPlaceholderTerritory, setNewPlaceholderTerritory] = useState('Area Baru Prospek Cabang');

  const [showQuickAddRelasi, setShowQuickAddRelasi] = useState(false);
  const [newRelasiNama, setNewRelasiNama] = useState('');
  const [newRelasiJenis, setNewRelasiJenis] = useState<'Sekolah' | 'K3S' | 'IGTKI'>('Sekolah');
  const [newRelasiJenjang, setNewRelasiJenjang] = useState<'SD/MI' | 'SMP/MTs' | 'SMA/MA' | 'SMK' | 'PAUD/TK'>('SD/MI');

  // Filter Sales candidates
  const eligibleSdm = useMemo(() => {
    return activeBoSDM.filter(
      (s) => s.jabatan === 'Sales' || s.jabatan === 'Pimpas' || s.jabatan === 'BM' || s.is_placeholder
    );
  }, [activeBoSDM]);

  // Relasi for this BO
  const availableRelasi = useMemo(() => {
    if (!activeBO) return [];
    return relasiList.filter((r) => r.bo_id === activeBO.id);
  }, [relasiList, activeBO]);

  // Selected entities
  const selectedSdm = useMemo(() => activeBoSDM.find((s) => s.id === selectedSdmId), [activeBoSDM, selectedSdmId]);
  const selectedRelasi = useMemo(() => availableRelasi.find((r) => r.id === selectedRelasiId), [availableRelasi, selectedRelasiId]);
  const selectedProduk = useMemo(() => produkList.find((p) => p.id === selectedProdukId), [produkList, selectedProdukId]);

  // Dynamic price based on BO zone and year
  const unitPrice = useMemo(() => {
    if (!selectedProdukId || !activeBO) return 0;
    return getProductPrice(selectedProdukId, activeYear, activeBO.zona_id);
  }, [selectedProdukId, activeYear, activeBO, getProductPrice]);

  // Real-time financial calculations
  const financials = useMemo(() => {
    return calculateFinancials(qty, unitPrice, persenRabat, persenBsr, persenHpp, persenKeyakinan);
  }, [qty, unitPrice, persenRabat, persenBsr, persenHpp, persenKeyakinan]);

  // Auto-set defaults when relasi or product selected
  const handleSelectRelasi = (rel: MasterRelasi) => {
    setSelectedRelasiId(rel.id);
    setPersenRabat(rel.default_rabat_persen || 20);
  };

  const handleSelectProduk = (prod: MasterProduk) => {
    setSelectedProdukId(prod.id);
    setPersenHpp(prod.default_hpp_persen || 35);
  };

  // Quick Add Placeholder SDM
  const handleCreatePlaceholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBO) return;
    const created = addSDM({
      bo_id: activeBO.id,
      nama: `${newPlaceholderCode} (Sales Rekrutmen Baru - Placeholder)`,
      jabatan: 'Sales',
      no_hp: '-',
      wilayah_kerja: newPlaceholderTerritory,
      is_placeholder: true,
      kode_placeholder: newPlaceholderCode,
      status_aktif: true,
    });
    setSelectedSdmId(created.id);
    setShowQuickAddSdm(false);
  };

  // Quick Add Relasi
  const handleCreateRelasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBO || !newRelasiNama.trim()) return;
    const created = addRelasi({
      bo_id: activeBO.id,
      kode_relasi: `REL-${Date.now().toString().slice(-4)}`,
      nama_relasi: newRelasiNama.trim(),
      jenis_relasi: newRelasiJenis,
      jenjang: newRelasiJenjang,
      alamat: 'Wilayah Operasional Cabang',
      kontak_person: 'Penanggung Jawab Pengadaan',
      no_kontak: '-',
      default_rabat_persen: newRelasiJenis === 'IGTKI' ? 25 : 20,
    });
    setSelectedRelasiId(created.id);
    setShowQuickAddRelasi(false);
    setNewRelasiNama('');
  };

  // Submit Target
  const handleSubmit = () => {
    if (!selectedSdmId || !selectedRelasiId || !selectedProdukId) {
      showToast('error', 'Form Belum Lengkap', 'Pastikan SDM, Relasi, dan Produk telah dipilih.');
      return;
    }
    if (qty <= 0) {
      showToast('error', 'Kuantitas Tidak Valid', 'Kuantitas pesanan (Qty) harus lebih dari 0.');
      return;
    }

    const res = addTargetDetail({
      sdm_id: selectedSdmId,
      relasi_id: selectedRelasiId,
      produk_id: selectedProdukId,
      qty,
      persen_keyakinan: persenKeyakinan,
      persen_rabat: persenRabat,
      persen_bsr: persenBsr,
      persen_hpp: persenHpp,
      catatan,
    });

    if (res.success) {
      onClose();
      // Reset for next entry
      setStep(1);
      setSelectedProdukId('');
      setCatatan('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                Wizard Alokasi Target
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">
                {activeBO?.nama_bo} (Zona {activeBO?.zona_id}) · TA {activeYear}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              Hierarki Breakdown Target: Sales → Relasi → Produk
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="px-6 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 font-medium transition-colors ${
                step === 1 ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  selectedSdmId
                    ? 'bg-emerald-600 text-white'
                    : step === 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {selectedSdmId ? <Check className="w-3 h-3" /> : '1'}
              </span>
              <span>1. Pilih Sales / SDM</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <button
              onClick={() => selectedSdmId && setStep(2)}
              disabled={!selectedSdmId}
              className={`flex items-center gap-2 font-medium transition-colors ${
                step === 2
                  ? 'text-blue-700 font-semibold'
                  : selectedSdmId
                  ? 'text-slate-500 hover:text-slate-800'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  selectedRelasiId
                    ? 'bg-emerald-600 text-white'
                    : step === 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {selectedRelasiId ? <Check className="w-3 h-3" /> : '2'}
              </span>
              <span>2. Pilih Mitra Relasi</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <button
              onClick={() => selectedSdmId && selectedRelasiId && setStep(3)}
              disabled={!selectedSdmId || !selectedRelasiId}
              className={`flex items-center gap-2 font-medium transition-colors ${
                step === 3
                  ? 'text-blue-700 font-semibold'
                  : selectedRelasiId
                  ? 'text-slate-500 hover:text-slate-800'
                  : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === 3 ? 'bg-blue-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                3
              </span>
              <span>3. Produk & Kalkulasi Formula</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            {selectedSdm && <span className="truncate max-w-[120px]">{selectedSdm.nama.split(' ')[0]}</span>}
            {selectedRelasi && <span>→ {selectedRelasi.nama_relasi.slice(0, 15)}...</span>}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: PILIH SDM / SALES */}
          {step === 1 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Langkah 1: Tentukan Sales Representative / SDM Penanggung Jawab
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih personil sales yang bertanggung jawab atas portofolio target ini (termasuk sales placeholder).
                  </p>
                </div>
                <button
                  onClick={() => setShowQuickAddSdm(!showQuickAddSdm)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Placeholder Sales Baru
                </button>
              </div>

              {/* Quick Add Placeholder Drawer */}
              {showQuickAddSdm && (
                <form
                  onSubmit={handleCreatePlaceholder}
                  className="p-4 mb-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3 animate-in fade-in duration-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">
                      Tambah Sales Placeholder Baru (Contoh: SRBaru01, SRDSTB01)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddSdm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Batal
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Kode / Nama Placeholder
                      </label>
                      <input
                        type="text"
                        value={newPlaceholderCode}
                        onChange={(e) => setNewPlaceholderCode(e.target.value)}
                        placeholder="Contoh: SRBaru03, SRDSTB02"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Wilayah Kerja Prospek</label>
                      <input
                        type="text"
                        value={newPlaceholderTerritory}
                        onChange={(e) => setNewPlaceholderTerritory(e.target.value)}
                        placeholder="Contoh: Surabaya Barat & Gresik"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Simpan & Pilih Placeholder Ini
                  </button>
                </form>
              )}

              {/* Grid of SDM Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {eligibleSdm.length === 0 ? (
                  <div className="col-span-2 p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-800">Belum ada Sales terdaftar di BO ini</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tambahkan Sales tetap atau Sales Placeholder terlebih dahulu.
                    </p>
                  </div>
                ) : (
                  eligibleSdm.map((sdm) => {
                    const isSelected = selectedSdmId === sdm.id;
                    return (
                      <div
                        key={sdm.id}
                        onClick={() => setSelectedSdmId(sdm.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                sdm.is_placeholder
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {sdm.jabatan}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 leading-tight">
                                {sdm.nama}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {sdm.wilayah_kerja}
                              </div>
                            </div>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {sdm.is_placeholder && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800">
                            <span className="font-semibold font-mono">Kode: {sdm.kode_placeholder}</span>
                            <span>Sales Dummy / Rekrutmen Mendatang</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PILIH MITRA RELASI */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Langkah 2: Pilih Institusi / Mitra Relasi
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target penjualan dialokasikan ke Sekolah, Kelompok Kerja Kepala Sekolah (K3S), atau IGTKI.
                  </p>
                </div>
                <button
                  onClick={() => setShowQuickAddRelasi(!showQuickAddRelasi)}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tambah Relasi Baru
                </button>
              </div>

              {/* Quick Add Relasi Drawer */}
              {showQuickAddRelasi && (
                <form
                  onSubmit={handleCreateRelasi}
                  className="p-4 mb-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3 animate-in fade-in duration-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900">Registrasi Mitra Relasi Baru Cepat</span>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddRelasi(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Batal
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-700 mb-1">Nama Institusi / Lembaga</label>
                      <input
                        type="text"
                        value={newRelasiNama}
                        onChange={(e) => setNewRelasiNama(e.target.value)}
                        placeholder="Contoh: SD Negeri 2 Bubutan / K3S Sukolilo"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Jenis Relasi</label>
                      <select
                        value={newRelasiJenis}
                        onChange={(e) => setNewRelasiJenis(e.target.value as any)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
                      >
                        <option value="Sekolah">Sekolah</option>
                        <option value="K3S">K3S</option>
                        <option value="IGTKI">IGTKI</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Simpan Relasi & Pilih
                  </button>
                </form>
              )}

              {/* Grid of Relasi Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableRelasi.length === 0 ? (
                  <div className="col-span-2 p-8 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-800">Belum ada mitra relasi terdaftar untuk BO ini</p>
                    <p className="text-xs text-slate-500 mt-1">Gunakan tombol di atas untuk mendaftarkan relasi pertama.</p>
                  </div>
                ) : (
                  availableRelasi.map((rel) => {
                    const isSelected = selectedRelasiId === rel.id;
                    return (
                      <div
                        key={rel.id}
                        onClick={() => handleSelectRelasi(rel)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-slate-500">{rel.kode_relasi}</span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-[11px] font-semibold text-slate-700">{rel.jenis_relasi} ({rel.jenjang})</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 mt-1">
                              {rel.nama_relasi}
                            </h4>
                            <div className="text-[11px] text-slate-500 mt-0.5">{rel.alamat}</div>
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Kontak: {rel.kontak_person || '-'}</span>
                          <span className="font-semibold text-blue-700">Rabat Default: {rel.default_rabat_persen}%</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PILIH PRODUK, QTY & PERHITUNGAN FORMULA OTOMATIS */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Langkah 3: Pilih SKU Produk & Hitung Formula Finansial Otomatis
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Harga satuan disesuaikan otomatis dengan <strong>Zona {activeBO?.zona_id}</strong> dan <strong>Tahun Anggaran {activeYear}</strong>.
                </p>
              </div>

              {/* Product SKU Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Pilih Produk Edukasi (SKU & Judul Buku)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {produkList.map((prod) => {
                    const price = getProductPrice(prod.id, activeYear, activeBO?.zona_id);
                    const isSelected = selectedProdukId === prod.id;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleSelectProduk(prod)}
                        className={`p-2.5 rounded-lg border cursor-pointer text-xs transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-600'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-mono font-medium">{prod.kode_sku}</span>
                          <span>{prod.jenjang}</span>
                        </div>
                        <div className="font-semibold text-slate-900 mt-1 line-clamp-2 leading-tight">
                          {prod.judul_buku}
                        </div>
                        <div className="mt-2 flex items-center justify-between font-mono">
                          <span className="text-[11px] text-slate-500">Harga Zona {activeBO?.zona_id}:</span>
                          <span className="font-bold text-blue-700">{formatRupiah(price)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Parameters Input Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                {/* Qty */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Kuantitas (Qty)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="50"
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-semibold text-slate-900"
                  />
                  <div className="flex gap-1 mt-1">
                    {[100, 500, 1000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setQty(preset)}
                        className="px-1.5 py-0.5 text-[10px] bg-white border border-slate-200 rounded text-slate-600 hover:bg-slate-100"
                      >
                        +{preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* % Keyakinan (Confidence) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-800">% Keyakinan</label>
                    <span className="font-mono font-bold text-blue-700">{persenKeyakinan}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={persenKeyakinan}
                    onChange={(e) => setPersenKeyakinan(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>Prospek (50%)</span>
                    <span>Pasti (100%)</span>
                  </div>
                </div>

                {/* % Rabat Relasi */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    % Rabat Relasi
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={persenRabat}
                      onChange={(e) => setPersenRabat(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-semibold text-slate-900 pr-6"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Diskon resmi mitra relasi</span>
                </div>

                {/* % BSR */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    % BSR (Sarana Relasi)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={persenBsr}
                      onChange={(e) => setPersenBsr(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-semibold text-slate-900 pr-6"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Biaya operasional promosi</span>
                </div>

                {/* % HPP */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    % HPP (Produksi)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      max="60"
                      step="0.5"
                      value={persenHpp}
                      onChange={(e) => setPersenHpp(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono font-semibold text-slate-900 pr-6"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Harga Pokok Produksi</span>
                </div>
              </div>

              {/* LIVE FORMULA CALCULATION BREAKDOWN PANEL */}
              <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/50 via-slate-50 to-emerald-50/30 p-4">
                <div className="flex items-center justify-between mb-3 border-b border-blue-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-blue-950 uppercase tracking-wide">
                      Kalkulasi Formula Otomatis (Real-Time)
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Harga Satuan Zona {activeBO?.zona_id}: {formatRupiah(unitPrice)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* 1. Nilai Brutto */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-[11px] text-slate-500">1. Nilai Brutto (Qty × Harga)</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-1">
                      {formatRupiah(financials.nilaiBrutto)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {qty} eks × {formatRupiah(unitPrice)}
                    </div>
                  </div>

                  {/* 2. Rabat ke Relasi */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-[11px] text-slate-500">2. Rabat ke Relasi ({persenRabat}%)</div>
                    <div className="text-base font-bold font-mono text-amber-700 mt-1">
                      - {formatRupiah(financials.nilaiRabat)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Brutto × {persenRabat}%
                    </div>
                  </div>

                  {/* 3. BSR */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-[11px] text-slate-500">3. BSR Nominal ({persenBsr}%)</div>
                    <div className="text-base font-bold font-mono text-amber-700 mt-1">
                      - {formatRupiah(financials.nilaiBsr)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Brutto × {persenBsr}%
                    </div>
                  </div>

                  {/* 4. Nilai Netto */}
                  <div className="p-3 bg-white rounded-lg border border-blue-200 bg-blue-50/40 shadow-xs">
                    <div className="text-[11px] font-semibold text-blue-900">4. Nilai Netto (Brutto - Rabat - BSR)</div>
                    <div className="text-base font-bold font-mono text-blue-900 mt-1">
                      {formatRupiah(financials.nilaiNetto)}
                    </div>
                    <div className="text-[10px] text-blue-600 mt-0.5">
                      Pendapatan bersih cabang
                    </div>
                  </div>

                  {/* 5. HPP Nominal */}
                  <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs">
                    <div className="text-[11px] text-slate-500">5. HPP Nominal ({persenHpp}%)</div>
                    <div className="text-base font-bold font-mono text-slate-700 mt-1">
                      {formatRupiah(financials.nilaiHpp)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Biaya percetakan & kertas
                    </div>
                  </div>

                  {/* 6. Laba Kotor */}
                  <div className="p-3 bg-white rounded-lg border border-emerald-200 bg-emerald-50/50 shadow-xs">
                    <div className="text-[11px] font-semibold text-emerald-900">6. Laba Kotor (Netto - HPP)</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-1">
                      {formatRupiah(financials.labaKotor)}
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      Margin: {formatPercent(financials.marginPersen)}
                    </div>
                  </div>

                  {/* 7. Nilai Tertimbang (% Keyakinan) */}
                  <div className="p-3 bg-white rounded-lg border border-indigo-200 bg-indigo-50/40 shadow-xs md:col-span-2">
                    <div className="text-[11px] font-semibold text-indigo-900">
                      7. Nilai Tertimbang Brutto ({persenKeyakinan}% Keyakinan)
                    </div>
                    <div className="text-base font-bold font-mono text-indigo-900 mt-1">
                      {formatRupiah(financials.nilaiTertimbang)}
                    </div>
                    <div className="text-[10px] text-indigo-700 mt-0.5">
                      Proyeksi realistis setelah memperhitungkan faktor resiko negosiasi ({persenKeyakinan}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Catatan Field */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Catatan Alokasi / Klausul MOU (Opsional)
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Pengadaan dana BOS reguler semester ganjil, draft MOU sudah disetujui kepsek..."
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as any)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Batal
            </button>

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && selectedSdmId) setStep(2);
                  else if (step === 2 && selectedRelasiId) setStep(3);
                }}
                disabled={(step === 1 && !selectedSdmId) || (step === 2 && !selectedRelasiId)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                  (step === 1 && selectedSdmId) || (step === 2 && selectedRelasiId)
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Lanjutkan
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!selectedProdukId || qty <= 0}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                  selectedProdukId && qty > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Simpan Target & Alokasikan
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
