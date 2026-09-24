import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw, CheckCircle, Database } from 'lucide-react';

interface ClearDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => Promise<void>;
  onConfirmSeed: () => Promise<void>;
}

export const ClearDatabaseModal: React.FC<ClearDatabaseModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  onConfirmSeed,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleClear = async () => {
    setIsDeleting(true);
    try {
      await onConfirmClear();
      onClose();
    } finally {
      setIsDeleting(false);
      setConfirmText('');
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await onConfirmSeed();
      onClose();
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-rose-50/70 border-b border-rose-100 flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Kosongkan / Clear Semua Data Database
            </h3>
            <p className="text-xs text-rose-700 mt-1">
              Perhatian: Operasi ini akan menghapus seluruh rekaman data pada database Supabase.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-slate-600">
          <p>
            Tindakan ini akan mengeksekusi penghapusan data secara berurutan pada <strong>6 tabel Supabase</strong>:
          </p>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 font-mono text-xs space-y-1.5 text-slate-700">
            <div className="flex items-center text-slate-800 font-medium">
              <span className="w-5 text-slate-400">1.</span>
              <span>target_penjualan_detail</span>
              <span className="ml-auto text-[10px] text-slate-500">(Target & Kalkulasi)</span>
            </div>
            <div className="flex items-center text-slate-800 font-medium">
              <span className="w-5 text-slate-400">2.</span>
              <span>master_produk_harga</span>
              <span className="ml-auto text-[10px] text-slate-500">(Matriks Tarif Zona 1-13)</span>
            </div>
            <div className="flex items-center text-slate-800 font-medium">
              <span className="w-5 text-slate-400">3.</span>
              <span>master_relasi</span>
              <span className="ml-auto text-[10px] text-slate-500">(Sekolah & Mitra Relasi)</span>
            </div>
            <div className="flex items-center text-slate-800 font-medium">
              <span className="w-5 text-slate-400">4.</span>
              <span>master_sdm</span>
              <span className="ml-auto text-[10px] text-slate-500">(SDM & Sales Cabang)</span>
            </div>
            <div className="flex items-center text-slate-800 font-medium">
              <span className="w-5 text-slate-400">5.</span>
              <span>master_produk</span>
              <span className="ml-auto text-[10px] text-slate-500">(Buku & SKU)</span>
            </div>
            <div className="flex items-center text-slate-800 font-medium">
              <span className="w-5 text-slate-400">6.</span>
              <span>master_bo</span>
              <span className="ml-auto text-[10px] text-slate-500">(Branch Office)</span>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Ketik <span className="font-bold text-rose-600 select-all">CLEAR ALL</span> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="CLEAR ALL"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleSeed}
            disabled={isDeleting || isSeeding}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            title="Muat data contoh default ke database"
          >
            {isSeeding ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5 mr-1.5" />
            )}
            Seed Data Awal
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting || isSeeding}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg bg-white hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={confirmText.trim().toUpperCase() !== 'CLEAR ALL' || isDeleting || isSeeding}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Hapus Semua Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
