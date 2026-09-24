import * as XLSX from 'xlsx';
import {
  ImportTableType,
  ImportRowError,
  ImportJobReport,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
  TargetPenjualanDetail,
} from '../types';
import { calculateTargetColumns } from './calculations';

// 1. Column Schemas & Templates for each Table
export const IMPORT_TEMPLATES: Record<
  ImportTableType,
  {
    name: string;
    description: string;
    columns: string[];
    sampleData: Record<string, any>[];
    uniqueKey: string;
  }
> = {
  master_bo: {
    name: 'Master Branch Office (BO)',
    description: 'Data kantor cabang operasional dan penetapan zona logistik 1-13.',
    columns: ['kode_bo', 'nama_bo', 'zona_id', 'wilayah', 'alamat'],
    uniqueKey: 'kode_bo',
    sampleData: [
      {
        kode_bo: 'BO-SBY',
        nama_bo: 'Branch Office Surabaya',
        zona_id: 2,
        wilayah: 'Jawa Timur',
        alamat: 'Jl. Rungkut Industri No. 45, Surabaya',
      },
      {
        kode_bo: 'BO-MDN',
        nama_bo: 'Branch Office Medan',
        zona_id: 4,
        wilayah: 'Sumatera Utara',
        alamat: 'Jl. Gatot Subroto No. 88, Medan',
      },
      {
        kode_bo: 'BO-JPR',
        nama_bo: 'Branch Office Jayapura',
        zona_id: 13,
        wilayah: 'Papua',
        alamat: 'Jl. Sam Ratulangi No. 12, Jayapura',
      },
    ],
  },
  master_sdm: {
    name: 'Master SDM & Sales',
    description: 'Data personil cabang, tim sales, dan sales placeholder (SR).',
    columns: ['kode_bo', 'nama', 'jabatan', 'no_hp', 'wilayah_kerja', 'is_placeholder', 'kode_placeholder'],
    uniqueKey: 'nama',
    sampleData: [
      {
        kode_bo: 'BO-SBY',
        nama: 'Bambang Triatmojo',
        jabatan: 'Sales',
        no_hp: '0812-3456-7890',
        wilayah_kerja: 'Surabaya Timur & Sidoarjo',
        is_placeholder: 'TIDAK',
        kode_placeholder: '',
      },
      {
        kode_bo: 'BO-SBY',
        nama: 'SRBaru-SBY-01',
        jabatan: 'Sales',
        no_hp: '-',
        wilayah_kerja: 'Area Gresik & Lamongan',
        is_placeholder: 'YA',
        kode_placeholder: 'SRBaru01',
      },
    ],
  },
  master_relasi: {
    name: 'Master Relasi (Sekolah / Mitra)',
    description: 'Data sekolah, K3S, MKKS, dinas pendidikan dengan default rabat.',
    columns: ['kode_bo', 'kode_relasi', 'nama_relasi', 'jenis_relasi', 'jenjang', 'alamat', 'kontak_person', 'no_kontak', 'default_rabat_persen'],
    uniqueKey: 'kode_relasi',
    sampleData: [
      {
        kode_bo: 'BO-SBY',
        kode_relasi: 'REL-SBY-001',
        nama_relasi: 'SD Negeri 1 Wonokromo',
        jenis_relasi: 'Sekolah',
        jenjang: 'SD/MI',
        alamat: 'Jl. Wonokromo No. 12, Surabaya',
        kontak_person: 'Drs. H. Mulyadi (Kepsek)',
        no_kontak: '0812-7777-1111',
        default_rabat_persen: 20,
      },
      {
        kode_bo: 'BO-SBY',
        kode_relasi: 'REL-SBY-002',
        nama_relasi: 'K3S Kecamatan Tegalsari',
        jenis_relasi: 'K3S',
        jenjang: 'SD/MI',
        alamat: 'Jl. Basuki Rahmat No. 5, Surabaya',
        kontak_person: 'Dra. Hj. Siti Aminah',
        no_kontak: '0813-8888-2222',
        default_rabat_persen: 25,
      },
    ],
  },
  master_produk: {
    name: 'Master Produk (Buku Pelajaran)',
    description: 'Katalog SKU buku, kurikulum, jenjang, jumlah halaman, dan parameter HPP (%).',
    columns: ['kode_sku', 'judul_buku', 'jenjang', 'mata_pelajaran', 'kurikulum', 'penulis', 'halaman', 'default_hpp_persen'],
    uniqueKey: 'kode_sku',
    sampleData: [
      {
        kode_sku: 'BK-KM-SD4-MTK',
        judul_buku: 'Matematika Pintar Kurikulum Merdeka Kelas 4 SD/MI',
        jenjang: 'SD/MI',
        mata_pelajaran: 'Matematika',
        kurikulum: 'Kurikulum Merdeka',
        penulis: 'Tim Guru Berprestasi',
        halaman: 180,
        default_hpp_persen: 35,
      },
      {
        kode_sku: 'BK-KM-SD4-IPA',
        judul_buku: 'IPAS Jelajah Nusantara Kelas 4 SD/MI',
        jenjang: 'SD/MI',
        mata_pelajaran: 'IPAS',
        kurikulum: 'Kurikulum Merdeka',
        penulis: 'Dr. Hendra Wijaya, M.Pd.',
        halaman: 210,
        default_hpp_persen: 35,
      },
    ],
  },
  master_harga: {
    name: 'Master Matriks Tarif Harga (Zona 1-13)',
    description: 'Tarif harga jual resmi buku per tahun anggaran dan zona logistik 1-13.',
    columns: ['kode_sku', 'tahun_anggaran', 'zona_id', 'harga_satuan'],
    uniqueKey: 'kode_sku_tahun_zona',
    sampleData: [
      {
        kode_sku: 'BK-KM-SD4-MTK',
        tahun_anggaran: 2026,
        zona_id: 1,
        harga_satuan: 78000,
      },
      {
        kode_sku: 'BK-KM-SD4-MTK',
        tahun_anggaran: 2026,
        zona_id: 2,
        harga_satuan: 81000,
      },
      {
        kode_sku: 'BK-KM-SD4-MTK',
        tahun_anggaran: 2026,
        zona_id: 13,
        harga_satuan: 125000,
      },
    ],
  },
  target_detail: {
    name: 'Target Penjualan Detail',
    description: 'Alokasi target penjualan buku per Sales, Relasi, Qty, dan parameter rabat/BSR.',
    columns: [
      'kode_bo',
      'nama_sales',
      'kode_relasi',
      'kode_sku',
      'tahun_anggaran',
      'qty',
      'persen_keyakinan',
      'persen_rabat',
      'persen_bsr',
      'catatan',
    ],
    uniqueKey: 'bo_sales_relasi_sku',
    sampleData: [
      {
        kode_bo: 'BO-SBY',
        nama_sales: 'Bambang Triatmojo',
        kode_relasi: 'REL-SBY-001',
        kode_sku: 'BK-KM-SD4-MTK',
        tahun_anggaran: 2026,
        qty: 450,
        persen_keyakinan: 85,
        persen_rabat: 20,
        persen_bsr: 5,
        catatan: 'Pengadaan Semester 1 Tahun Ajaran Baru',
      },
    ],
  },
};

