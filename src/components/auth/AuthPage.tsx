import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { USER_MIGRATION_SQL } from '../../data/userMigrationSql';
import {
  Lock,
  Mail,
  User,
  Shield,
  Building2,
  Eye,
  EyeOff,
  Code2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nama, setNama] = useState('');
  const [role, setRole] = useState<'superadmin' | 'branch_manager'>('superadmin');
  const [boNama, setBoNama] = useState('Branch Office Surabaya (Zona 2)');
  const [boId, setBoId] = useState('b0000000-0000-0000-0000-000000000001');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // SQL Migration modal
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(USER_MIGRATION_SQL);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFillPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Silakan isi email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      if (isRegisterMode) {
        if (!nama.trim()) {
          setErrorMessage('Silakan isi nama lengkap.');
          setIsLoading(false);
          return;
        }

        const res = await supabaseService.registerUser({
          email: email.trim(),
          password: password.trim(),
          nama: nama.trim(),
          role,
          bo_id: role === 'branch_manager' ? boId : null,
        });

        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.user) {
          setSuccessMessage('Pendaftaran berhasil! Mengalihkan ke dashboard...');
          setTimeout(() => {
            onLogin({
              id: res.user.id,
              email: res.user.email,
              nama: res.user.nama,
              role: res.user.role,
              assigned_bo_id: res.user.assigned_bo_id,
              assigned_bo_nama: res.user.role === 'branch_manager' ? boNama : undefined,
            });
          }, 800);
        }
      } else {
        // Direct Login
        const res = await supabaseService.loginUser(email, password);
        if (res.error) {
          setErrorMessage(res.error);
        } else if (res.user) {
          onLogin({
            id: res.user.id,
            email: res.user.email,
            nama: res.user.nama,
            role: res.user.role,
            assigned_bo_id: res.user.assigned_bo_id,
            assigned_bo_nama: res.user.role === 'branch_manager' ? boNama : undefined,
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat autentikasi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">BO-OPS</span>
        </div>
        <h2 className="text-center text-lg font-semibold text-slate-900">
          {isRegisterMode ? 'Pendaftaran Pengguna Baru' : 'Masuk ke Sistem'}
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          {isRegisterMode
            ? 'Buat akun Superadmin atau Branch Manager untuk akses database'
            : 'Masukkan kredensial email dan kata sandi akun Anda'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs">
          {/* Notification Messages */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      placeholder="Nama lengkap Anda..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Hak Akses (Role) <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('superadmin')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                        role === 'superadmin'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Superadmin
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('branch_manager')}
                      className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-colors ${
                        role === 'branch_manager'
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Branch Manager
                    </button>
                  </div>
                </div>

                {role === 'branch_manager' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Kantor Cabang yang Dikelola
                    </label>
                    <select
                      value={boId}
                      onChange={(e) => {
                        setBoId(e.target.value);
                        if (e.target.value === 'b0000000-0000-0000-0000-000000000001') {
                          setBoNama('Branch Office Surabaya (Zona 2)');
                        } else if (e.target.value === 'b0000000-0000-0000-0000-000000000002') {
                          setBoNama('Branch Office Malang (Zona 2)');
                        } else {
                          setBoNama('Branch Office Jayapura (Zona 13)');
                        }
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="b0000000-0000-0000-0000-000000000001">
                        BO Surabaya (Zona 2 - Jawa Timur)
                      </option>
                      <option value="b0000000-0000-0000-0000-000000000002">
                        BO Malang (Zona 2 - Jawa Timur Selatan)
                      </option>
                      <option value="b0000000-0000-0000-0000-000000000003">
                        BO Jayapura (Zona 13 - Papua)
                      </option>
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Alamat Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@edubranch.id"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kata Sandi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label="Lihat kata sandi"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Memproses...
                </>
              ) : isRegisterMode ? (
                'Daftar Sekarang'
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              {isRegisterMode ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
            >
              {isRegisterMode ? 'Masuk di sini' : 'Daftar pengguna'}
            </button>
          </div>

          {/* Clean helper box for default user & password */}
          <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
              Kredensial Bawaan Database:
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800">Superadmin:</span>{' '}
                <span className="font-mono text-[11px] text-slate-600">superadmin@edubranch.id</span> (sandi: <span className="font-mono text-slate-700">admin123</span>)
              </div>
              <button
                type="button"
                onClick={() => handleFillPreset('superadmin@edubranch.id', 'admin123')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium ml-2 shrink-0"
              >
                Isi
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800">Branch Manager:</span>{' '}
                <span className="font-mono text-[11px] text-slate-600">bm.surabaya@edubranch.id</span> (sandi: <span className="font-mono text-slate-700">bm123</span>)
              </div>
              <button
                type="button"
                onClick={() => handleFillPreset('bm.surabaya@edubranch.id', 'bm123')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium ml-2 shrink-0"
              >
                Isi
              </button>
            </div>
          </div>
        </div>

        {/* SQL Migration Link button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <Code2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Lihat Skrip Migrasi SQL Tabel Pengguna (Supabase)
          </button>
        </div>
      </div>

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Skrip Migrasi Supabase SQL: Tabel Pengguna (`app_users`)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Salin skrip SQL ini dan jalankan di <strong>SQL Editor</strong> dasbor Supabase Anda
                (<span className="font-mono text-slate-700">https://cxwxotsstnnfmaivybbq.supabase.co</span>)
                untuk membuat tabel <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">app_users</code>,
                mengaktifkan RLS, serta menyisipkan akun bawaan Superadmin & Branch Manager.
              </p>

              <div className="relative">
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono max-h-72 overflow-y-auto leading-relaxed border border-slate-800">
                  {USER_MIGRATION_SQL}
                </pre>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium border border-slate-700 inline-flex items-center gap-1 transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin SQL
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
