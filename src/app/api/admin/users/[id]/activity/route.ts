export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { id } = await params;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Number(searchParams.get('limit') ?? 50));

  const [attempts, communityMessages, eloHistory, adminLogs, notifications] = await Promise.all([
    prisma.challengeAttempt.findMany({
      where: { userId: id },
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: { challenge: { select: { title: true, branch: true, difficulty: true } } },
    }),
    prisma.communityMessage.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.eloHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.adminActionLog.findMany({
      where: { targetId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { admin: { select: { username: true } } },
    }),
    prisma.userNotification.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  return NextResponse.json({ attempts, communityMessages, eloHistory, adminLogs, notifications });
}
