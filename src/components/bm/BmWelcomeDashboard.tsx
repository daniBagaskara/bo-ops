import React from 'react';
import { UserProfile } from '../../types';
import { Building2, LogOut, Info, MapPin } from 'lucide-react';

interface BmWelcomeDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
}

export const BmWelcomeDashboard: React.FC<BmWelcomeDashboardProps> = ({
  currentUser,
  onLogout,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Clean Navbar Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight">BO-OPS</span>
              <span className="ml-2 px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
                Branch Manager
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.nama}
              </p>
              <p className="text-[11px] text-slate-500 leading-tight">
                {currentUser.assigned_bo_nama || 'Branch Office'}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content: Welcome Greeting Only */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-xl w-full">
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-slate-100 text-slate-700 mb-5">
              <Building2 className="w-7 h-7" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Selamat Datang, {currentUser.nama}!
            </h1>

            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Anda telah berhasil masuk ke sistem operasional <strong>BO-OPS Edukasi</strong> sebagai Branch Manager.
            </p>

            {/* Branch Card Info */}
            <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200 text-left flex items-start gap-3">
              <MapPin className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-slate-900">
                  {currentUser.assigned_bo_nama || 'Branch Office Surabaya (Zona 2)'}
                </p>
                <p className="text-slate-600">
                  Akun: <span className="font-medium text-slate-800">{currentUser.email}</span>
                </p>
                <p className="text-slate-600">
                  Peran Akses: <span className="font-medium text-amber-700">Branch Manager (BM)</span>
                </p>
              </div>
            </div>

            {/* Information Notice */}
            <div className="mt-4 p-4 rounded-lg bg-blue-50/70 border border-blue-200 text-left flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 space-y-1 leading-relaxed">
                <p className="font-semibold">Informasi Sistem:</p>
                <p>
                  Sesuai instruksi konfigurasi tahap awal, fitur dan modul operasional cabang saat ini sedang dikelola oleh Superadmin Pusat.
                </p>
                <p className="text-blue-700">
                  Belum ada fitur transaksi atau alokasi yang dibuka untuk akun Branch Manager saat ini.
                </p>
              </div>
            </div>

            {/* Logout button */}
            <div className="mt-8">
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center px-5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-xs"
              >
                <LogOut className="w-4 h-4 mr-2 text-slate-500" />
                Keluar dari Akun
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
