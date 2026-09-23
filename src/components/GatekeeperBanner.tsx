import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldAlert, ShieldCheck, UserPlus, Sparkles, ArrowRight } from 'lucide-react';
import { ZONA_DESCRIPTIONS } from '../utils/calculations';

interface Props {
  onOpenSdmModal?: () => void;
}

export const GatekeeperBanner: React.FC<Props> = ({ onOpenSdmModal }) => {
  const {
    canInputTarget,
    activeBO,
    sdmCountForActiveBO,
    salesCountForActiveBO,
    placeholderCountForActiveBO,
    setActiveTab,
    seedDemoSDMForBO,
  } = useApp();

  if (!activeBO) return null;

  if (!canInputTarget) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-5 mb-6 text-rose-950">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-800 tracking-wide uppercase">
                  Aturan Alur Bertahap (Gatekeeper Rule)
                </span>
                <span className="text-xs text-rose-600">· Akses Input Target Terkunci</span>
              </div>
              <h3 className="text-base font-bold text-rose-950 mt-0.5">
                {activeBO.nama_bo} Belum Memiliki Data SDM Terdaftar
              </h3>
              <p className="text-sm text-rose-800 mt-1 max-w-3xl leading-relaxed">
                Sesuai Standard Operating Procedure (SOP) Penerbitan Edukasi, Branch Manager (BM)
                <strong> TIDAK BISA</strong> menginput alokasi target penjualan sebelum mendaftarkan data SDM / Karyawan
                (termasuk Sales Representative atau Sales Placeholder) di kantor cabang bersangkutan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 pl-13 md:pl-0">
            <button
              onClick={() => {
                setActiveTab('sdm');
                if (onOpenSdmModal) onOpenSdmModal();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Daftarkan SDM Sekarang
            </button>
            <button
              onClick={() => seedDemoSDMForBO(activeBO.id)}
              className="px-3.5 py-2 text-xs font-medium text-rose-800 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5"
              title="Isi otomatis 3 contoh SDM untuk membuka kunci gatekeeper"
            >
              <Sparkles className="w-4 h-4 text-rose-600" />
              Auto-Seed SDM Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 px-4 py-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="text-xs text-slate-600">
          <span className="font-semibold text-emerald-900">Gatekeeper Lolos: </span>
          <span>{sdmCountForActiveBO} SDM Terdaftar di {activeBO.nama_bo}</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span>{salesCountForActiveBO} Sales Aktif</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span>{placeholderCountForActiveBO} Sales Placeholder</span>
          <span className="mx-1.5 text-slate-300">·</span>
          <span className="font-mono text-emerald-800">
            Zona {activeBO.zona_id} ({ZONA_DESCRIPTIONS[activeBO.zona_id] || ''})
          </span>
        </div>
      </div>

      <button
        onClick={() => setActiveTab('sdm')}
        className="text-xs font-medium text-emerald-800 hover:text-emerald-900 flex items-center gap-1 self-start sm:self-auto shrink-0"
      >
        Kelola SDM Cabang
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
