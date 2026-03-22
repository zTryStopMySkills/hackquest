import { NextResponse } from 'next/server';
import { getSession } from './auth';
import { prisma } from './db';

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }), session: null };
  }
  if (!session.isAdmin) {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function logAdminAction(
  adminId: string,
  targetId: string,
  action: string,
  reason?: string,
  metadata?: object
) {
  await prisma.adminActionLog.create({
    data: { adminId, targetId, action, reason, metadata: metadata ?? undefined },
  });
}
