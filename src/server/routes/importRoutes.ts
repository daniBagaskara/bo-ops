import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { db } from '../../db/index.ts';
import {
  masterBo,
  masterSdm,
  masterRelasi,
  masterProduk,
  masterProdukHarga,
  targetPenjualanDetail,
} from '../../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';

export const importRouter = Router();
importRouter.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

function calculateFinancials(
  qty: number,
  hargaSatuan: number,
  persenRabat: number,
  persenBsr: number,
  persenHpp: number,
  persenKeyakinan: number = 100
) {
  const safeQty = Math.max(0, Number(qty) || 0);
  const safeHarga = Math.max(0, Number(hargaSatuan) || 0);
  const safeRabat = Math.max(0, Number(persenRabat) || 0);
  const safeBsr = Math.max(0, Number(persenBsr) || 0);
  const safeHpp = Math.max(0, Number(persenHpp) || 0);
  const safeKeyakinan = Math.min(100, Math.max(0, Number(persenKeyakinan) || 0));

  const nilaiBrutto = safeQty * safeHarga;
  const nilaiRabat = Math.round(nilaiBrutto * (safeRabat / 100));
  const nilaiBsr = Math.round(nilaiBrutto * (safeBsr / 100));
  const nilaiNetto = nilaiBrutto - nilaiRabat - nilaiBsr;
  const nilaiHpp = Math.round(nilaiBrutto * (safeHpp / 100));
  const labaKotor = nilaiNetto - nilaiHpp;
  const nilaiTertimbang = Math.round(nilaiBrutto * (safeKeyakinan / 100));

  return {
    nilai_brutto: nilaiBrutto,
    nilai_rabat: nilaiRabat,
    nilai_bsr: nilaiBsr,
    nilai_netto: nilaiNetto,
    nilai_hpp: nilaiHpp,
    laba_kotor: labaKotor,
    nilai_tertimbang_brutto: nilaiTertimbang,
  };
}

