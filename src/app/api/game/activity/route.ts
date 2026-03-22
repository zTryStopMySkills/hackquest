export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const attempts = await prisma.challengeAttempt.findMany({
    where: { userId: session.userId },
    orderBy: { startedAt: 'desc' },
    take: 8,
    include: {
      challenge: {
        select: { title: true, branch: true },
      },
    },
  });

  const BRANCH_MODE: Record<string, string> = {
    WEB_HACKING:  'WEB',
    NETWORKS:     'REDES',
    CRYPTOGRAPHY: 'CRIPTO',
    FORENSICS:    'FORENSE',
    SYSTEMS:      'SISTEMAS',
    CAMPAIGN:     'CAMPAÑA',
  };

  function relativeTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'ahora';
    if (mins < 60) return `hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'ayer';
    return `hace ${days}d`;
  }

  const activity = attempts.map(a => ({
    type:      a.solved ? 'win' : 'loss',
    mode:      BRANCH_MODE[a.challenge.branch] ?? a.challenge.branch,
    challenge: a.challenge.title,
    points:    a.solved ? `+${a.score}` : `-${Math.abs(a.score)}`,
    time:      relativeTime(a.startedAt),
    solved:    a.solved,
    perfect:   a.perfectSolve,
  }));

  return NextResponse.json({ activity });
}
