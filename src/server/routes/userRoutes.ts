import { Router } from 'express';
import { db } from '../../db/index.ts';
import { appUsers, masterBo } from '../../db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { AuthRequest, requireAuth, requireSuperAdmin } from '../../middleware/auth.ts';

export const userRouter = Router();
userRouter.use(requireAuth);
userRouter.use(requireSuperAdmin);

// GET /api/users
userRouter.get('/', async (_req: AuthRequest, res) => {
  try {
    const list = await db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        nama: appUsers.nama,
        role: appUsers.role,
        bo_id: appUsers.bo_id,
        status_aktif: appUsers.status_aktif,
        created_at: appUsers.created_at,
        bo_nama: masterBo.nama_bo,
        bo_kode: masterBo.kode_bo,
      })
      .from(appUsers)
      .leftJoin(masterBo, eq(appUsers.bo_id, masterBo.id))
      .orderBy(desc(appUsers.created_at));

    res.json(list);
  } catch (err: any) {
    console.error('Fetch Users error:', err);
    res.status(500).json({ error: 'Gagal memuat daftar pengguna.' });
  }
});

// POST /api/users
userRouter.post('/', async (req: AuthRequest, res) => {
  try {
    const { email, nama, password, role, bo_id } = req.body;
    if (!email || !nama || !password || !role) {
      return res.status(400).json({ error: 'Email, Nama, Kata Sandi, dan Peran wajib diisi.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
    }

    if (role === 'branch_manager' && !bo_id) {
      return res.status(400).json({ error: 'Kantor Cabang wajib dipilih untuk Branch Manager.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.select().from(appUsers).where(eq(appUsers.email, cleanEmail));
    if (existing.length > 0) {
      return res.status(400).json({ error: `Pengguna dengan email ${cleanEmail} sudah ada.` });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const inserted = await db
      .insert(appUsers)
      .values({
        email: cleanEmail,
        nama: nama.trim(),
        password_hash: hash,
        role,
        bo_id: role === 'branch_manager' ? bo_id : null,
        status_aktif: true,
      })
      .returning();

    const u = inserted[0];
    res.status(201).json({
      id: u.id,
      email: u.email,
      nama: u.nama,
      role: u.role,
      bo_id: u.bo_id,
      status_aktif: u.status_aktif,
      created_at: u.created_at,
    });
  } catch (err: any) {
    console.error('Create User error:', err);
    res.status(500).json({ error: err.message || 'Gagal menambahkan pengguna.' });
  }
});

// PUT /api/users/:id
userRouter.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { nama, role, bo_id, status_aktif } = req.body;

    const updated = await db
      .update(appUsers)
      .set({
        nama: nama ? nama.trim() : undefined,
        role: role || undefined,
        bo_id: role === 'branch_manager' ? bo_id : null,
        status_aktif: status_aktif !== undefined ? Boolean(status_aktif) : undefined,
        updated_at: new Date(),
      })
      .where(eq(appUsers.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    const u = updated[0];
    res.json({
      id: u.id,
      email: u.email,
      nama: u.nama,
      role: u.role,
      bo_id: u.bo_id,
      status_aktif: u.status_aktif,
    });
  } catch (err: any) {
    console.error('Update User error:', err);
    res.status(500).json({ error: err.message || 'Gagal memperbarui pengguna.' });
  }
});

// PUT /api/users/:id/reset-password
userRouter.put('/:id/reset-password', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Kata sandi baru minimal 6 karakter.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);

    const updated = await db
      .update(appUsers)
      .set({
        password_hash: hash,
        updated_at: new Date(),
      })
      .where(eq(appUsers.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    res.json({ success: true, message: `Kata sandi untuk ${updated[0].email} berhasil diubah.` });
  } catch (err: any) {
    console.error('Reset Password error:', err);
    res.status(500).json({ error: 'Gagal mereset kata sandi.' });
  }
});

// PATCH /api/users/:id/toggle-status
userRouter.patch('/:id/toggle-status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status_aktif } = req.body;

    const updated = await db
      .update(appUsers)
      .set({
        status_aktif: Boolean(status_aktif),
        updated_at: new Date(),
      })
      .where(eq(appUsers.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    }

    res.json({
      success: true,
      status_aktif: updated[0].status_aktif,
      message: `Status pengguna berhasil diubah menjadi ${updated[0].status_aktif ? 'Aktif' : 'Nonaktif'}.`,
    });
  } catch (err: any) {
    console.error('Toggle Status error:', err);
    res.status(500).json({ error: 'Gagal mengubah status pengguna.' });
  }
});
