export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_TYPES = ['NOISE_INJECTION', 'HONEYPOT_TRIGGER', 'IDS_ALERT', 'INTEL_BLACKOUT'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { matchId } = await params;
  const { type } = await req.json();

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Tipo de sabotaje inválido' }, { status: 400 });
  }

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

  const charges = isA ? duel.sabotagesA : duel.sabotagesB;
  if (charges <= 0) {
    return NextResponse.json({ error: 'Sin cargas de sabotaje disponibles' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.duelMatch.update({
      where: { id: duel.id },
      data: isA ? { sabotagesA: charges - 1 } : { sabotagesB: charges - 1 },
    }),
    prisma.duelEvent.create({
      data: {
        duelMatchId: duel.id,
        actorId: session.userId,
        type: 'SABOTAGE_USED',
        payload: { sabotageType: type },
      },
    }),
  ]);

  return NextResponse.json({ success: true, remainingCharges: charges - 1 });
}
