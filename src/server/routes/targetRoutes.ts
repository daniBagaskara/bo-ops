import { Router } from 'express';
import { db } from '../../db/index.ts';
import {
  targetPenjualanDetail,
  masterBo,
  masterSdm,
  masterRelasi,
  masterProduk,
  masterProdukHarga,
} from '../../db/schema.ts';
import { eq, and, sql, desc, asc, ilike, or } from 'drizzle-orm';
import { AuthRequest, requireAuth } from '../../middleware/auth.ts';

export const targetRouter = Router();
targetRouter.use(requireAuth);

function computeFinancials(
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

// GET /api/target (Server-side Pagination, Filter, Search, Isolation)
targetRouter.get('/', async (req: AuthRequest, res) => {
  try {
    const isBM = req.appUser?.role === 'branch_manager';
    const assignedBoId = req.appUser?.bo_id;

    // Strict BM Isolation: BM ALWAYS locked to assignedBoId
    let effectiveBoId: string | undefined = undefined;
    if (isBM) {
      if (!assignedBoId) {
        return res.status(403).json({ error: 'Akun Branch Manager belum ditugaskan ke kantor cabang manapun.' });
      }
      effectiveBoId = assignedBoId;
    } else {
      const qBo = req.query.bo_id as string | undefined;
      if (qBo && qBo !== 'ALL') {
        effectiveBoId = qBo;
      }
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 25));
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || '').trim().toLowerCase();
    const tahun = req.query.tahun_anggaran ? Number(req.query.tahun_anggaran) : undefined;

    // Base conditions
    const conditions = [];
    if (effectiveBoId) {
      conditions.push(eq(targetPenjualanDetail.bo_id, effectiveBoId));
    }
    if (tahun) {
      conditions.push(eq(targetPenjualanDetail.tahun_anggaran, tahun));
    }

    // Build joined query
    const baseQuery = db
      .select({
        id: targetPenjualanDetail.id,
        bo_id: targetPenjualanDetail.bo_id,
        sdm_id: targetPenjualanDetail.sdm_id,
        relasi_id: targetPenjualanDetail.relasi_id,
        produk_id: targetPenjualanDetail.produk_id,
        tahun_anggaran: targetPenjualanDetail.tahun_anggaran,
        zona_id: targetPenjualanDetail.zona_id,
        harga_satuan: targetPenjualanDetail.harga_satuan,
        qty: targetPenjualanDetail.qty,
        persen_keyakinan: targetPenjualanDetail.persen_keyakinan,
        persen_rabat: targetPenjualanDetail.persen_rabat,
        persen_bsr: targetPenjualanDetail.persen_bsr,
        persen_hpp: targetPenjualanDetail.persen_hpp,
        nilai_brutto: targetPenjualanDetail.nilai_brutto,
        nilai_rabat: targetPenjualanDetail.nilai_rabat,
        nilai_bsr: targetPenjualanDetail.nilai_bsr,
        nilai_netto: targetPenjualanDetail.nilai_netto,
        nilai_hpp: targetPenjualanDetail.nilai_hpp,
        laba_kotor: targetPenjualanDetail.laba_kotor,
        nilai_tertimbang_brutto: targetPenjualanDetail.nilai_tertimbang_brutto,
        catatan: targetPenjualanDetail.catatan,
        created_at: targetPenjualanDetail.created_at,
        // Joined details
        bo_nama: masterBo.nama_bo,
        bo_kode: masterBo.kode_bo,
        sdm_nama: masterSdm.nama,
        relasi_nama: masterRelasi.nama_relasi,
        relasi_kode: masterRelasi.kode_relasi,
        produk_judul: masterProduk.judul_buku,
        produk_sku: masterProduk.kode_sku,
      })
      .from(targetPenjualanDetail)
      .innerJoin(masterBo, eq(targetPenjualanDetail.bo_id, masterBo.id))
      .innerJoin(masterSdm, eq(targetPenjualanDetail.sdm_id, masterSdm.id))
      .innerJoin(masterRelasi, eq(targetPenjualanDetail.relasi_id, masterRelasi.id))
      .innerJoin(masterProduk, eq(targetPenjualanDetail.produk_id, masterProduk.id));

    if (search) {
      conditions.push(
        or(
          ilike(masterSdm.nama, `%${search}%`),
          ilike(masterRelasi.nama_relasi, `%${search}%`),
          ilike(masterProduk.judul_buku, `%${search}%`),
          ilike(masterProduk.kode_sku, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count & aggregated summaries
    const countAndSum = await db
      .select({
        total: sql<number>`count(*)`,
        totalBrutto: sql<number>`coalesce(sum(${targetPenjualanDetail.nilai_brutto}), 0)`,
        totalNetto: sql<number>`coalesce(sum(${targetPenjualanDetail.nilai_netto}), 0)`,
        totalLaba: sql<number>`coalesce(sum(${targetPenjualanDetail.laba_kotor}), 0)`,
        totalTertimbang: sql<number>`coalesce(sum(${targetPenjualanDetail.nilai_tertimbang_brutto}), 0)`,
        totalQty: sql<number>`coalesce(sum(${targetPenjualanDetail.qty}), 0)`,
      })
      .from(targetPenjualanDetail)
      .innerJoin(masterSdm, eq(targetPenjualanDetail.sdm_id, masterSdm.id))
      .innerJoin(masterRelasi, eq(targetPenjualanDetail.relasi_id, masterRelasi.id))
      .innerJoin(masterProduk, eq(targetPenjualanDetail.produk_id, masterProduk.id))
      .where(whereClause);

    const total = Number(countAndSum[0]?.total || 0);

    // Get paginated rows
    const data = await baseQuery
      .where(whereClause)
      .orderBy(desc(targetPenjualanDetail.created_at))
      .limit(limit)
      .offset(offset);

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      summary: {
        totalBrutto: Number(countAndSum[0]?.totalBrutto || 0),
        totalNetto: Number(countAndSum[0]?.totalNetto || 0),
        totalLaba: Number(countAndSum[0]?.totalLaba || 0),
        totalTertimbang: Number(countAndSum[0]?.totalTertimbang || 0),
        totalQty: Number(countAndSum[0]?.totalQty || 0),
      },
    });
  } catch (err: any) {
    console.error('Fetch Target error:', err);
    res.status(500).json({ error: 'Gagal memuat daftar target penjualan detail.' });
  }
});

// POST /api/target (Create with Gatekeeper & Calculation)
targetRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const isBM = req.appUser?.role === 'branch_manager';
    const assignedBoId = req.appUser?.bo_id;

    let {
      bo_id,
      sdm_id,
      relasi_id,
      produk_id,
      tahun_anggaran,
      qty,
      persen_keyakinan,
      persen_rabat,
      persen_bsr,
      persen_hpp,
      catatan,
    } = req.body;

    // Strict BM Isolation: BM can only input for own assigned BO
    if (isBM) {
      if (!assignedBoId) {
        return res.status(403).json({ error: 'Akun BM belum memiliki penugasan kantor cabang.' });
      }
      bo_id = assignedBoId;
    }

    if (!bo_id || !sdm_id || !relasi_id || !produk_id) {
      return res.status(400).json({ error: 'Kantor Cabang, SDM Sales, Relasi, dan Produk wajib dipilih.' });
    }

    // 1. GATEKEEPER RULE: Check if BO has active SDM registered
    const sdmCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(masterSdm)
      .where(and(eq(masterSdm.bo_id, bo_id), eq(masterSdm.status_aktif, true)));

    if (Number(sdmCount[0]?.count || 0) === 0) {
      return res.status(400).json({
        error: 'GATEKEEPER VIOLATION: Cabang ini belum memiliki personil SDM / Sales yang aktif. Daftarkan minimal 1 SDM atau Sales Placeholder terlebih dahulu sebelum menginput target.',
      });
    }

    // 2. Lookup BO to determine Zona
    const boData = await db.select().from(masterBo).where(eq(masterBo.id, bo_id)).limit(1);
    if (boData.length === 0) {
      return res.status(400).json({ error: 'Kantor Cabang tidak valid.' });
    }
    const zonaId = boData[0].zona_id;

    // 3. Lookup Product Unit Price for (produk_id, tahun, zona_id)
    const yr = Number(tahun_anggaran) || 2026;
    const priceLookup = await db
      .select()
      .from(masterProdukHarga)
      .where(
        and(
          eq(masterProdukHarga.produk_id, produk_id),
          eq(masterProdukHarga.tahun_anggaran, yr),
          eq(masterProdukHarga.zona_id, zonaId)
        )
      )
      .limit(1);

    const unitPrice = priceLookup.length > 0 ? priceLookup[0].harga_satuan : 75000;

    // 4. Calculate Financial Columns
    const financial = computeFinancials(
      Number(qty) || 0,
      unitPrice,
      Number(persen_rabat) || 20,
      Number(persen_bsr) || 5,
      Number(persen_hpp) || 35,
      Number(persen_keyakinan) || 100
    );

    // 5. Insert Record
    const inserted = await db.insert(targetPenjualanDetail).values({
      bo_id,
      sdm_id,
      relasi_id,
      produk_id,
      tahun_anggaran: yr,
      zona_id: zonaId,
      harga_satuan: unitPrice,
      qty: Number(qty) || 0,
      persen_keyakinan: Number(persen_keyakinan) || 100,
      persen_rabat: Number(persen_rabat) || 20,
      persen_bsr: Number(persen_bsr) || 5,
      persen_hpp: Number(persen_hpp) || 35,
      catatan: catatan ? catatan.trim() : null,
      ...financial,
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (err: any) {
    console.error('Create Target error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan target penjualan detail.' });
  }
});

