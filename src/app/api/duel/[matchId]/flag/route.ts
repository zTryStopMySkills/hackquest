export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ELO_CONFIG } from '@/lib/constants';

function getEloState(elo: number) {
  if (elo < 700) return 'TILTED';
  if (elo < 800) return 'COLD';
  if (elo < 900) return 'COOLING';
  if (elo < 1100) return 'STABLE';
  if (elo < 1200) return 'WARMING';
  if (elo < 1350) return 'HOT';
  return 'ON_FIRE';
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { matchId } = await params;
  const { flag } = await req.json();

  const duel = await prisma.duelMatch.findUnique({
    where: { matchId },
    include: { match: true },
  });
  if (!duel) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 });
  if (duel.match.status !== 'IN_PROGRESS') {
    return NextResponse.json({ error: 'El duelo no está activo' }, { status: 400 });
  }

  const isA = duel.attackerAId === session.userId;
  const isB = duel.attackerBId === session.userId;
  if (!isA && !isB) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const myScenarioId = isA ? duel.targetAId : duel.targetBId;
  const scenario = await prisma.duelScenario.findUnique({ where: { id: myScenarioId } });
  if (!scenario) return NextResponse.json({ error: 'Escenario no encontrado' }, { status: 404 });

  // Log attempt
  await prisma.duelEvent.create({
    data: {
      duelMatchId: duel.id,
      actorId: session.userId,
      type: 'FLAG_ATTEMPT',
      payload: { flag, correct: flag === scenario.flag },
    },
  });

  if (flag !== scenario.flag) {
    return NextResponse.json({ correct: false, message: 'Flag incorrecta. Sigue intentándolo.' });
  }

  // WINNER — finish the duel
  const opponentId = isA ? duel.attackerBId : duel.attackerAId;

  const myPhasesCount = await prisma.duelEvent.count({
    where: { duelMatchId: duel.id, actorId: session.userId, type: 'PHASE_COMPLETE' },
  });
  const opponentPhasesCount = await prisma.duelEvent.count({
    where: { duelMatchId: duel.id, actorId: opponentId, type: 'PHASE_COMPLETE' },
  });

  const [winner, loser] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId } }),
    prisma.user.findUnique({ where: { id: opponentId } }),
  ]);

  if (!winner || !loser) return NextResponse.json({ error: 'Usuarios no encontrados' }, { status: 500 });

  const winnerPoints = 500 + 50 * myPhasesCount + 50; // speed bonus
  const loserPoints  = 25 * opponentPhasesCount;

  const winnerEloChange = ELO_CONFIG.PERFECT_CHANGE; // +80
  const loserEloChange  = Math.max(-60, ELO_CONFIG.DEFEAT_CHANGE + 10 * opponentPhasesCount);

  const newWinnerElo = Math.min(ELO_CONFIG.MAX, winner.elo + winnerEloChange);
  const newLoserElo  = Math.max(ELO_CONFIG.MIN, loser.elo + loserEloChange);

  await prisma.$transaction([
    prisma.match.update({
      where: { id: matchId },
      data: { status: 'FINISHED', finishedAt: new Date() },
    }),
    prisma.duelMatch.update({
      where: { id: duel.id },
      data: {
        winnerId: session.userId,
        finishedAt: new Date(),
        ...(isA
          ? { eloChangeA: winnerEloChange, eloChangeB: loserEloChange }
          : { eloChangeB: winnerEloChange, eloChangeA: loserEloChange }),
      },
    }),
    prisma.user.update({
      where: { id: session.userId },
      data: {
        points: { increment: winnerPoints },
        elo: newWinnerElo,
        eloState: getEloState(newWinnerElo),
        winStreak: { increment: 1 },
        lossStreak: 0,
      },
    }),
    prisma.user.update({
      where: { id: opponentId },
      data: {
        points: { increment: loserPoints },
        elo: newLoserElo,
        eloState: getEloState(newLoserElo),
        lossStreak: { increment: 1 },
        winStreak: 0,
      },
    }),
    prisma.eloHistory.create({
      data: {
        userId: session.userId,
        elo: newWinnerElo,
        change: winnerEloChange,
        reason: `Victoria Duel vs ${loser.username}`,
      },
    }),
    prisma.eloHistory.create({
      data: {
        userId: opponentId,
        elo: newLoserElo,
        change: loserEloChange,
        reason: `Derrota Duel vs ${winner.username}`,
      },
    }),
    prisma.duelEvent.create({
      data: {
        duelMatchId: duel.id,
        actorId: session.userId,
        type: 'MATCH_END',
        payload: { winnerId: session.userId, winnerPoints, loserPoints },
      },
    }),
  ]);

  return NextResponse.json({
    correct: true,
    winner: true,
    pointsGained: winnerPoints,
    eloChange: winnerEloChange,
    newElo: newWinnerElo,
    opponentPhasesCompleted: opponentPhasesCount,
    scenario,
  });
}
