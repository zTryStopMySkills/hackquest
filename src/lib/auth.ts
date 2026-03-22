import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'hackquest-dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: { userId: string; username: string; isAdmin?: boolean }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): { userId: string; username: string; isAdmin?: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string; isAdmin?: boolean };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ userId: string; username: string; isAdmin?: boolean } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('hackquest-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('hackquest-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('hackquest-token');
}
