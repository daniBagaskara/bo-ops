import React, { useState } from 'react';
import { UserProfile } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import {
  Lock,
  Mail,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  RefreshCw,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

interface AuthPageProps {
  onLogin: (user: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage('Silakan isi alamat email dan kata sandi.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await supabaseService.login(cleanEmail, cleanPass);
      onLogin(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Email atau kata sandi tidak sesuai.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const user = await supabaseService.login(presetEmail, presetPass);
      onLogin(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">BO-OPS</span>
        </div>
        <h2 className="text-center text-lg font-semibold text-slate-900">
          Sistem Operasional Kantor Cabang
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Masuk dengan akun terdaftar di database Supabase
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs">
          {/* Notification Messages */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="superadmin@edubranch.id"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  'Masuk ke Akun'
                )}
              </button>
            </div>
          </form>

          {/* Quick-fill & 1-Click Login Helper */}
          <div className="mt-6 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                Akses Cepat Pengguna (Supabase):
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk masuk langsung</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('superadmin@edubranch.id', 'admin123')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <span className="font-medium text-slate-800 group-hover:text-blue-700">Superadmin Pusat</span>
                  <span className="block text-[11px] text-slate-500 font-mono">superadmin@edubranch.id</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">Superadmin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bm.surabaya@edubranch.id', 'bm123')}
                disabled={isLoading}
                className="w-full text-left p-2.5 rounded-md bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors flex items-center justify-between text-xs group"
              >
                <div>
                  <span className="font-medium text-slate-800 group-hover:text-emerald-700">Ahmad Fauzi (BM Surabaya)</span>
                  <span className="block text-[11px] text-slate-500 font-mono">bm.surabaya@edubranch.id</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">BM Cabang</span>
              </button>
            </div>

            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-500 border-t border-slate-200/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Database: Terhubung langsung ke Supabase PostgreSQL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
