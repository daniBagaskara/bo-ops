import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ActiveTab, UserRole } from '../types';
import {
  Building2,
  Calendar,
  Users,
  Layers,
  FileCode,
  Shield,
  ChevronDown,
  Lock,
  PlusCircle,
  Database,
  BarChart3,
  BookOpen,
} from 'lucide-react';

interface Props {
  onOpenTargetWizard: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenTargetWizard }) => {
  const {
    currentUser,
    setCurrentUser,
    availableUsers,
    activeTab,
    setActiveTab,
    activeYear,
    setActiveYear,
    activeBoId,
    setActiveBoId,
    activeBO,
    branchOffices,
    canInputTarget,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isBoDropdownOpen, setIsBoDropdownOpen] = useState(false);

  const isSuperadmin = currentUser.role === 'superadmin';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-lg font-bold tracking-tight text-slate-900 hover:text-slate-700 transition-colors flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            BO-OPS
          </button>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Ringkasan
          </button>

          <button
            onClick={() => setActiveTab('target_list')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'target_list'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Breakdown Target
          </button>

          <button
            onClick={() => setActiveTab('sdm')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sdm'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>SDM Cabang</span>
            {!canInputTarget && (
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" title="SDM Wajib Diisi!" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('relasi')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'relasi'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Mitra Relasi
          </button>

          <button
            onClick={() => setActiveTab('produk_harga')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'produk_harga'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Matriks Harga Zona 1-13
          </button>

          <button
            onClick={() => setActiveTab('sql_migration')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sql_migration'
                ? 'bg-slate-100 text-slate-900 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
            <span>Skrip SQL Supabase</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions & User Role Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Tahun Anggaran Selector */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setActiveYear(2026)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeYear === 2026
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              TA 2026
            </button>
            <button
              onClick={() => setActiveYear(2027)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeYear === 2027
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              TA 2027
            </button>
          </div>

          {/* Quick Target Entry CTA */}
          <button
            onClick={onOpenTargetWizard}
            disabled={!canInputTarget}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              canInputTarget
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
            title={canInputTarget ? 'Buka Wizard Input Target Baru' : 'Input target terkunci: Isi data SDM BO terlebih dahulu'}
          >
            {canInputTarget ? <PlusCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>Input Target</span>
          </button>

          {/* Branch Office Selector (Enabled for Superadmin, locked for BM) */}
          <div className="relative">
            <button
              onClick={() => isSuperadmin && setIsBoDropdownOpen(!isBoDropdownOpen)}
              disabled={!isSuperadmin}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isSuperadmin
                  ? 'border-slate-300 hover:border-slate-400 bg-white text-slate-800'
                  : 'border-slate-200 bg-slate-50 text-slate-600 cursor-default'
              }`}
              title={isSuperadmin ? 'Pilih Kantor Cabang (Superadmin)' : 'Branch Manager hanya melihat BO cabang sendiri'}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="max-w-[130px] truncate font-semibold">
                {activeBO ? activeBO.kode_bo : 'BO'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                (Z{activeBO?.zona_id})
              </span>
              {isSuperadmin && <ChevronDown className="w-3 h-3 text-slate-400" />}
            </button>

            {isBoDropdownOpen && isSuperadmin && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setIsBoDropdownOpen(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pilih Branch Office (Superadmin)
                </div>
                {branchOffices.map((bo) => (
                  <button
                    key={bo.id}
                    onClick={() => {
                      setActiveBoId(bo.id);
                      setIsBoDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      bo.id === activeBoId
                        ? 'bg-blue-50 text-blue-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{bo.nama_bo}</div>
                      <div className="text-[11px] text-slate-500">{bo.wilayah} · Zona {bo.zona_id}</div>
                    </div>
                    {bo.id === activeBoId && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account / Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {currentUser.role === 'superadmin' ? 'SA' : 'BM'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-[11px] font-semibold text-slate-800 leading-tight">
                  {currentUser.role === 'superadmin' ? 'Superadmin' : 'Branch Manager'}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight">
                  {currentUser.role === 'superadmin' ? 'Akses Nasional' : currentUser.assigned_bo_nama?.split(' ')[2] || 'Cabang'}
                </div>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setIsRoleDropdownOpen(false)}
              >
                <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Simulasi Hak Akses (Role Switcher)
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Ganti role untuk menguji aturan alur & isolasi data BO:
                  </div>
                </div>

                <div className="space-y-1">
                  {availableUsers.map((user) => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUser(user);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-start gap-2.5 ${
                          isSelected
                            ? 'bg-blue-50 text-blue-950 font-medium border border-blue-200/60'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                            user.role === 'superadmin'
                              ? 'bg-slate-900 text-white'
                              : user.assigned_bo_id === 'bo-bpn-006'
                              ? 'bg-rose-700 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {user.role === 'superadmin' ? 'SA' : 'BM'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 truncate">{user.nama}</div>
                          <div className="text-[11px] text-slate-500">
                            {user.role === 'superadmin' ? 'Akses Seluruh BO se-Indonesia' : user.assigned_bo_nama}
                          </div>
                          {user.assigned_bo_id === 'bo-bpn-006' && (
                            <span className="text-[10px] text-rose-700 font-medium mt-0.5 block">
                              ⚠️ Uji Gatekeeper Rule (0 SDM Terdaftar)
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex lg:hidden overflow-x-auto px-4 py-2 border-t border-slate-100 gap-1 scrollbar-none bg-slate-50/50">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'dashboard' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('target_list')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'target_list' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600'
          }`}
        >
          Breakdown Target
        </button>
        <button
          onClick={() => setActiveTab('sdm')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'sdm' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600'
          }`}
        >
          SDM Cabang
        </button>
        <button
          onClick={() => setActiveTab('relasi')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'relasi' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600'
          }`}
        >
          Mitra Relasi
        </button>
        <button
          onClick={() => setActiveTab('produk_harga')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'produk_harga' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600'
          }`}
        >
          Matriks Zona
        </button>
        <button
          onClick={() => setActiveTab('sql_migration')}
          className={`px-3 py-1 text-xs font-medium rounded whitespace-nowrap ${
            activeTab === 'sql_migration' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600'
          }`}
        >
          Skrip SQL
        </button>
      </div>
    </header>
  );
};
