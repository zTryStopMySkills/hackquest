export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import { prisma } from '@/lib/db';

// isolate: { isolate: true, minutes: 60 } | { isolate: false }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { isolate, minutes, reason } = await req.json();

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true, isAdmin: true } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (target.isAdmin) return NextResponse.json({ error: 'No puedes aislar a otro admin' }, { status: 403 });

  const isolatedUntil = isolate && minutes
    ? new Date(Date.now() + minutes * 60 * 1000)
    : null;

  const updated = await prisma.user.update({
    where: { id },
    data: { isIsolated: isolate, isolatedUntil },
    select: { id: true, username: true, isIsolated: true, isolatedUntil: true },
  });

  await logAdminAction(
    session!.userId, id,
    isolate ? 'ISOLATE' : 'UNISOLATE',
    reason,
    isolate ? { minutes } : undefined
  );

  return NextResponse.json({ success: true, user: updated });
}
