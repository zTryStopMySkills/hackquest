export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import { prisma } from '@/lib/db';

// { delta: +500 } or { delta: -200 } or { set: 9999 }
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { delta, set, reason } = await req.json();

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true, points: true } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const newPoints = typeof set === 'number'
    ? Math.max(0, set)
    : Math.max(0, target.points + (delta ?? 0));

  const updated = await prisma.user.update({
    where: { id },
    data: { points: newPoints },
    select: { id: true, username: true, points: true },
  });

  await logAdminAction(
    session!.userId, id, 'ADJUST_POINTS', reason,
    { before: target.points, after: newPoints, delta: newPoints - target.points }
  );

  return NextResponse.json({ success: true, user: updated });
}
