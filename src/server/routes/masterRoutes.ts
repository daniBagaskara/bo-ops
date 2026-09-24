import { Router } from 'express';
import { db } from '../../db/index.ts';
import {
  masterBo,
  masterSdm,
  masterRelasi,
  masterProduk,
  masterProdukHarga,
} from '../../db/schema.ts';
import { eq, and, desc, asc } from 'drizzle-orm';
import { AuthRequest, requireAuth, requireSuperAdmin } from '../../middleware/auth.ts';

export const masterRouter = Router();
masterRouter.use(requireAuth);

// ==========================================
// 1. MASTER BRANCH OFFICE (BO)
// ==========================================
masterRouter.get('/bo', async (_req: AuthRequest, res) => {
  try {
    const list = await db.select().from(masterBo).orderBy(asc(masterBo.kode_bo));
    res.json(list);
  } catch (err: any) {
    console.error('Fetch BO error:', err);
    res.status(500).json({ error: 'Gagal memuat master kantor cabang.' });
  }
});

masterRouter.post('/bo', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { kode_bo, nama_bo, zona_id, wilayah, alamat } = req.body;
    if (!kode_bo || !nama_bo || !zona_id || !wilayah) {
      return res.status(400).json({ error: 'Kode BO, Nama BO, Zona (1-13), dan Wilayah wajib diisi.' });
    }

    const zonaNum = Number(zona_id);
    if (isNaN(zonaNum) || zonaNum < 1 || zonaNum > 13) {
      return res.status(400).json({ error: 'Zona ID harus berupa angka antara 1 sampai 13.' });
    }

    const cleanKode = kode_bo.trim().toUpperCase();
    const existing = await db.select().from(masterBo).where(eq(masterBo.kode_bo, cleanKode));
    if (existing.length > 0) {
      return res.status(400).json({ error: `Kode BO '${cleanKode}' sudah digunakan.` });
    }

    const inserted = await db.insert(masterBo).values({
      kode_bo: cleanKode,
      nama_bo: nama_bo.trim(),
      zona_id: zonaNum,
      wilayah: wilayah.trim(),
      alamat: alamat ? alamat.trim() : null,
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (err: any) {
    console.error('Create BO error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan data BO.' });
  }
});

masterRouter.put('/bo/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { nama_bo, zona_id, wilayah, alamat } = req.body;

    const zonaNum = Number(zona_id);
    if (isNaN(zonaNum) || zonaNum < 1 || zonaNum > 13) {
      return res.status(400).json({ error: 'Zona ID harus berupa angka antara 1 sampai 13.' });
    }

    const updated = await db.update(masterBo).set({
      nama_bo: nama_bo.trim(),
      zona_id: zonaNum,
      wilayah: wilayah.trim(),
      alamat: alamat ? alamat.trim() : null,
      updated_at: new Date(),
    }).where(eq(masterBo.id, id)).returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Data BO tidak ditemukan.' });
    }

    res.json(updated[0]);
  } catch (err: any) {
    console.error('Update BO error:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui data BO.' });
  }
});

masterRouter.delete('/bo/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.delete(masterBo).where(eq(masterBo.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data BO tidak ditemukan.' });
    }
    res.json({ success: true, message: `BO ${deleted[0].nama_bo} berhasil dihapus.` });
  } catch (err: any) {
    console.error('Delete BO error:', err);
    res.status(500).json({ error: 'Gagal menghapus BO. Pastikan tidak ada data yang terikat.' });
  }
});