// 2. Download Template (.xlsx or .csv)
export function downloadTemplateFile(tableType: ImportTableType, format: 'xlsx' | 'csv' = 'xlsx') {
  const template = IMPORT_TEMPLATES[tableType];
  if (!template) return;

  const worksheet = XLSX.utils.json_to_sheet(template.sampleData, {
    header: template.columns,
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const fileName = `Template_${tableType}_${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === 'csv') {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    XLSX.writeFile(workbook, fileName);
  }
}

// 3. Export Error Report to CSV
export function downloadErrorReport(report: ImportJobReport) {
  if (report.errors.length === 0) return;

  const rows = report.errors.map((e) => ({
    'Baris Ke': e.rowNumber,
    'Kode / Identitas': e.identifier,
    'Alasan Kegagalan / Validasi': e.reason,
    'Data Mentah': JSON.stringify(e.dataSnippet || {}),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Error_Report');

  const fileName = `Laporan_Error_${report.tableName}_${Date.now()}.csv`;
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// 4. File Reader & Fast Sheet Parser
export async function parseUploadedSpreadsheet(file: File): Promise<{
  headers: string[];
  rows: Record<string, any>[];
  totalRows: number;
}> {
  // File size check: up to 50MB
  if (file.size > 50 * 1024 * 1024) {
    throw new Error('Ukuran file melebihi batas maksimum 50MB.');
  }

  // File extension check
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
    throw new Error('Format file tidak didukung. Harap gunakan file .csv, .xlsx, atau .xls');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File tidak memiliki sheet / lembar kerja.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false,
    blankrows: false,
  });

  if (rawJson.length === 0) {
    throw new Error('Lembar kerja kosong atau tidak memiliki data.');
  }

  // Clean and normalize headers (lowercase, trimmed)
  const sample = rawJson[0] || {};
  const headers = Object.keys(sample).map((h) => h.trim());

  // Normalize row keys to trimmed lowercase for robust matching
  const rows = rawJson.map((row) => {
    const cleanRow: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      cleanRow[key.trim().toLowerCase()] = typeof val === 'string' ? val.trim() : val;
    }
    return cleanRow;
  });

  return {
    headers,
    rows,
    totalRows: rows.length,
  };
}

// 5. Chunk Array Helper for Safe Asynchronous Batch Ingestion
export function chunkArray<T>(items: T[], chunkSize: number = 1000): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}
