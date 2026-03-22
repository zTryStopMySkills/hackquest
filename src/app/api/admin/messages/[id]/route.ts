export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminAction } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const msg = await prisma.communityMessage.findUnique({ where: { id } });
  if (!msg) return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 });

  await prisma.communityMessage.delete({ where: { id } });
  await logAdminAction(session!.userId, msg.userId, 'DELETE_MESSAGE', undefined, {
    messageId: id,
    content: msg.content,
  });

  return NextResponse.json({ success: true });
}
