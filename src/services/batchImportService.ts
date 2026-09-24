import {
  ImportTableType,
  ImportMode,
  ImportJobReport,
} from '../types';
import { supabaseService } from './supabaseService';

export const batchImportService = {
  async executeBatchImport(
    tableType: ImportTableType,
    rows: Record<string, any>[],
    mode: ImportMode = 'insert',
    onProgress?: (processed: number, total: number, currentBatch: number, totalBatches: number) => void
  ): Promise<ImportJobReport> {
    return supabaseService.executeBatchImport(tableType, rows, mode, onProgress);
  },

  async executeBatchImportWithFile(
    tableType: ImportTableType,
    file: File,
    mode: ImportMode = 'insert'
  ): Promise<ImportJobReport> {
    const { parseUploadedSpreadsheet } = await import('../utils/importExportUtils');
    const parsed = await parseUploadedSpreadsheet(file);
    return supabaseService.executeBatchImport(tableType, parsed.rows, mode);
  },
};
