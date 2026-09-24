import { Router } from 'express';
import { db } from '../../db/index.ts';
import { appUsers, masterBo } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {
  AuthRequest,
  createSessionToken,
  revokeSessionToken,
  requireAuth,
} from '../../middleware/auth.ts';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Query user with branch office name
    const users = await db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        password_hash: appUsers.password_hash,
        nama: appUsers.nama,
        role: appUsers.role,
        bo_id: appUsers.bo_id,
        status_aktif: appUsers.status_aktif,
        bo_nama: masterBo.nama_bo,
      })
      .from(appUsers)
      .leftJoin(masterBo, eq(appUsers.bo_id, masterBo.id))
      .where(eq(appUsers.email, cleanEmail))
      .limit(1);

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
    }

    const user = users[0];
    if (!user.status_aktif) {
      return res.status(403).json({
        error: 'Akun Anda dinonaktifkan. Silakan hubungi Super Admin Pusat.',
      });
    }

    // Verify bcrypt password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
    }

    // Generate JWT token
    const token = createSessionToken({
      id: user.id,
      email: user.email,
      role: user.role,
      bo_id: user.bo_id,
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nama: user.nama,
        role: user.role,
        assigned_bo_id: user.bo_id,
        assigned_bo_nama: user.bo_nama,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan pada server saat autentikasi.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.appUser) {
      return res.status(401).json({ error: 'Sesi tidak ditemukan.' });
    }

    return res.json({
      user: {
        id: req.appUser.id,
        email: req.appUser.email,
        nama: req.appUser.nama,
        role: req.appUser.role,
        assigned_bo_id: req.appUser.bo_id,
        assigned_bo_nama: req.appUser.bo_nama,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Gagal mengambil profil pengguna.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1].trim();
    revokeSessionToken(token);
  }
  return res.json({ success: true, message: 'Berhasil keluar.' });
});
