export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MATCHMAKING_CONFIG, RANK_ORDER } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { mode, cancelMatchId } = await req.json();

  if (cancelMatchId) {
    await prisma.matchPlayer.deleteMany({
      where: { matchId: cancelMatchId, userId: session.userId },
    });

    const match = await prisma.match.findUnique({
      where: { id: cancelMatchId },
      include: { _count: { select: { players: true } } },
    });

    if (match && match._count.players === 0) {
      await prisma.match.delete({ where: { id: cancelMatchId } });
    }

    return NextResponse.json({ success: true, cancelled: true });
  }

  if (!mode || !['RACE', 'TURNS', 'RED_VS_BLUE'].includes(mode)) {
    return NextResponse.json({ error: 'Modo de juego inválido' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { rank: true, elo: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  if (mode === 'RED_VS_BLUE') {
    const rankIdx = RANK_ORDER.indexOf(user.rank as typeof RANK_ORDER[number]);
    const redTeamIdx = RANK_ORDER.indexOf('RED_TEAM');
    if (rankIdx < redTeamIdx) {
      return NextResponse.json(
        { error: 'Necesitas rango Red Team para acceder a este modo' },
        { status: 403 }
      );
    }
  }

  const existingMatch = await prisma.match.findFirst({
    where: {
      mode,
      status: 'WAITING',
      players: {
        none: { userId: session.userId },
      },
    },
    include: {
      players: { include: { user: { select: { username: true, rank: true, elo: true } } } },
      _count: { select: { players: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (existingMatch && existingMatch._count.players < MATCHMAKING_CONFIG.MAX_PLAYERS) {
    await prisma.matchPlayer.create({
      data: {
        matchId: existingMatch.id,
        userId: session.userId,
      },
    });

    const updatedMatch = await prisma.match.findUnique({
      where: { id: existingMatch.id },
      include: {
        players: { include: { user: { select: { username: true, rank: true, elo: true } } } },
        challenge: { select: { title: true, difficulty: true, branch: true } },
        _count: { select: { players: true } },
      },
    });

    const shouldStart = updatedMatch!._count.players >= MATCHMAKING_CONFIG.MIN_PLAYERS;

    if (shouldStart) {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return NextResponse.json({
      success: true,
      match: updatedMatch,
      started: shouldStart,
      waiting: !shouldStart,
    });
  }

  const availableChallenge = await prisma.challenge.findFirst({
    where: {
      type: 'PUZZLE',
      requiredRank: user.rank,
    },
    orderBy: { orderInBranch: 'asc' },
  });

  if (!availableChallenge) {
    return NextResponse.json(
      { error: 'No hay retos disponibles para tu rango' },
      { status: 404 }
    );
  }

  const newMatch = await prisma.match.create({
    data: {
      mode,
      status: 'WAITING',
      challengeId: availableChallenge.id,
      maxPlayers: mode === 'RED_VS_BLUE' ? 2 : MATCHMAKING_CONFIG.MAX_PLAYERS,
      timeLimit: availableChallenge.timeLimitSeconds,
      players: {
        create: {
          userId: session.userId,
        },
      },
    },
    include: {
      players: { include: { user: { select: { username: true, rank: true, elo: true } } } },
      challenge: { select: { title: true, difficulty: true, branch: true } },
    },
  });

  return NextResponse.json({
    success: true,
    match: newMatch,
    started: false,
    waiting: true,
    message: 'Buscando oponentes...',
  });
}