// PUT /api/target/:id (Update)
targetRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isBM = req.appUser?.role === 'branch_manager';
    const assignedBoId = req.appUser?.bo_id;

    // Verify existing target
    const existing = await db
      .select()
      .from(targetPenjualanDetail)
      .where(eq(targetPenjualanDetail.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Target penjualan tidak ditemukan.' });
    }

    const current = existing[0];
    if (isBM && current.bo_id !== assignedBoId) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang mengubah target cabang lain.' });
    }

    const {
      sdm_id,
      relasi_id,
      produk_id,
      tahun_anggaran,
      qty,
      persen_keyakinan,
      persen_rabat,
      persen_bsr,
      persen_hpp,
      catatan,
    } = req.body;

    const yr = Number(tahun_anggaran) || current.tahun_anggaran;
    const targetProdId = produk_id || current.produk_id;

    // Lookup updated price
    const priceLookup = await db
      .select()
      .from(masterProdukHarga)
      .where(
        and(
          eq(masterProdukHarga.produk_id, targetProdId),
          eq(masterProdukHarga.tahun_anggaran, yr),
          eq(masterProdukHarga.zona_id, current.zona_id)
        )
      )
      .limit(1);

    const unitPrice = priceLookup.length > 0 ? priceLookup[0].harga_satuan : current.harga_satuan;

    const financial = computeFinancials(
      Number(qty ?? current.qty),
      unitPrice,
      Number(persen_rabat ?? current.persen_rabat),
      Number(persen_bsr ?? current.persen_bsr),
      Number(persen_hpp ?? current.persen_hpp),
      Number(persen_keyakinan ?? current.persen_keyakinan)
    );

    const updated = await db
      .update(targetPenjualanDetail)
      .set({
        sdm_id: sdm_id || current.sdm_id,
        relasi_id: relasi_id || current.relasi_id,
        produk_id: targetProdId,
        tahun_anggaran: yr,
        harga_satuan: unitPrice,
        qty: Number(qty ?? current.qty),
        persen_keyakinan: Number(persen_keyakinan ?? current.persen_keyakinan),
        persen_rabat: Number(persen_rabat ?? current.persen_rabat),
        persen_bsr: Number(persen_bsr ?? current.persen_bsr),
        persen_hpp: Number(persen_hpp ?? current.persen_hpp),
        catatan: catatan !== undefined ? catatan : current.catatan,
        updated_at: new Date(),
        ...financial,
      })
      .where(eq(targetPenjualanDetail.id, id))
      .returning();

    res.json(updated[0]);
  } catch (err: any) {
    console.error('Update Target error:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui target penjualan.' });
  }
});

// DELETE /api/target/:id
targetRouter.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const isBM = req.appUser?.role === 'branch_manager';
    const assignedBoId = req.appUser?.bo_id;

    const existing = await db
      .select()
      .from(targetPenjualanDetail)
      .where(eq(targetPenjualanDetail.id, id))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Target penjualan tidak ditemukan.' });
    }

    if (isBM && existing[0].bo_id !== assignedBoId) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak memiliki wewenang menghapus target cabang lain.' });
    }

    await db.delete(targetPenjualanDetail).where(eq(targetPenjualanDetail.id, id));
    res.json({ success: true, message: 'Target penjualan berhasil dihapus.' });
  } catch (err: any) {
    console.error('Delete Target error:', err);
    res.status(500).json({ error: 'Gagal menghapus target penjualan.' });
  }
});
