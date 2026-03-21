export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branch = searchParams.get('branch');
  const difficulty = searchParams.get('difficulty');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { rank: true, isPremium: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const where: Record<string, unknown> = {};
  if (branch) where.branch = branch;
  if (difficulty) where.difficulty = difficulty;

  if (!user.isPremium) {
    where.isFree = true;
  }

  const challenges = await prisma.challenge.findMany({
    where,
    orderBy: { orderInBranch: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      branch: true,
      difficulty: true,
      type: true,
      timeLimitSeconds: true,
      basePoints: true,
      requiredRank: true,
      isFree: true,
      orderInBranch: true,
    },
  });

  const attempts = await prisma.challengeAttempt.findMany({
    where: {
      userId: session.userId,
      solved: true,
    },
    select: {
      challengeId: true,
      score: true,
      perfectSolve: true,
    },
  });

  const solvedMap = new Map<string, { score: number; perfect: boolean }>(
    attempts.map((a: { challengeId: string; score: number; perfectSolve: boolean }) => [a.challengeId, { score: a.score, perfect: a.perfectSolve }])
  );

  const enriched = challenges.map((c: { id: string; slug: string; title: string; description: string; branch: string; difficulty: string; type: string; timeLimitSeconds: number; basePoints: number; requiredRank: string; isFree: boolean; orderInBranch: number }) => ({
    ...c,
    solved: solvedMap.has(c.id),
    bestScore: solvedMap.get(c.id)?.score || 0,
    perfect: solvedMap.get(c.id)?.perfect || false,
    locked: false,
  }));

  return NextResponse.json({ challenges: enriched });
}
