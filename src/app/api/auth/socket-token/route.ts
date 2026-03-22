export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession, generateToken } from '@/lib/auth';

// Returns a short-lived JWT for Socket.IO authentication.
// The main JWT lives in an httpOnly cookie (not accessible from JS),
// so this endpoint issues a socket-specific token with 2h expiry.
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  // Re-use generateToken — the socket server validates the same JWT_SECRET
  const token = generateToken({
    userId: session.userId,
    username: session.username,
    isAdmin: session.isAdmin,
  });

  return NextResponse.json({ token });
}
