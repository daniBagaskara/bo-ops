import React from 'react';
import { UserProfile } from '../../types';
import { Menu, LogOut, Shield, Building2, User } from 'lucide-react';

interface AppHeaderProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentUser,
  onLogout,
  onToggleSidebar,
}) => {
  const isSuperAdmin = currentUser.role === 'superadmin';

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6">
      {/* Left section: Toggle & Brand */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle Menu Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
              BO-OPS
              <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">
                | Sistem Operasional
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block leading-none">
              Penerbitan & Distribusi Buku Nasional
            </p>
          </div>
        </div>
      </div>

      {/* Right section: User info & Logout */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* User Role Badge */}
        <div className="flex items-center space-x-2">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {currentUser.nama}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              {isSuperAdmin
                ? 'Kantor Pusat'
                : currentUser.assigned_bo_nama || 'Branch Office'}
            </p>
          </div>

          <div
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 ${
              isSuperAdmin
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {isSuperAdmin ? (
              <>
                <Shield className="w-3 h-3 text-blue-600" />
                <span>Super Admin</span>
              </>
            ) : (
              <>
                <User className="w-3 h-3 text-amber-600" />
                <span>Branch Manager</span>
              </>
            )}
          </div>
        </div>

        {/* Clean Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-xs"
          title="Keluar dari sesi akun"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5 text-slate-400 group-hover:text-rose-600" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
