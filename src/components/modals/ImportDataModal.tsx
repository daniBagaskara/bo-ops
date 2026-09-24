import React, { useState, useRef } from 'react';
import {
  ImportTableType,
  ImportMode,
  ImportJobReport,
} from '../../types';
import {
  IMPORT_TEMPLATES,
  downloadTemplateFile,
  parseUploadedSpreadsheet,
  downloadErrorReport,
} from '../../utils/importExportUtils';
import { batchImportService } from '../../services/batchImportService';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  FileDown,
  Layers,
  Check,
} from 'lucide-react';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableType: ImportTableType;
  onImportSuccess: () => void;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({
  isOpen,
  onClose,
  tableType,
  onImportSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{
    headers: string[];
    rows: Record<string, any>[];
    totalRows: number;
  } | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('upsert');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRowCount, setTotalRowCount] = useState(0);
  const [currentBatchNum, setCurrentBatchNum] = useState(0);
  const [totalBatchNum, setTotalBatchNum] = useState(0);
  const [report, setReport] = useState<ImportJobReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const templateConfig = IMPORT_TEMPLATES[tableType];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setReport(null);
    setSelectedFile(file);

    try {
      const parsed = await parseUploadedSpreadsheet(file);
      setParsedData(parsed);
      setTotalRowCount(parsed.totalRows);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal membaca isi berkas spreadsheet.');
      setSelectedFile(null);
      setParsedData(null);
    }
  };

  const handleStartImport = async () => {
    if (!parsedData || parsedData.rows.length === 0) {
      setErrorMsg('Tidak ada baris data yang siap diimpor.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setProcessStatus('Mempersiapkan batch dan validasi data...');

    try {
      setProcessStatus('Memproses dan menyinkronkan data ke Supabase...');
      const resultReport = await batchImportService.executeBatchImport(
        tableType,
        parsedData.rows,
        importMode,
        (processed, total, curBatch, totalBatches) => {
          setProcessedCount(processed);
          setTotalRowCount(total);
          setCurrentBatchNum(curBatch);
          setTotalBatchNum(totalBatches);
          setProcessStatus(`Memproses batch ${curBatch} dari ${totalBatches} (${processed} baris sukses)`);
        }
      );

      setReport(resultReport);
      setIsProcessing(false);
      setProcessStatus('Proses impor selesai.');

      if (resultReport.successCount > 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses data batch.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setParsedData(null);
    setReport(null);
    setErrorMsg(null);
    setIsProcessing(false);
    setProcessedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const percentProgress =
    totalRowCount > 0 ? Math.min(100, Math.round((processedCount / totalRowCount) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Impor Data: {templateConfig?.name || tableType}
              </h3>
              <p className="text-xs text-slate-500">
                Mendukung berkas format .CSV, .XLSX, dan .XLS hingga 600.000 baris.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Step 1: Template download banner */}
          <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-900">
                Unduh Format / Template Data Resmi
              </p>
              <p className="text-[11px] text-blue-700">
                Pastikan nama kolom sesuai format template agar tidak terjadi galat pada proses validasi.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => downloadTemplateFile(tableType, 'xlsx')}
                className="inline-flex items-center px-2.5 py-1.5 bg-white text-blue-700 border border-blue-300 rounded-md text-xs font-medium hover:bg-blue-50 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                Template Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => downloadTemplateFile(tableType, 'csv')}
                className="inline-flex items-center px-2.5 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-md text-xs font-medium hover:bg-slate-50 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                CSV (.csv)
              </button>
            </div>
          </div>

          {/* Error Message banner */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Step 2: Upload dropzone */}
          {!parsedData && !report && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
            >
              <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-800">
                Klik untuk memilih berkas atau seret berkas ke sini
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Format yang didukung: .xlsx, .xls, .csv (Maksimal 50MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* Step 3: Preview Data before Ingestion */}
          {parsedData && !report && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    {selectedFile?.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    ({parsedData.totalRows.toLocaleString('id-ID')} baris terdeteksi)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-600 font-medium">Mode:</span>
                    <select
                      value={importMode}
                      onChange={(e) => setImportMode(e.target.value as ImportMode)}
                      disabled={isProcessing}
                      className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium text-slate-800"
                    >
                      <option value="upsert">Update jika sudah ada (Upsert)</option>
                      <option value="insert">Tambah data baru saja</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isProcessing}
                    className="text-xs text-rose-600 hover:text-rose-800 underline"
                  >
                    Ganti Berkas
                  </button>
                </div>
              </div>

              {/* Data Preview Table (First 10 rows) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Pratinjau 10 Baris Pertama:
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {parsedData.headers.length} kolom terdeteksi
                  </span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-56">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 w-12 text-slate-400">#</th>
                        {parsedData.headers.map((h) => (
                          <th key={h} className="px-3 py-2 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {parsedData.rows.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-slate-400 text-[10px]">
                            {idx + 1}
                          </td>
                          {parsedData.headers.map((h) => (
                            <td
                              key={h}
                              className="px-3 py-1.5 truncate max-w-xs text-slate-700"
                            >
                              {row[h.toLowerCase()] ?? '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Batch Progress Indicator */}
              {isProcessing && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-blue-900 font-medium">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>{processStatus}</span>
                    </div>
                    <span>{percentProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${percentProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Memproses batch asinkron (500 baris per transaksi) untuk mencegah batas memori.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Final Report View */}
          {report && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  report.failedCount === 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {report.failedCount === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <h4 className="text-sm font-bold text-slate-900">
                    Laporan Hasil Proses Impor Data
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-3 my-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">Total Baris</p>
                    <p className="text-lg font-bold text-slate-900">
                      {report.totalRows.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-200 text-center">
                    <p className="text-[11px] text-emerald-700 font-medium">Berhasil Disimpan</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {report.successCount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-rose-200 text-center">
                    <p className="text-[11px] text-rose-700 font-medium">Gagal / Dilewati</p>
                    <p className="text-lg font-bold text-rose-600">
                      {report.failedCount.toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600">
                  Waktu pemrosesan: {(report.durationMs / 1000).toFixed(2)} detik
                </p>
              </div>

              {/* Error Rows Table & Download Button */}
              {report.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800">
                      Daftar Baris yang Mengalami Galat ({report.errors.length}):
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadErrorReport(report)}
                      className="inline-flex items-center px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700 shadow-2xs"
                    >
                      <FileDown className="w-3.5 h-3.5 mr-1" />
                      Unduh Laporan Error (.csv)
                    </button>
                  </div>

                  <div className="border border-rose-200 rounded-lg overflow-x-auto max-h-48">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-rose-100 text-rose-900 sticky top-0 font-semibold">
                        <tr>
                          <th className="px-3 py-1.5 w-16">Baris</th>
                          <th className="px-3 py-1.5 w-32">Identitas</th>
                          <th className="px-3 py-1.5">Keterangan Galat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100">
                        {report.errors.slice(0, 50).map((err, i) => (
                          <tr key={i} className="hover:bg-rose-50/50">
                            <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">
                              {err.rowNumber}
                            </td>
                            <td className="px-3 py-1.5 font-medium text-slate-800">
                              {err.identifier}
                            </td>
                            <td className="px-3 py-1.5 text-rose-700 text-[11px]">
                              {err.reason}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50"
          >
            {report ? 'Tutup' : 'Batal'}
          </button>

          {!report && parsedData && (
            <button
              type="button"
              onClick={handleStartImport}
              disabled={isProcessing || parsedData.rows.length === 0}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Sedang Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Mulai Impor ({parsedData.totalRows.toLocaleString('id-ID')} Baris)
                </>
              )}
            </button>
          )}

          {report && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium"
            >
              Impor Berkas Lain
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
