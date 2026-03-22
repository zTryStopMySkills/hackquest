export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;

  const duel = await prisma.duelMatch.findUnique({
    where: { matchId },
    include: {
      match: { select: { status: true, timeLimit: true, createdAt: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!duel) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 });

  const [playerA, playerB] = await Promise.all([
    prisma.user.findUnique({
      where: { id: duel.attackerAId },
      select: { username: true, rank: true, elo: true },
    }),
    prisma.user.findUnique({
      where: { id: duel.attackerBId },
      select: { username: true, rank: true, elo: true },
    }),
  ]);

  const phasesA = duel.events.filter(
    (e) => e.type === 'PHASE_COMPLETE' && e.actorId === duel.attackerAId
  ).length;
  const phasesB = duel.events.filter(
    (e) => e.type === 'PHASE_COMPLETE' && e.actorId === duel.attackerBId
  ).length;

  // Public events — no flag info, no scenario hints
  const publicEvents = duel.events
    .filter((e) => e.type !== 'FLAG_ATTEMPT')
    .map((e) => ({
      id: e.id,
      actorId: e.actorId,
      type: e.type,
      phase: e.type === 'PHASE_COMPLETE' ? (e.payload as any).phase : undefined,
      sabotageType: e.type === 'SABOTAGE_USED' ? (e.payload as any).sabotageType : undefined,
      createdAt: e.createdAt,
    }));

  return NextResponse.json({
    matchId,
    status: duel.match.status,
    winnerId: duel.winnerId,
    playerA: { id: duel.attackerAId, ...playerA, phasesCompleted: phasesA },
    playerB: { id: duel.attackerBId, ...playerB, phasesCompleted: phasesB },
    events: publicEvents,
  });
}
