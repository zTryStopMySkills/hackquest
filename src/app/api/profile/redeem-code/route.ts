export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
const TESTER_CODE = process.env.TESTER_CODE || '';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const { code } = await req.json();

  if (code !== TESTER_CODE) {
    return NextResponse.json(
      { error: 'Código de reclutamiento inválido. Acceso denegado.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { isPremium: true },
  });

  return NextResponse.json({
    success: true,
    message: '¡Acceso completo desbloqueado! Bienvenido al programa de élite.',
    isPremium: user.isPremium,
  });
}
