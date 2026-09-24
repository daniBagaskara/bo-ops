import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import { appUsers, masterBo } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'bo-ops-production-jwt-secret-key-99218274';

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

// In-memory fallback for legacy sessions
const legacySessionStore = new Map<string, { userId: string; expiresAt: number }>();

export function createSessionToken(user: { id: string; email: string; role: string; bo_id: string | null }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      bo_id: user.bo_id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function revokeSessionToken(_token: string): void {
  // Stateless JWT: revoked client-side by deleting token from storage
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

  // Mode 1: Stateless JWT Verification (Vercel Serverless Ready)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    if (decoded && decoded.id) {
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
        .where(eq(appUsers.id, decoded.id))
        .limit(1);

      if (userRows.length === 0 || !userRows[0].status_aktif) {
        return res.status(403).json({ error: 'Akun dinonaktifkan atau tidak ditemukan.' });
      }

      req.appUser = userRows[0] as AppUserPayload;
      return next();
    }
  } catch (_err) {
    // If not a valid JWT, check legacy token fallback
  }

  // Mode 2: Legacy session token fallback
  if (token.startsWith('bo_sess_')) {
    const session = legacySessionStore.get(token);
    if (!session || session.expiresAt < Date.now()) {
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
