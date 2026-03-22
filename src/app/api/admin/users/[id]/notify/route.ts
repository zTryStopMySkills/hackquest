export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import { prisma } from '@/lib/db';

// type: 'WARNING' | 'REWARD'
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { type, title, message } = await req.json();
  if (!type || !title || !message) {
    return NextResponse.json({ error: 'type, title y message son obligatorios' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  await prisma.userNotification.create({
    data: { userId: id, type, title, message },
  });

  await logAdminAction(session!.userId, id, `NOTIFY_${type}`, title, { message });

  return NextResponse.json({ success: true });
}
