import { Router } from 'express';
import { db, createPool } from '../../db/index.ts';
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
    const cleanPassword = password.trim();

    // Query directly from PostgreSQL database pool
    const pool = createPool();
    const userRes = await pool.query(
      `SELECT u.id, u.email, 
              COALESCE(u.password_hash, u.password) AS password_hash,
              u.nama, u.role, u.bo_id, u.status_aktif, b.nama_bo
       FROM app_users u
       LEFT JOIN master_bo b ON u.bo_id = b.id
       WHERE LOWER(u.email) = $1
       LIMIT 1`,
      [cleanEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
    }

    const user = userRes.rows[0];
    if (!user.status_aktif) {
      return res.status(403).json({
        error: 'Akun Anda dinonaktifkan. Silakan hubungi Super Admin Pusat.',
      });
    }

    // Verify password:
    // 1. Check bcrypt hash
    // 2. Or check direct plaintext match (if account was seeded/registered as plaintext)
    let isPasswordValid = false;
    const storedSecret = user.password_hash || '';

    if (storedSecret.startsWith('$2a$') || storedSecret.startsWith('$2b$') || storedSecret.startsWith('$2y$')) {
      isPasswordValid = await bcrypt.compare(cleanPassword, storedSecret);
    } else {
      isPasswordValid = (cleanPassword === storedSecret);
      // Auto-upgrade plaintext to bcrypt hash
      if (isPasswordValid) {
        try {
          const newHash = await bcrypt.hash(cleanPassword, 10);
          await pool.query(
            `UPDATE app_users 
             SET password_hash = $1 
             WHERE id = $2`,
            [newHash, user.id]
          );
        } catch {
          // ignore auto-upgrade fail
        }
      }
    }

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
        assigned_bo_nama: user.nama_bo,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Terjadi kesalahan pada server saat autentikasi.',
      detail: error.message || String(error),
    });
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
