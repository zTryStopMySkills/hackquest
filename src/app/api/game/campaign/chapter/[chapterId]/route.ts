export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Maps chapterId → orderInBranch range for CAMPAIGN challenges
const CHAPTER_RANGES: Record<number, { from: number; to: number }> = {
  1: { from: 1,  to: 4  },
  2: { from: 5,  to: 8  },
  3: { from: 9,  to: 13 },
  4: { from: 14, to: 18 },
  5: { from: 19, to: 24 },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { chapterId: chapterIdStr } = await params;
  const chapterId = parseInt(chapterIdStr, 10);
  const range = CHAPTER_RANGES[chapterId];
  if (!range) return NextResponse.json({ error: 'Capítulo inválido' }, { status: 400 });

  const challenges = await prisma.challenge.findMany({
    where: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      branch: 'CAMPAIGN' as any,
      orderInBranch: { gte: range.from, lte: range.to },
    },
    orderBy: { orderInBranch: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      briefing: true,
      difficulty: true,
      timeLimitSeconds: true,
      basePoints: true,
      hints: true,
    },
  });

  // Check which ones are already solved by this user
  const solved = await prisma.challengeAttempt.findMany({
    where: {
      userId: session.userId,
      challengeId: { in: challenges.map(c => c.id) },
      solved: true,
    },
    select: { challengeId: true, score: true, perfectSolve: true },
  });

  const solvedMap = new Map(solved.map(s => [s.challengeId, s]));

  return NextResponse.json({
    challenges: challenges.map(c => ({
      ...c,
      solved: solvedMap.has(c.id),
      score: solvedMap.get(c.id)?.score ?? 0,
      perfect: solvedMap.get(c.id)?.perfectSolve ?? false,
    })),
  });
}