// ==========================================
// 2. MASTER SDM & SALES
// ==========================================
masterRouter.get('/sdm', async (req: AuthRequest, res) => {
  try {
    const isBM = req.appUser?.role === 'branch_manager';
    const assignedBoId = req.appUser?.bo_id;
    const queryBoId = req.query.bo_id as string | undefined;

    let targetBoId: string | undefined = undefined;
    if (isBM) {
      targetBoId = assignedBoId || '';
    } else if (queryBoId && queryBoId !== 'ALL') {
      targetBoId = queryBoId;
    }

    let list;
    if (targetBoId) {
      list = await db.select().from(masterSdm).where(eq(masterSdm.bo_id, targetBoId)).orderBy(asc(masterSdm.nama));
    } else {
      list = await db.select().from(masterSdm).orderBy(asc(masterSdm.nama));
    }
    res.json(list);
  } catch (err: any) {
    console.error('Fetch SDM error:', err);
    res.status(500).json({ error: 'Gagal memuat master SDM.' });
  }
});

masterRouter.post('/sdm', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { bo_id, nama, jabatan, no_hp, wilayah_kerja, is_placeholder, kode_placeholder, status_aktif } = req.body;
    if (!bo_id || !nama || !jabatan || !wilayah_kerja) {
      return res.status(400).json({ error: 'Cabang, Nama, Jabatan, dan Wilayah Kerja wajib diisi.' });
    }

    const inserted = await db.insert(masterSdm).values({
      bo_id,
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      no_hp: no_hp ? no_hp.trim() : '-',
      wilayah_kerja: wilayah_kerja.trim(),
      is_placeholder: Boolean(is_placeholder),
      kode_placeholder: kode_placeholder ? kode_placeholder.trim() : null,
      status_aktif: status_aktif !== false,
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (err: any) {
    console.error('Create SDM error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan data SDM.' });
  }
});

masterRouter.put('/sdm/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { bo_id, nama, jabatan, no_hp, wilayah_kerja, is_placeholder, kode_placeholder, status_aktif } = req.body;

    const updated = await db.update(masterSdm).set({
      bo_id,
      nama: nama.trim(),
      jabatan: jabatan.trim(),
      no_hp: no_hp ? no_hp.trim() : '-',
      wilayah_kerja: wilayah_kerja.trim(),
      is_placeholder: Boolean(is_placeholder),
      kode_placeholder: kode_placeholder ? kode_placeholder.trim() : null,
      status_aktif: status_aktif !== false,
      updated_at: new Date(),
    }).where(eq(masterSdm.id, id)).returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Data SDM tidak ditemukan.' });
    }

    res.json(updated[0]);
  } catch (err: any) {
    console.error('Update SDM error:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui data SDM.' });
  }
});

masterRouter.delete('/sdm/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.delete(masterSdm).where(eq(masterSdm.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data SDM tidak ditemukan.' });
    }
    res.json({ success: true, message: `SDM ${deleted[0].nama} berhasil dihapus.` });
  } catch (err: any) {
    console.error('Delete SDM error:', err);
    res.status(500).json({ error: 'Gagal menghapus SDM. Pastikan tidak ada target yang terikat.' });
  }
});

// ==========================================
// 3. MASTER RELASI (SEKOLAH / MITRA)
// ==========================================
masterRouter.get('/relasi', async (req: AuthRequest, res) => {
  try {
    const isBM = req.appUser?.role === 'branch_manager';
    const assignedBoId = req.appUser?.bo_id;
    const queryBoId = req.query.bo_id as string | undefined;

    let targetBoId: string | undefined = undefined;
    if (isBM) {
      targetBoId = assignedBoId || '';
    } else if (queryBoId && queryBoId !== 'ALL') {
      targetBoId = queryBoId;
    }

    let list;
    if (targetBoId) {
      list = await db.select().from(masterRelasi).where(eq(masterRelasi.bo_id, targetBoId)).orderBy(asc(masterRelasi.nama_relasi));
    } else {
      list = await db.select().from(masterRelasi).orderBy(asc(masterRelasi.nama_relasi));
    }
    res.json(list);
  } catch (err: any) {
    console.error('Fetch Relasi error:', err);
    res.status(500).json({ error: 'Gagal memuat master relasi.' });
  }
});

