import { supabase } from '../lib/supabase';
import {
  ImportTableType,
  ImportMode,
  ImportRowError,
  ImportJobReport,
  MasterBO,
  MasterSDM,
  MasterRelasi,
  MasterProduk,
  MasterProdukHarga,
} from '../types';
import { chunkArray } from '../utils/importExportUtils';
import { calculateTargetColumns } from '../utils/calculations';

export const batchImportService = {
  async executeBatchImport(
    tableType: ImportTableType,
    rows: Record<string, any>[],
    mode: ImportMode,
    onProgress?: (processed: number, total: number, currentBatch: number, totalBatches: number) => void
  ): Promise<ImportJobReport> {
    const startTime = Date.now();
    const totalRows = rows.length;
    const errors: ImportRowError[] = [];
    let successCount = 0;

    // 1. Preload Foreign Key Lookups for referential integrity
    const [boList, sdmList, relasiList, produkList, hargaList] = await Promise.all([
      fetchLookupBO(),
      fetchLookupSDM(),
      fetchLookupRelasi(),
      fetchLookupProduk(),
      fetchLookupHarga(),
    ]);

    const boMapByCode = new Map<string, MasterBO>();
    boList.forEach((b) => boMapByCode.set(b.kode_bo.toUpperCase(), b));

    const sdmMapByName = new Map<string, MasterSDM>();
    sdmList.forEach((s) => sdmMapByName.set(`${s.bo_id}_${s.nama.toLowerCase()}`, s));

    const relasiMapByCode = new Map<string, MasterRelasi>();
    relasiList.forEach((r) => relasiMapByCode.set(r.kode_relasi.toUpperCase(), r));

    const produkMapBySku = new Map<string, MasterProduk>();
    produkList.forEach((p) => produkMapBySku.set(p.kode_sku.toUpperCase(), p));

    // 2. Validate and transform each row
    const validRecords: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // spreadsheet 1-indexed + header row

      try {
        switch (tableType) {
          case 'master_bo': {
            const kode = (row['kode_bo'] || '').toString().trim().toUpperCase();
            const nama = (row['nama_bo'] || '').toString().trim();
            const zona = parseInt(row['zona_id'], 10);
            const wilayah = (row['wilayah'] || '').toString().trim();
            const alamat = (row['alamat'] || '').toString().trim();

            if (!kode || !nama) {
              throw new Error('Kolom kode_bo dan nama_bo wajib diisi.');
            }
            if (isNaN(zona) || zona < 1 || zona > 13) {
              throw new Error(`Zona logistik (${row['zona_id']}) tidak valid. Harus antara 1 s.d. 13.`);
            }

            validRecords.push({
              kode_bo: kode,
              nama_bo: nama,
              zona_id: zona,
              wilayah: wilayah || 'Nasional',
              alamat: alamat || '-',
            });
            break;
          }

          case 'master_sdm': {
            const kodeBo = (row['kode_bo'] || '').toString().trim().toUpperCase();
            const nama = (row['nama'] || '').toString().trim();
            const jabatan = (row['jabatan'] || 'Sales').toString().trim();
            const noHp = (row['no_hp'] || '-').toString().trim();
            const wilayahKerja = (row['wilayah_kerja'] || '-').toString().trim();
            const isPlaceholderStr = (row['is_placeholder'] || 'TIDAK').toString().trim().toUpperCase();
            const isPlaceholder = isPlaceholderStr === 'YA' || isPlaceholderStr === 'TRUE' || isPlaceholderStr === '1';
            const kodePlaceholder = (row['kode_placeholder'] || '').toString().trim();

            if (!kodeBo || !nama) {
              throw new Error('Kolom kode_bo dan nama SDM wajib diisi.');
            }

            const bo = boMapByCode.get(kodeBo);
            if (!bo) {
              throw new Error(`Kantor cabang dengan kode '${kodeBo}' tidak ditemukan di Master BO.`);
            }

            validRecords.push({
              bo_id: bo.id,
              nama,
              jabatan: ['BM', 'WBM', 'BA', 'WH', 'Pimpas', 'Korpos', 'Sales'].includes(jabatan)
                ? jabatan
                : 'Sales',
              no_hp: noHp,
              wilayah_kerja: wilayahKerja,
              is_placeholder: isPlaceholder,
              kode_placeholder: isPlaceholder ? kodePlaceholder || 'SR-BARU' : null,
              status_aktif: true,
            });
            break;
          }

          case 'master_relasi': {
            const kodeBo = (row['kode_bo'] || '').toString().trim().toUpperCase();
            const kodeRelasi = (row['kode_relasi'] || '').toString().trim().toUpperCase();
            const namaRelasi = (row['nama_relasi'] || '').toString().trim();
            const jenis = (row['jenis_relasi'] || 'Sekolah').toString().trim();
            const jenjang = (row['jenjang'] || 'SD/MI').toString().trim();
            const alamat = (row['alamat'] || '-').toString().trim();
            const kontakPerson = (row['kontak_person'] || '-').toString().trim();
            const noKontak = (row['no_kontak'] || '-').toString().trim();
            const defaultRabat = parseFloat(row['default_rabat_persen'] || '20');

            if (!kodeBo || !kodeRelasi || !namaRelasi) {
              throw new Error('Kolom kode_bo, kode_relasi, dan nama_relasi wajib diisi.');
            }

            const bo = boMapByCode.get(kodeBo);
            if (!bo) {
              throw new Error(`Kantor cabang dengan kode '${kodeBo}' tidak ditemukan di Master BO.`);
            }

            validRecords.push({
              bo_id: bo.id,
              kode_relasi: kodeRelasi,
              nama_relasi: namaRelasi,
              jenis_relasi: jenis,
              jenjang,
              alamat,
              kontak_person: kontakPerson,
              no_kontak: noKontak,
              default_rabat_persen: isNaN(defaultRabat) ? 20 : defaultRabat,
            });
            break;
          }

          case 'master_produk': {
            const sku = (row['kode_sku'] || '').toString().trim().toUpperCase();
            const judul = (row['judul_buku'] || '').toString().trim();
            const jenjang = (row['jenjang'] || 'SD/MI').toString().trim();
            const mapel = (row['mata_pelajaran'] || '-').toString().trim();
            const kurikulum = (row['kurikulum'] || 'Kurikulum Merdeka').toString().trim();
            const penulis = (row['penulis'] || '-').toString().trim();
            const halaman = parseInt(row['halaman'] || '150', 10);
            const hpp = parseFloat(row['default_hpp_persen'] || '35');

            if (!sku || !judul) {
              throw new Error('Kolom kode_sku dan judul_buku wajib diisi.');
            }

            validRecords.push({
              kode_sku: sku,
              judul_buku: judul,
              jenjang,
              mata_pelajaran: mapel,
              kurikulum,
              penulis,
              halaman: isNaN(halaman) ? 150 : halaman,
              default_hpp_persen: isNaN(hpp) ? 35 : hpp,
            });
            break;
          }

          case 'master_harga': {
            const sku = (row['kode_sku'] || '').toString().trim().toUpperCase();
            const tahun = parseInt(row['tahun_anggaran'] || '2026', 10);
            const zona = parseInt(row['zona_id'], 10);
            const harga = parseFloat(row['harga_satuan'] || '0');

            if (!sku || isNaN(zona) || isNaN(harga) || harga <= 0) {
              throw new Error('Kolom kode_sku, zona_id, dan harga_satuan (> 0) wajib diisi.');
            }

            const produk = produkMapBySku.get(sku);
            if (!produk) {
              throw new Error(`Buku dengan SKU '${sku}' tidak ditemukan di Master Produk.`);
            }

            validRecords.push({
              produk_id: produk.id,
              tahun_anggaran: isNaN(tahun) ? 2026 : tahun,
              zona_id: zona,
              harga_satuan: harga,
            });
            break;
          }

          case 'target_detail': {
            const kodeBo = (row['kode_bo'] || '').toString().trim().toUpperCase();
            const namaSales = (row['nama_sales'] || '').toString().trim();
            const kodeRelasi = (row['kode_relasi'] || '').toString().trim().toUpperCase();
            const kodeSku = (row['kode_sku'] || '').toString().trim().toUpperCase();
            const tahun = parseInt(row['tahun_anggaran'] || '2026', 10);
            const qty = parseInt(row['qty'] || '0', 10);
            const keyakinan = parseFloat(row['persen_keyakinan'] || '80');
            const rabat = parseFloat(row['persen_rabat'] || '20');
            const bsr = parseFloat(row['persen_bsr'] || '5');
            const catatan = (row['catatan'] || '').toString().trim();

            if (!kodeBo || !namaSales || !kodeRelasi || !kodeSku || qty <= 0) {
              throw new Error('Kolom kode_bo, nama_sales, kode_relasi, kode_sku, dan qty (> 0) wajib diisi.');
            }

            const bo = boMapByCode.get(kodeBo);
            if (!bo) throw new Error(`Cabang '${kodeBo}' tidak ditemukan di Master BO.`);

            const sdm = sdmMapByName.get(`${bo.id}_${namaSales.toLowerCase()}`);
            if (!sdm) throw new Error(`Sales '${namaSales}' tidak terdaftar pada cabang ${kodeBo}.`);

            const relasi = relasiMapByCode.get(kodeRelasi);
            if (!relasi) throw new Error(`Relasi '${kodeRelasi}' tidak ditemukan di Master Relasi.`);

            const produk = produkMapBySku.get(kodeSku);
            if (!produk) throw new Error(`Produk SKU '${kodeSku}' tidak ditemukan di Master Produk.`);

            // Lookup official price from matrix or fallback
            const lookupKey = `${produk.id}_${tahun}_${bo.zona_id}`;
            const officialPrice = hargaList.find(
              (h) => h.produk_id === produk.id && h.tahun_anggaran === tahun && h.zona_id === bo.zona_id
            );
            const unitPrice = officialPrice ? officialPrice.harga_satuan : 75000;
            const hppPersen = produk.default_hpp_persen || 35;

            // Compute financial columns
            const calculated = calculateTargetColumns(
              qty,
              unitPrice,
              isNaN(rabat) ? 20 : rabat,
              isNaN(bsr) ? 5 : bsr,
              hppPersen,
              isNaN(keyakinan) ? 80 : keyakinan
            );

            validRecords.push({
              bo_id: bo.id,
              sdm_id: sdm.id,
              relasi_id: relasi.id,
              produk_id: produk.id,
              tahun_anggaran: isNaN(tahun) ? 2026 : tahun,
              zona_id: bo.zona_id,
              harga_satuan: unitPrice,
              qty,
              persen_keyakinan: isNaN(keyakinan) ? 80 : keyakinan,
              persen_rabat: isNaN(rabat) ? 20 : rabat,
              persen_bsr: isNaN(bsr) ? 5 : bsr,
              persen_hpp: hppPersen,
              nilai_brutto: calculated.nilai_brutto,
              nilai_rabat: calculated.nilai_rabat,
              nilai_bsr: calculated.nilai_bsr,
              nilai_netto: calculated.nilai_netto,
              nilai_hpp: calculated.nilai_hpp,
              laba_kotor: calculated.laba_kotor,
              nilai_tertimbang_brutto: calculated.nilai_tertimbang_brutto,
              catatan: catatan || null,
            });
            break;
          }
        }
      } catch (err: any) {
        errors.push({
          rowNumber: rowNum,
          identifier: row['kode_bo'] || row['kode_sku'] || row['kode_relasi'] || row['nama'] || `Baris ${rowNum}`,
          reason: err.message || 'Validasi baris gagal.',
          dataSnippet: row,
        });
      }
    }

    // 3. Batch Chunk Ingestion to Supabase (Chunks of 500 rows to prevent payload or transaction timeouts)
    const BATCH_SIZE = 500;
    const batches = chunkArray(validRecords, BATCH_SIZE);
    const totalBatches = batches.length;

    for (let bIndex = 0; bIndex < totalBatches; bIndex++) {
      const currentBatch = batches[bIndex];

      try {
        let tableName = tableType;
        if (tableType === 'master_harga') tableName = 'master_produk_harga' as any;
        if (tableType === 'target_detail') tableName = 'target_penjualan_detail' as any;

        let conflictTarget = 'id';
        if (tableType === 'master_bo') conflictTarget = 'kode_bo';
        if (tableType === 'master_produk') conflictTarget = 'kode_sku';
        if (tableType === 'master_relasi') conflictTarget = 'kode_relasi';

        let query = supabase.from(tableName);
        if (mode === 'upsert' && ['master_bo', 'master_produk', 'master_relasi'].includes(tableType)) {
          const { error } = await query.upsert(currentBatch, { onConflict: conflictTarget });
          if (error) throw error;
        } else {
          const { error } = await query.insert(currentBatch);
          if (error) throw error;
        }

        successCount += currentBatch.length;
      } catch (batchErr: any) {
        // Record all items in this batch as failed with database error
        currentBatch.forEach((item, idx) => {
          errors.push({
            rowNumber: bIndex * BATCH_SIZE + idx + 2,
            identifier: item.kode_bo || item.kode_sku || item.nama || 'Batch Record',
            reason: `Gagal simpan batch ke Supabase: ${batchErr.message || 'Database error'}`,
          });
        });
      }

      if (onProgress) {
        onProgress(successCount, totalRows, bIndex + 1, totalBatches);
      }
    }

    return {
      tableName: tableType,
      totalRows,
      successCount,
      failedCount: totalRows - successCount,
      durationMs: Date.now() - startTime,
      errors,
    };
  },
};

// Internal Lookup Helpers
async function fetchLookupBO(): Promise<MasterBO[]> {
  try {
    const { data } = await supabase.from('master_bo').select('*');
    if (data && data.length > 0) return data;
  } catch {}
  return [];
}

async function fetchLookupSDM(): Promise<MasterSDM[]> {
  try {
    const { data } = await supabase.from('master_sdm').select('*');
    if (data && data.length > 0) return data;
  } catch {}
  return [];
}

async function fetchLookupRelasi(): Promise<MasterRelasi[]> {
  try {
    const { data } = await supabase.from('master_relasi').select('*');
    if (data && data.length > 0) return data;
  } catch {}
  return [];
}

async function fetchLookupProduk(): Promise<MasterProduk[]> {
  try {
    const { data } = await supabase.from('master_produk').select('*');
    if (data && data.length > 0) return data;
  } catch {}
  return [];
}

async function fetchLookupHarga(): Promise<MasterProdukHarga[]> {
  try {
    const { data } = await supabase.from('master_produk_harga').select('*');
    if (data && data.length > 0) return data;
  } catch {}
  return [];
}
