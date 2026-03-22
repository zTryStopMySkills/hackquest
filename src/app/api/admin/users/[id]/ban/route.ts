export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { ban, reason } = await req.json();

  if (id === session!.userId) {
    return NextResponse.json({ error: 'No puedes banearte a ti mismo' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true, isAdmin: true } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (target.isAdmin) return NextResponse.json({ error: 'No puedes banear a otro admin' }, { status: 403 });

  const updated = await prisma.user.update({
    where: { id },
    data: {
      isBanned: ban,
      banReason: ban ? (reason ?? null) : null,
    },
    select: { id: true, username: true, isBanned: true, banReason: true },
  });

  await logAdminAction(
    session!.userId, id,
    ban ? 'BAN' : 'UNBAN',
    reason
  );

  return NextResponse.json({ success: true, user: updated });
}
