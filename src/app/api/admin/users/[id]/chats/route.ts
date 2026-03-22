export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

// Returns all private message threads this user is part of
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const messages = await prisma.privateMessage.findMany({
    where: {
      OR: [{ senderId: id }, { recipientId: id }],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, username: true, rank: true } },
      recipient: { select: { id: true, username: true, rank: true } },
    },
  });

  return NextResponse.json({ messages });
}
