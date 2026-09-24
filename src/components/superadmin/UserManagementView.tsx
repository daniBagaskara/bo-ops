import React, { useState, useEffect } from 'react';
import { AppUser, MasterBO, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import {
  UserCog,
  Plus,
  Search,
  KeyRound,
  Edit2,
  CheckCircle2,
  XCircle,
  Shield,
  Building2,
  RefreshCw,
  X,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface UserManagementViewProps {
  branchOffices: MasterBO[];
  onShowToast: (type: 'success' | 'warning' | 'error' | 'info', title: string, message: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  branchOffices,
  onShowToast,
}) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [resettingUser, setResettingUser] = useState<AppUser | null>(null);

  // Form states for Add User
  const [addForm, setAddForm] = useState({
    nama: '',
    email: '',
    role: 'branch_manager' as UserRole,
    bo_id: branchOffices[0]?.id || '',
    password: '',
  });

  // Form states for Edit User
  const [editForm, setEditForm] = useState({
    nama: '',
    role: 'branch_manager' as UserRole,
    bo_id: '',
    status_aktif: true,
  });

  // Form states for Reset Password
  const [resetForm, setResetForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Load users from Cloud SQL
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (err: any) {
      onShowToast('error', 'Gagal Memuat Pengguna', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Handle Add User
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.nama || !addForm.email || !addForm.password) {
      onShowToast('warning', 'Validasi Gagal', 'Semua kolom wajib diisi.');
      return;
    }

    if (addForm.role === 'branch_manager' && !addForm.bo_id) {
      onShowToast('warning', 'Validasi Gagal', 'Pilih kantor cabang untuk Branch Manager.');
      return;
    }

    setIsLoading(true);
    try {
      const created = await apiService.createUser({
        nama: addForm.nama,
        email: addForm.email,
        password: addForm.password,
        role: addForm.role,
        bo_id: addForm.role === 'branch_manager' ? addForm.bo_id : null,
      });

      setUsers((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setAddForm({
        nama: '',
        email: '',
        role: 'branch_manager',
        bo_id: branchOffices[0]?.id || '',
        password: '',
      });
      onShowToast('success', 'Pengguna Ditambahkan', `Akun ${created.email} berhasil dibuat.`);
    } catch (err: any) {
      onShowToast('error', 'Gagal Membuat Pengguna', err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsLoading(true);
    try {
      const updated = await apiService.updateUser(editingUser.id, {
        nama: editForm.nama,
        role: editForm.role,
        bo_id: editForm.role === 'branch_manager' ? editForm.bo_id : null,
        status_aktif: editForm.status_aktif,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                nama: updated.nama,
                role: updated.role,
                bo_id: updated.bo_id,
                bo_nama:
                  updated.role === 'branch_manager'
                    ? branchOffices.find((b) => b.id === updated.bo_id)?.nama_bo
                    : undefined,
                status_aktif: updated.status_aktif,
              }
            : u
        )
      );

      setEditingUser(null);
      onShowToast('success', 'Pengguna Diperbarui', 'Data profil pengguna berhasil disimpan.');
    } catch (err: any) {
      onShowToast('error', 'Gagal Memperbarui', err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (resetForm.newPassword.length < 6) {
      onShowToast('warning', 'Sandi Terlalu Pendek', 'Kata sandi minimal 6 karakter.');
      return;
    }

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      onShowToast('warning', 'Sandi Tidak Cocok', 'Konfirmasi kata sandi tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      await apiService.resetPassword(resettingUser.id, resetForm.newPassword);
      setResettingUser(null);
      setResetForm({ newPassword: '', confirmPassword: '' });
      onShowToast('success', 'Sandi Direset', `Kata sandi untuk ${resettingUser.email} berhasil diubah.`);
    } catch (err: any) {
      onShowToast('error', 'Gagal Reset Sandi', err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle User Active Status
  const handleToggleStatus = async (user: AppUser) => {
    const newStatus = !user.status_aktif;
    try {
      await apiService.toggleUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status_aktif: newStatus } : u))
      );
      onShowToast(
        'info',
        newStatus ? 'Pengguna Diaktifkan' : 'Pengguna Dinonaktifkan',
        `Status ${user.nama} sekarang ${newStatus ? 'Aktif' : 'Nonaktif'}.`
      );
    } catch (err: any) {
      onShowToast('error', 'Gagal Mengubah Status', err.message);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        u.nama.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.bo_nama && u.bo_nama.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-blue-600" />
            Manajemen Pengguna & Hak Akses
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola akun operasional Super Admin pusat dan Branch Manager (BM) per wilayah cabang.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Muat ulang pengguna"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Tambah Pengguna
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, atau cabang..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Peran:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium text-slate-700"
          >
            <option value="ALL">Semua Peran ({users.length})</option>
            <option value="superadmin">Super Admin</option>
            <option value="branch_manager">Branch Manager</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Nama & Kontak</th>
                <th className="px-4 py-3">Peran Akses</th>
                <th className="px-4 py-3">Penugasan Kantor Cabang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada pengguna yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSA = user.role === 'superadmin';
                  const boObj = branchOffices.find((b) => b.id === user.bo_id);
                  const boLabel = user.bo_nama || boObj?.nama_bo || '-';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{user.nama}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {isSA ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Shield className="w-3 h-3 text-blue-600" />
                            Super Admin (Pusat)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Building2 className="w-3 h-3 text-amber-600" />
                            Branch Manager
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {isSA ? (
                          <span className="text-slate-400 italic">Seluruh Wilayah (Nasional)</span>
                        ) : (
                          <span className="font-medium">{boLabel}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                            user.status_aktif
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                          }`}
                          title="Klik untuk mengubah status aktif"
                        >
                          {user.status_aktif ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Nonaktif
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setEditForm({
                                nama: user.nama,
                                role: user.role,
                                bo_id: user.bo_id || branchOffices[0]?.id || '',
                                status_aktif: user.status_aktif,
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Data Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setResettingUser(user);
                              setResetForm({ newPassword: '', confirmPassword: '' });
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            title="Reset Kata Sandi"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
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

      {/* MODAL 1: Tambah Pengguna */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <UserCog className="w-4 h-4 text-blue-600" />
                Tambah Pengguna Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addForm.nama}
                  onChange={(e) => setAddForm({ ...addForm, nama: e.target.value })}
                  placeholder="Contoh: Rahmat Hidayat, M.M."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="nama@edubranch.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Peran Akses <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm({ ...addForm, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="branch_manager">Branch Manager (BM) - Terbatas ke Cabang</option>
                  <option value="superadmin">Super Admin - Akses Penuh Nasional</option>
                </select>
              </div>

              {addForm.role === 'branch_manager' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kantor Cabang (BO) Penugasan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={addForm.bo_id}
                    onChange={(e) => setAddForm({ ...addForm, bo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {branchOffices.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.kode_bo} - {b.nama_bo} (Zona {b.zona_id})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Kata Sandi Awal <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-blue-600" />
                Edit Profil: {editingUser.email}
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Peran Akses</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="branch_manager">Branch Manager (BM)</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {editForm.role === 'branch_manager' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kantor Cabang Penugasan
                  </label>
                  <select
                    value={editForm.bo_id}
                    onChange={(e) => setEditForm({ ...editForm, bo_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {branchOffices.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.kode_bo} - {b.nama_bo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusAktifCheck"
                  checked={editForm.status_aktif}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status_aktif: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="statusAktifCheck" className="text-xs font-medium text-slate-700">
                  Status Pengguna Aktif (Dapat masuk ke sistem)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  {isLoading ? 'Menyimpan...' : 'Perbarui Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Kata Sandi (Aman, tidak pernah menampilkan kata sandi lama) */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Reset Kata Sandi Pengguna
              </h3>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="p-4 space-y-3.5 text-xs">
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                Anda sedang mengubah kata sandi untuk akun{' '}
                <strong>{resettingUser.nama}</strong> ({resettingUser.email}). Kata sandi lama
                terenkripsi dan tidak dapat ditampilkan demi keamanan.
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={resetForm.newPassword}
                    onChange={(e) =>
                      setResetForm({ ...resetForm, newPassword: e.target.value })
                    }
                    placeholder="Minimal 6 karakter"
                    className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Ulangi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={resetForm.confirmPassword}
                  onChange={(e) =>
                    setResetForm({ ...resetForm, confirmPassword: e.target.value })
                  }
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
