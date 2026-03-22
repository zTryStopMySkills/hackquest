export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { matchId } = await params;

  const duel = await prisma.duelMatch.findUnique({
    where: { matchId },
    include: {
      match: { select: { status: true, timeLimit: true, createdAt: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!duel) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 });

  const isA = duel.attackerAId === session.userId;
  const isB = duel.attackerBId === session.userId;
  if (!isA && !isB) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  // Fetch both players' user data
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

  const myId = session.userId;
  const myScenarioId = isA ? duel.targetAId : duel.targetBId;
  const scenario = await prisma.duelScenario.findUnique({ where: { id: myScenarioId } });

  // Intel feed: phase_complete events from opponent, sabotage events from anyone
  const intelEvents = duel.events.filter(
    (e) =>
      (e.type === 'PHASE_COMPLETE' && e.actorId !== myId) ||
      e.type === 'SABOTAGE_USED'
  );

  const myPhases = duel.events
    .filter((e) => e.type === 'PHASE_COMPLETE' && e.actorId === myId)
    .map((e) => (e.payload as any).phase as number);

  const opponentPhases = duel.events
    .filter((e) => e.type === 'PHASE_COMPLETE' && e.actorId !== myId)
    .length;

  const mySabotages = isA ? duel.sabotagesA : duel.sabotagesB;

  return NextResponse.json({
    matchId,
    status: duel.match.status,
    timeLimit: duel.match.timeLimit,
    createdAt: duel.match.createdAt,
    winnerId: duel.winnerId,
    eloChange: isA ? duel.eloChangeA : duel.eloChangeB,
    scenario,
    myPhasesCompleted: myPhases,
    opponentPhasesCount: opponentPhases,
    sabotageCharges: mySabotages,
    playerA: { id: duel.attackerAId, ...playerA },
    playerB: { id: duel.attackerBId, ...playerB },
    intelFeed: intelEvents,
  });
}