masterRouter.post('/relasi', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { bo_id, kode_relasi, nama_relasi, jenis_relasi, jenjang, alamat, kontak_person, no_kontak, default_rabat_persen } = req.body;
    if (!bo_id || !kode_relasi || !nama_relasi || !jenis_relasi || !jenjang) {
      return res.status(400).json({ error: 'Cabang, Kode Relasi, Nama Relasi, Jenis, dan Jenjang wajib diisi.' });
    }

    const inserted = await db.insert(masterRelasi).values({
      bo_id,
      kode_relasi: kode_relasi.trim(),
      nama_relasi: nama_relasi.trim(),
      jenis_relasi: jenis_relasi.trim(),
      jenjang: jenjang.trim(),
      alamat: alamat ? alamat.trim() : null,
      kontak_person: kontak_person ? kontak_person.trim() : null,
      no_kontak: no_kontak ? no_kontak.trim() : null,
      default_rabat_persen: Number(default_rabat_persen) || 20,
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (err: any) {
    console.error('Create Relasi error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan data relasi.' });
  }
});

masterRouter.put('/relasi/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { bo_id, kode_relasi, nama_relasi, jenis_relasi, jenjang, alamat, kontak_person, no_kontak, default_rabat_persen } = req.body;

    const updated = await db.update(masterRelasi).set({
      bo_id,
      kode_relasi: kode_relasi.trim(),
      nama_relasi: nama_relasi.trim(),
      jenis_relasi: jenis_relasi.trim(),
      jenjang: jenjang.trim(),
      alamat: alamat ? alamat.trim() : null,
      kontak_person: kontak_person ? kontak_person.trim() : null,
      no_kontak: no_kontak ? no_kontak.trim() : null,
      default_rabat_persen: Number(default_rabat_persen) || 20,
      updated_at: new Date(),
    }).where(eq(masterRelasi.id, id)).returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Data relasi tidak ditemukan.' });
    }

    res.json(updated[0]);
  } catch (err: any) {
    console.error('Update Relasi error:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui data relasi.' });
  }
});

masterRouter.delete('/relasi/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.delete(masterRelasi).where(eq(masterRelasi.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data relasi tidak ditemukan.' });
    }
    res.json({ success: true, message: `Relasi ${deleted[0].nama_relasi} berhasil dihapus.` });
  } catch (err: any) {
    console.error('Delete Relasi error:', err);
    res.status(500).json({ error: 'Gagal menghapus relasi.' });
  }
});

// ==========================================
// 4. MASTER PRODUK
// ==========================================
masterRouter.get('/produk', async (_req: AuthRequest, res) => {
  try {
    const list = await db.select().from(masterProduk).orderBy(asc(masterProduk.kode_sku));
    res.json(list);
  } catch (err: any) {
    console.error('Fetch Produk error:', err);
    res.status(500).json({ error: 'Gagal memuat master produk.' });
  }
});

masterRouter.post('/produk', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { kode_sku, judul_buku, jenjang, mata_pelajaran, kurikulum, penulis, halaman, default_hpp_persen } = req.body;
    if (!kode_sku || !judul_buku || !jenjang || !mata_pelajaran) {
      return res.status(400).json({ error: 'Kode SKU, Judul Buku, Jenjang, dan Mata Pelajaran wajib diisi.' });
    }

    const cleanSku = kode_sku.trim().toUpperCase();
    const existing = await db.select().from(masterProduk).where(eq(masterProduk.kode_sku, cleanSku));
    if (existing.length > 0) {
      return res.status(400).json({ error: `Kode SKU '${cleanSku}' sudah terdaftar.` });
    }

    const inserted = await db.insert(masterProduk).values({
      kode_sku: cleanSku,
      judul_buku: judul_buku.trim(),
      jenjang: jenjang.trim(),
      mata_pelajaran: mata_pelajaran.trim(),
      kurikulum: kurikulum ? kurikulum.trim() : 'Kurikulum Merdeka',
      penulis: penulis ? penulis.trim() : null,
      halaman: Number(halaman) || 160,
      default_hpp_persen: Number(default_hpp_persen) || 35,
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (err: any) {
    console.error('Create Produk error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan produk.' });
  }
});

