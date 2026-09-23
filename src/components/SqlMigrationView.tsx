import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPABASE_SQL_MIGRATION } from '../data/supabaseSqlScript';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Database,
  Shield,
  Layers,
  Sparkles,
  Cpu,
  Key,
} from 'lucide-react';

export const SqlMigrationView: React.FC = () => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopied(true);
    showToast('success', 'Skrip SQL Berhasil Disalin', 'Siap ditempelkan pada SQL Editor di Supabase Dashboard.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([SUPABASE_SQL_MIGRATION], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bo_ops_supabase_migration.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'File SQL Terunduh', 'File bo_ops_supabase_migration.sql berhasil disimpan.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Arsitektur Database Supabase PostgreSQL</span>
            <span aria-hidden="true">·</span>
            <span>Tugas Utama 1: Skrip SQL Migration Lengkap</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-0.5">
            Skrip SQL Migration & Keamanan Row Level Security (RLS)
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Skema ternormalisasi lengkap untuk Supabase PostgreSQL dengan dukungan <strong>Generated Always Columns</strong> untuk kalkulasi formula otomatis, <strong>Database Gatekeeper Trigger</strong>, dan <strong>Row Level Security (RLS)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copied ? 'Tersalin!' : 'Salin Skrip SQL'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File .SQL</span>
          </button>
        </div>
      </div>

      {/* Database Highlights Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Skema Ternormalisasi (6 Tabel)</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Memisahkan master metadata produk dari matriks harga (Zona 1 s.d. 13 & multi-tahun) dengan composite unique constraint untuk mencegah inkonsistensi.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>Generated Stored Columns</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Formula perhitungan otomatis (Brutto, Rabat, BSR, Netto, HPP, Laba Kotor, & Nilai Tertimbang) dieksekusi di level database via <code>GENERATED ALWAYS AS ... STORED</code>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Shield className="w-4 h-4 text-purple-600" />
            <span>Gatekeeper DB Trigger & RLS</span>
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Trigger <code>trg_gatekeeper_target_insert</code> memblokir insert jika SDM BO kosong. Dilengkapi RLS policies membedakan Superadmin (akses nasional) vs BM (isolasi cabang).
          </p>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-xs font-mono text-slate-300 ml-2 font-semibold">bo_ops_supabase_migration.sql</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">/bo_ops_supabase_migration.sql</span>
          </div>
          <button
            onClick={handleCopy}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-mono transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Copy'}</span>
          </button>
        </div>

        <div className="p-5 overflow-x-auto max-h-[600px] overflow-y-auto scrollbar-thin">
          <pre className="text-xs font-mono text-slate-200 leading-relaxed">
            {SUPABASE_SQL_MIGRATION}
          </pre>
        </div>
      </div>
    </div>
  );
};
