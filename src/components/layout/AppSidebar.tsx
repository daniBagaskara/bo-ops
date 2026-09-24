import React from 'react';
import { AppNavKey, UserProfile } from '../../types';
import {
  LayoutDashboard,
  Building2,
  Users,
  Building,
  BookOpen,
  DollarSign,
  Target,
  UserCog,
  ChevronLeft,
  ChevronRight,
  X,
  Shield,
  Layers,
} from 'lucide-react';

interface AppSidebarProps {
  currentNav: AppNavKey;
  onSelectNav: (nav: AppNavKey) => void;
  currentUser: UserProfile;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  counts?: {
    bo?: number;
    sdm?: number;
    relasi?: number;
    produk?: number;
    harga?: number;
    target?: number;
    users?: number;
  };
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentNav,
  onSelectNav,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  counts,
}) => {
  const isSuperAdmin = currentUser.role === 'superadmin';

  interface MenuItem {
    key: AppNavKey;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    superAdminOnly?: boolean;
  }

  interface MenuGroup {
    title: string;
    superAdminOnly?: boolean;
    items: MenuItem[];
  }

  const menuGroups: MenuGroup[] = [
    {
      title: 'Ringkasan',
      items: [
        {
          key: 'dashboard_overview',
          label: 'Dashboard Operasional',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Master Data',
      superAdminOnly: true, // BM will NEVER see this group
      items: [
        {
          key: 'master_bo',
          label: 'Master BO',
          icon: Building2,
          count: counts?.bo,
        },
        {
          key: 'master_sdm',
          label: 'Master SDM / Sales',
          icon: Users,
          count: counts?.sdm,
        },
        {
          key: 'master_relasi',
          label: 'Master Relasi',
          icon: Building,
          count: counts?.relasi,
        },
        {
          key: 'master_produk',
          label: 'Master Produk',
          icon: BookOpen,
          count: counts?.produk,
        },
        {
          key: 'master_harga',
          label: 'Master Tarif Harga',
          icon: DollarSign,
          count: counts?.harga,
        },
      ],
    },
    {
      title: 'Operasional',
      items: [
        {
          key: 'target_operasional',
          label: 'Target Penjualan Detail',
          icon: Target,
          count: counts?.target,
        },
      ],
    },
    {
      title: 'Pengaturan',
      superAdminOnly: true, // BM will NEVER see this group
      items: [
        {
          key: 'manajemen_user',
          label: 'Manajemen User',
          icon: UserCog,
          count: counts?.users,
        },
      ],
    },
  ];

  const handleNavClick = (key: AppNavKey) => {
    onSelectNav(key);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Mobile Drawer Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-slate-900">Navigasi Sistem</span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          aria-label="Tutup menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuGroups
          .filter((group) => !group.superAdminOnly || isSuperAdmin)
          .map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.superAdminOnly || isSuperAdmin
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {/* Group Title */}
                {!isCollapsed && (
                  <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    {group.title}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = currentNav === item.key;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleNavClick(item.key)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold border-l-3 border-blue-600 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        } ${isCollapsed ? 'justify-center px-2' : ''}`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="flex-1 text-left truncate">{item.label}</span>
                        )}
                        {!isCollapsed && item.count !== undefined && item.count > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                              isActive
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Desktop Collapse Toggle Footer */}
      <div className="hidden md:flex p-3 border-t border-slate-200 bg-slate-50 items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-500 font-medium">
              {isSuperAdmin ? 'Akses Pusat' : 'Akses Cabang'}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors mx-auto"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          aria-label={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-200 ease-in-out ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="fixed top-16 bottom-0 z-20 transition-all duration-200 ease-in-out">
          <div className={`h-full ${isCollapsed ? 'w-16' : 'w-64'}`}>
            {sidebarContent}
          </div>
        </div>
      </aside>

      {/* 2. Mobile Drawer Backdrop & Container */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50 animate-in slide-in-from-left duration-200 shadow-xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