masterRouter.put('/produk/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { judul_buku, jenjang, mata_pelajaran, kurikulum, penulis, halaman, default_hpp_persen } = req.body;

    const updated = await db.update(masterProduk).set({
      judul_buku: judul_buku.trim(),
      jenjang: jenjang.trim(),
      mata_pelajaran: mata_pelajaran.trim(),
      kurikulum: kurikulum ? kurikulum.trim() : 'Kurikulum Merdeka',
      penulis: penulis ? penulis.trim() : null,
      halaman: Number(halaman) || 160,
      default_hpp_persen: Number(default_hpp_persen) || 35,
      updated_at: new Date(),
    }).where(eq(masterProduk.id, id)).returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Data produk tidak ditemukan.' });
    }

    res.json(updated[0]);
  } catch (err: any) {
    console.error('Update Produk error:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui produk.' });
  }
});

masterRouter.delete('/produk/:id', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.delete(masterProduk).where(eq(masterProduk.id, id)).returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Data produk tidak ditemukan.' });
    }
    res.json({ success: true, message: `Produk ${deleted[0].judul_buku} berhasil dihapus.` });
  } catch (err: any) {
    console.error('Delete Produk error:', err);
    res.status(500).json({ error: 'Gagal menghapus produk. Pastikan tidak ada target yang terikat.' });
  }
});

// ==========================================
// 5. MASTER PRODUK HARGA (MATRIKS ZONA 1-13)
// ==========================================
masterRouter.get('/harga', async (req: AuthRequest, res) => {
  try {
    const tahun = req.query.tahun_anggaran ? Number(req.query.tahun_anggaran) : undefined;
    const zona = req.query.zona_id ? Number(req.query.zona_id) : undefined;

    let query = db.select().from(masterProdukHarga);
    if (tahun && zona) {
      const list = await query.where(and(eq(masterProdukHarga.tahun_anggaran, tahun), eq(masterProdukHarga.zona_id, zona)));
      return res.json(list);
    } else if (tahun) {
      const list = await query.where(eq(masterProdukHarga.tahun_anggaran, tahun));
      return res.json(list);
    }

    const list = await query;
    res.json(list);
  } catch (err: any) {
    console.error('Fetch Harga error:', err);
    res.status(500).json({ error: 'Gagal memuat matriks harga.' });
  }
});

masterRouter.post('/harga', requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { produk_id, tahun_anggaran, zona_id, harga_satuan } = req.body;
    if (!produk_id || !tahun_anggaran || !zona_id || harga_satuan === undefined) {
      return res.status(400).json({ error: 'Produk ID, Tahun Anggaran, Zona (1-13), dan Harga Satuan wajib diisi.' });
    }

    const existing = await db
      .select()
      .from(masterProdukHarga)
      .where(
        and(
          eq(masterProdukHarga.produk_id, produk_id),
          eq(masterProdukHarga.tahun_anggaran, Number(tahun_anggaran)),
          eq(masterProdukHarga.zona_id, Number(zona_id))
        )
      );

    if (existing.length > 0) {
      const updated = await db
        .update(masterProdukHarga)
        .set({
          harga_satuan: Number(harga_satuan),
          updated_at: new Date(),
        })
        .where(eq(masterProdukHarga.id, existing[0].id))
        .returning();
      return res.json(updated[0]);
    }

    const inserted = await db.insert(masterProdukHarga).values({
      produk_id,
      tahun_anggaran: Number(tahun_anggaran),
      zona_id: Number(zona_id),
      harga_satuan: Number(harga_satuan),
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (err: any) {
    console.error('Save Harga error:', err);
    res.status(500).json({ error: err.message || 'Gagal menyimpan tarif harga.' });
  }
});
