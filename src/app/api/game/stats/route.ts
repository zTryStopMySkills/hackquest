export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const attempts = await prisma.challengeAttempt.findMany({
      where: { userId: session.userId },
      select: {
        solved: true,
        perfectSolve: true,
      },
    });

    const totalMatches = attempts.length;
    const wins = attempts.filter((a) => a.solved).length;
    const losses = attempts.filter((a) => !a.solved).length;
    const perfectSolves = attempts.filter((a) => a.perfectSolve).length;
    const winRate = totalMatches > 0 ? wins / totalMatches : 0.0;

    return NextResponse.json({
      totalMatches,
      wins,
      losses,
      perfectSolves,
      winRate,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo estadísticas' },
      { status: 500 },
    );
  }
}
