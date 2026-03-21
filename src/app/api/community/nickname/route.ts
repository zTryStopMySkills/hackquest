export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { nickname } = body;

  if (typeof nickname !== 'string') {
    return NextResponse.json({ error: 'Nombre inválido' }, { status: 400 });
  }

  const trimmed = nickname.trim();

  if (trimmed.length < 3 || trimmed.length > 20) {
    return NextResponse.json(
      { error: 'El alias debe tener entre 3 y 20 caracteres' },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed)) {
    return NextResponse.json(
      { error: 'Solo letras, números, _ y - están permitidos' },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { chatNickname: trimmed },
  });

  return NextResponse.json({ success: true, nickname: trimmed });
}
