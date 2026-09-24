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
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-xs border-b border-slate-200/80 h-16 flex items-center justify-between px-6 sm:px-8">
      {/* Left section: Sidebar Toggle */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle Menu Navigasi"
          title="Buka / Tutup Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand indicator (only shown when sidebar is closed on small screens) */}
        <div className="md:hidden flex items-center gap-2 pl-1">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            BO-OPS
          </span>
        </div>
      </div>

      {/* Right section: User info & Logout */}
      <div className="flex items-center space-x-4 sm:space-x-5">
        {/* User Role Badge */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              {currentUser.nama}
            </p>
            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
              {isSuperAdmin
                ? 'Kantor Pusat'
                : currentUser.assigned_bo_nama || 'Branch Office'}
            </p>
          </div>

          <div
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 ${
              isSuperAdmin
                ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                : 'bg-amber-50 text-amber-800 border border-amber-200/80'
            }`}
          >
            {isSuperAdmin ? (
              <>
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Super Admin</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-amber-600" />
                <span>Branch Manager</span>
              </>
            )}
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Clean Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs"
          title="Keluar dari sesi akun"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};
