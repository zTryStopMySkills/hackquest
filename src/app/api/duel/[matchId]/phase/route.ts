export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { matchId } = await params;
  const { phase, commandLog } = await req.json();

  const duel = await prisma.duelMatch.findUnique({ where: { matchId } });
  if (!duel) return NextResponse.json({ error: 'Duelo no encontrado' }, { status: 404 });

  const isA = duel.attackerAId === session.userId;
  const isB = duel.attackerBId === session.userId;
  if (!isA && !isB) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  // Don't double-record the same phase
  const existing = await prisma.duelEvent.findFirst({
    where: {
      duelMatchId: duel.id,
      actorId: session.userId,
      type: 'PHASE_COMPLETE',
    },
  });

  const completedPhases = await prisma.duelEvent.count({
    where: { duelMatchId: duel.id, actorId: session.userId, type: 'PHASE_COMPLETE' },
  });

  await prisma.duelEvent.create({
    data: {
      duelMatchId: duel.id,
      actorId: session.userId,
      type: 'PHASE_COMPLETE',
      payload: { phase, commandLog: commandLog ?? [] },
    },
  });

  // Award partial score: 50pts per phase
  await prisma.user.update({
    where: { id: session.userId },
    data: { points: { increment: 50 } },
  });

  return NextResponse.json({ success: true, phasesCompleted: completedPhases + 1 });
}
