export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      skillBranches: true,
      achievements: true,
      eloHistory: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: {
        select: {
          challengeAttempts: true,
          communityMessages: true,
          sentPrivateMessages: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  if (id === session!.userId) {
    return NextResponse.json({ error: 'No puedes eliminarte a ti mismo' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { username: true, isAdmin: true } });
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  if (target.isAdmin) return NextResponse.json({ error: 'No puedes eliminar otro admin' }, { status: 403 });

  await logAdminAction(session!.userId, id, 'DELETE_USER', `Usuario ${target.username} eliminado`);
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