// POST /api/import/process
importRouter.post('/process', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'File Excel (.xlsx) atau .csv wajib diunggah.' });
    }

    const tableType = req.body.tableType;
    if (!tableType) {
      return res.status(400).json({ error: 'Tipe tabel tujuan import belum ditentukan.' });
    }

    const isBM = req.appUser?.role === 'branch_manager';
    const assignedBoId = req.appUser?.bo_id;

    // RBAC: BM is only allowed to import Target Penjualan Detail for their assigned BO
    if (isBM && tableType !== 'target_penjualan_detail') {
      return res.status(403).json({
        error: 'Akses ditolak: Branch Manager hanya diizinkan mengimpor Target Penjualan Detail untuk cabang sendiri.',
      });
    }

    // Parse workbook
    const workbook = XLSX.read(file.buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false,
    });

    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) {
      return res.status(400).json({ error: 'Sheet pada file spreadsheet tidak ditemukan.' });
    }

    const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
      defval: '',
      blankrows: false,
    });

    if (rawRows.length === 0) {
      return res.status(400).json({ error: 'File tidak memiliki baris data untuk diimpor.' });
    }

    // Pre-fetch reference maps into memory for O(1) row resolution
    const [allBos, allSdms, allRelasis, allProduks, allHargas] = await Promise.all([
      db.select().from(masterBo),
      db.select().from(masterSdm),
      db.select().from(masterRelasi),
      db.select().from(masterProduk),
      db.select().from(masterProdukHarga),
    ]);

    const boByKode = new Map(allBos.map((b) => [b.kode_bo.trim().toUpperCase(), b]));
    const boById = new Map(allBos.map((b) => [b.id, b]));
    const produkBySku = new Map(allProduks.map((p) => [p.kode_sku.trim().toUpperCase(), p]));

    const errors: Array<{ rowNumber: number; identifier: string; reason: string; dataSnippet?: any }> = [];
    const validBatch: any[] = [];
    let successCount = 0;

    // Row processing loop
    for (let i = 0; i < rawRows.length; i++) {
      const rowNumber = i + 2; // 1-based index + header offset
      const row = rawRows[i];

      // Normalize row keys (lowercase, trimmed)
      const cleanRow: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        cleanRow[k.trim().toLowerCase()] = typeof v === 'string' ? v.trim() : v;
      }

      if (tableType === 'master_bo') {
        const kode = String(cleanRow.kode_bo || '').toUpperCase();
        const nama = String(cleanRow.nama_bo || '');
        const zona = Number(cleanRow.zona_id);
        const wilayah = String(cleanRow.wilayah || '');

        if (!kode || !nama || isNaN(zona) || zona < 1 || zona > 13 || !wilayah) {
          errors.push({
            rowNumber,
            identifier: kode || `Baris ${rowNumber}`,
            reason: 'Data tidak lengkap atau Zona ID tidak valid (harus 1-13).',
            dataSnippet: cleanRow,
          });
          continue;
        }

        validBatch.push({
          kode_bo: kode,
          nama_bo: nama,
          zona_id: zona,
          wilayah,
          alamat: cleanRow.alamat || null,
        });
      } else if (tableType === 'master_sdm') {
        const kodeBo = String(cleanRow.kode_bo || '').toUpperCase();
        const bo = boByKode.get(kodeBo);
        if (!bo) {
          errors.push({
            rowNumber,
            identifier: cleanRow.nama || `Baris ${rowNumber}`,
            reason: `Kode BO '${kodeBo}' tidak ditemukan di sistem.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        const nama = String(cleanRow.nama || '');
        const jabatan = String(cleanRow.jabatan || 'Sales');
        const isPl = String(cleanRow.is_placeholder || '').toUpperCase() === 'YA' || cleanRow.is_placeholder === true;

        if (!nama) {
          errors.push({
            rowNumber,
            identifier: `Baris ${rowNumber}`,
            reason: 'Nama personil SDM wajib diisi.',
            dataSnippet: cleanRow,
          });
          continue;
        }

        validBatch.push({
          bo_id: bo.id,
          nama,
          jabatan,
          no_hp: cleanRow.no_hp || '-',
          wilayah_kerja: cleanRow.wilayah_kerja || bo.wilayah,
          is_placeholder: isPl,
          kode_placeholder: cleanRow.kode_placeholder || null,
          status_aktif: true,
        });
      } else if (tableType === 'master_relasi') {
        const kodeBo = String(cleanRow.kode_bo || '').toUpperCase();
        const bo = boByKode.get(kodeBo);
        if (!bo) {
          errors.push({
            rowNumber,
            identifier: cleanRow.kode_relasi || `Baris ${rowNumber}`,
            reason: `Kode BO '${kodeBo}' tidak ditemukan.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        const kodeRelasi = String(cleanRow.kode_relasi || '');
        const namaRelasi = String(cleanRow.nama_relasi || '');
        const jenisRelasi = String(cleanRow.jenis_relasi || 'Sekolah');
        const jenjang = String(cleanRow.jenjang || 'SD/MI');

        if (!kodeRelasi || !namaRelasi) {
          errors.push({
            rowNumber,
            identifier: kodeRelasi || `Baris ${rowNumber}`,
            reason: 'Kode Relasi dan Nama Relasi wajib diisi.',
            dataSnippet: cleanRow,
          });
          continue;
        }

        validBatch.push({
          bo_id: bo.id,
          kode_relasi: kodeRelasi,
          nama_relasi: namaRelasi,
          jenis_relasi: jenisRelasi,
          jenjang,
          alamat: cleanRow.alamat || null,
          kontak_person: cleanRow.kontak_person || null,
          no_kontak: cleanRow.no_kontak || null,
          default_rabat_persen: Number(cleanRow.default_rabat_persen) || 20,
        });
      } else if (tableType === 'master_produk') {
        const sku = String(cleanRow.kode_sku || '').toUpperCase();
        const judul = String(cleanRow.judul_buku || '');
        const jenjang = String(cleanRow.jenjang || 'SD/MI');
        const mapel = String(cleanRow.mata_pelajaran || '');

        if (!sku || !judul || !mapel) {
          errors.push({
            rowNumber,
            identifier: sku || `Baris ${rowNumber}`,
            reason: 'Kode SKU, Judul Buku, dan Mata Pelajaran wajib diisi.',
            dataSnippet: cleanRow,
          });
          continue;
        }

        validBatch.push({
          kode_sku: sku,
          judul_buku: judul,
          jenjang,
          mata_pelajaran: mapel,
          kurikulum: cleanRow.kurikulum || 'Kurikulum Merdeka',
          penulis: cleanRow.penulis || null,
          halaman: Number(cleanRow.halaman) || 160,
          default_hpp_persen: Number(cleanRow.default_hpp_persen) || 35,
        });
      } else if (tableType === 'master_produk_harga') {
        const sku = String(cleanRow.kode_sku || '').toUpperCase();
        const produk = produkBySku.get(sku);
        if (!produk) {
          errors.push({
            rowNumber,
            identifier: sku || `Baris ${rowNumber}`,
            reason: `Kode SKU '${sku}' tidak ditemukan di master produk.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        const tahun = Number(cleanRow.tahun_anggaran) || 2026;
        const zona = Number(cleanRow.zona_id);
        const harga = Number(cleanRow.harga_satuan);

        if (isNaN(zona) || zona < 1 || zona > 13 || isNaN(harga) || harga <= 0) {
          errors.push({
            rowNumber,
            identifier: sku,
            reason: 'Zona ID (1-13) atau Harga Satuan tidak valid.',
            dataSnippet: cleanRow,
          });
          continue;
        }

        validBatch.push({
          produk_id: produk.id,
          tahun_anggaran: tahun,
          zona_id: zona,
          harga_satuan: harga,
        });
      } else if (tableType === 'target_penjualan_detail') {
        const kodeBo = String(cleanRow.kode_bo || '').toUpperCase();
        const bo = boByKode.get(kodeBo);
        if (!bo) {
          errors.push({
            rowNumber,
            identifier: `Baris ${rowNumber}`,
            reason: `Kode BO '${kodeBo}' tidak valid.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        // BM Strict Isolation check
        if (isBM && bo.id !== assignedBoId) {
          errors.push({
            rowNumber,
            identifier: kodeBo,
            reason: `Akses ditolak: Data baris ini merujuk ke cabang ${bo.nama_bo}, bukan cabang penugasan Anda.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        // Resolve SDM
        const sdmNamaOrCode = String(cleanRow.nama_sdm || cleanRow.kode_placeholder || '');
        const sdm = allSdms.find(
          (s) =>
            s.bo_id === bo.id &&
            (s.nama.toLowerCase() === sdmNamaOrCode.toLowerCase() ||
              (s.kode_placeholder && s.kode_placeholder.toLowerCase() === sdmNamaOrCode.toLowerCase()))
        );

        if (!sdm) {
          errors.push({
            rowNumber,
            identifier: sdmNamaOrCode,
            reason: `SDM / Sales '${sdmNamaOrCode}' tidak ditemukan di cabang ${bo.nama_bo}.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        // Resolve Relasi
        const kodeRelasi = String(cleanRow.kode_relasi || '');
        const relasi = allRelasis.find(
          (r) => r.bo_id === bo.id && r.kode_relasi.toLowerCase() === kodeRelasi.toLowerCase()
        );

        if (!relasi) {
          errors.push({
            rowNumber,
            identifier: kodeRelasi,
            reason: `Mitra relasi '${kodeRelasi}' tidak ditemukan di cabang ${bo.nama_bo}.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        // Resolve Produk
        const sku = String(cleanRow.kode_sku || '').toUpperCase();
        const produk = produkBySku.get(sku);
        if (!produk) {
          errors.push({
            rowNumber,
            identifier: sku,
            reason: `Produk dengan SKU '${sku}' tidak ditemukan.`,
            dataSnippet: cleanRow,
          });
          continue;
        }

        const tahun = Number(cleanRow.tahun_anggaran) || 2026;
        const qty = Math.max(0, Number(cleanRow.qty) || 0);

        // Price lookup for (produk_id, tahun, zona_id)
        const priceObj = allHargas.find(
          (h) => h.produk_id === produk.id && h.tahun_anggaran === tahun && h.zona_id === bo.zona_id
        );
        const hargaSatuan = priceObj ? priceObj.harga_satuan : 75000;

        const persenRabat = cleanRow.persen_rabat !== undefined && cleanRow.persen_rabat !== '' ? Number(cleanRow.persen_rabat) : relasi.default_rabat_persen;
        const persenBsr = cleanRow.persen_bsr !== undefined && cleanRow.persen_bsr !== '' ? Number(cleanRow.persen_bsr) : 5;
        const persenHpp = cleanRow.persen_hpp !== undefined && cleanRow.persen_hpp !== '' ? Number(cleanRow.persen_hpp) : produk.default_hpp_persen;
        const persenKeyakinan = cleanRow.persen_keyakinan !== undefined && cleanRow.persen_keyakinan !== '' ? Number(cleanRow.persen_keyakinan) : 100;

        const financial = calculateFinancials(qty, hargaSatuan, persenRabat, persenBsr, persenHpp, persenKeyakinan);

        validBatch.push({
          bo_id: bo.id,
          sdm_id: sdm.id,
          relasi_id: relasi.id,
          produk_id: produk.id,
          tahun_anggaran: tahun,
          zona_id: bo.zona_id,
          harga_satuan: hargaSatuan,
          qty,
          persen_keyakinan: persenKeyakinan,
          persen_rabat: persenRabat,
          persen_bsr: persenBsr,
          persen_hpp: persenHpp,
          catatan: cleanRow.catatan ? String(cleanRow.catatan).trim() : null,
          ...financial,
        });
      }
    }

    // Execute chunked database inserts (500 records per chunk for memory safety)
    const CHUNK_SIZE = 500;
    for (let c = 0; c < validBatch.length; c += CHUNK_SIZE) {
      const chunk = validBatch.slice(c, c + CHUNK_SIZE);
      if (tableType === 'master_bo') {
        await db.insert(masterBo).values(chunk).onConflictDoNothing();
      } else if (tableType === 'master_sdm') {
        await db.insert(masterSdm).values(chunk);
      } else if (tableType === 'master_relasi') {
        await db.insert(masterRelasi).values(chunk);
      } else if (tableType === 'master_produk') {
        await db.insert(masterProduk).values(chunk).onConflictDoNothing();
      } else if (tableType === 'master_produk_harga') {
        await db.insert(masterProdukHarga).values(chunk).onConflictDoNothing();
      } else if (tableType === 'target_penjualan_detail') {
        await db.insert(targetPenjualanDetail).values(chunk);
      }
      successCount += chunk.length;
    }

    res.json({
      success: true,
      totalRows: rawRows.length,
      successCount,
      errorCount: errors.length,
      errors: errors.slice(0, 100), // Return top 100 errors for display & report download
      message: `Berhasil mengimpor ${successCount.toLocaleString('id-ID')} baris data.${errors.length > 0 ? ` (${errors.length} baris dilewati karena validasi).` : ''}`,
    });
  } catch (err: any) {
    console.error('Import processing error:', err);
    res.status(500).json({ error: err.message || 'Gagal memproses file import.' });
  }
});
