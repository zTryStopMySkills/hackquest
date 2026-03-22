export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, rank: true, elo: true, isBanned: true },
    });

    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    if (user.isBanned) return NextResponse.json({ error: 'Cuenta suspendida' }, { status: 403 });

    // Check for existing waiting duel
    const waitingDuel = await prisma.match.findFirst({
      where: {
        mode: 'DUEL',
        status: 'WAITING',
        players: { none: { userId: session.userId } },
      },
      include: {
        players: { include: { user: { select: { id: true, username: true, rank: true, elo: true } } } },
        duelMatch: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Pick scenarios suitable for rank
    const scenarios = await prisma.duelScenario.findMany({
      where: { requiredRank: user.rank },
    });

    if (scenarios.length < 2) {
      // Fallback: any scenario
      const fallback = await prisma.duelScenario.findMany({ take: 6 });
      if (fallback.length < 2) {
        return NextResponse.json({ error: 'No hay escenarios disponibles. Ejecuta el seed primero.' }, { status: 503 });
      }
      scenarios.push(...fallback.filter(s => !scenarios.some(x => x.id === s.id)));
    }

    // Shuffle and pick 2 different ones
    const shuffled = scenarios.sort(() => Math.random() - 0.5);
    const scenarioA = shuffled[0];
    const scenarioB = shuffled[1] ?? shuffled[0];

    if (waitingDuel) {
      // Join existing duel — assign player B
      const opponent = waitingDuel.players[0];
      const duelRecord = waitingDuel.duelMatch!;

      await prisma.$transaction([
        prisma.matchPlayer.create({ data: { matchId: waitingDuel.id, userId: session.userId } }),
        prisma.match.update({ where: { id: waitingDuel.id }, data: { status: 'IN_PROGRESS' } }),
        prisma.duelMatch.update({
          where: { id: duelRecord.id },
          data: { attackerBId: session.userId, targetBId: scenarioB.id },
        }),
      ]);

      return NextResponse.json({
        success: true,
        matchId: waitingDuel.id,
        scenario: scenarioB,
        opponentName: opponent.user.username,
        opponentRank: opponent.user.rank,
        opponentElo: opponent.user.elo,
        started: true,
      });
    }

    // Find a placeholder challenge for the Match foreign key requirement
    const placeholder = await prisma.challenge.findFirst({ orderBy: { orderInBranch: 'asc' } });
    if (!placeholder) {
      return NextResponse.json({ error: 'No hay retos base disponibles. Ejecuta el seed primero.' }, { status: 503 });
    }

    // Create new waiting duel
    const newMatch = await prisma.match.create({
      data: {
        mode: 'DUEL',
        status: 'WAITING',
        challengeId: placeholder.id,
        maxPlayers: 2,
        timeLimit: 3600,
        players: { create: { userId: session.userId } },
        duelMatch: {
          create: {
            attackerAId: session.userId,
            attackerBId: session.userId, // placeholder, overwritten when B joins
            targetAId: scenarioA.id,
            targetBId: scenarioB.id,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      matchId: newMatch.id,
      scenario: scenarioA,
      opponentName: null,
      started: false,
      waiting: true,
    });
  } catch (err) {
    console.error('Duel create error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
