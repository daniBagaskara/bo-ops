import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import { appUsers, masterBo } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AppUserPayload {
  id: string;
  email: string;
  nama: string;
  role: 'superadmin' | 'branch_manager';
  bo_id: string | null;
  bo_nama?: string;
  status_aktif: boolean;
}

export interface AuthRequest extends Request {
  user?: any;
  appUser?: AppUserPayload;
}

// Simple in-memory session store for API session tokens
const sessionStore = new Map<string, { userId: string; expiresAt: number }>();

export function createSessionToken(userId: string): string {
  const token = `bo_sess_${Date.now()}_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
  sessionStore.set(token, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return token;
}

export function revokeSessionToken(token: string): void {
  sessionStore.delete(token);
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Sesi tidak valid atau belum masuk.' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // Check 1: Custom App Session Token
  if (token.startsWith('bo_sess_')) {
    const session = sessionStore.get(token);
    if (!session || session.expiresAt < Date.now()) {
      if (session) sessionStore.delete(token);
      return res.status(401).json({ error: 'Sesi telah kedaluwarsa. Silakan masuk kembali.' });
    }

    try {
      const userRows = await db
        .select({
          id: appUsers.id,
          email: appUsers.email,
          nama: appUsers.nama,
          role: appUsers.role,
          bo_id: appUsers.bo_id,
          status_aktif: appUsers.status_aktif,
          bo_nama: masterBo.nama_bo,
        })
        .from(appUsers)
        .leftJoin(masterBo, eq(appUsers.bo_id, masterBo.id))
        .where(eq(appUsers.id, session.userId))
        .limit(1);

      if (userRows.length === 0 || !userRows[0].status_aktif) {
        return res.status(403).json({ error: 'Akun dinonaktifkan atau tidak ditemukan.' });
      }

      req.appUser = userRows[0] as AppUserPayload;
      return next();
    } catch (err: any) {
      console.error('Session user lookup error:', err);
      return res.status(500).json({ error: 'Gagal memverifikasi pengguna.' });
    }
  }

  return res.status(401).json({ error: 'Token sesi tidak valid atau telah kedaluwarsa.' });
};

export const requireSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.appUser) {
    return res.status(401).json({ error: 'Autentikasi diperlukan.' });
  }

  if (req.appUser.role !== 'superadmin') {
    return res.status(403).json({
      error: 'Akses ditolak: Operasi ini hanya diizinkan untuk Super Admin Pusat.',
    });
  }

  next();
};
