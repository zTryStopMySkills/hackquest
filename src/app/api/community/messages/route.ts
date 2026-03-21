export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const COOLDOWN_MS = 5000;
const MAX_LENGTH = 300;

const BLOCKED: { pattern: RegExp; msg: string }[] = [
  { pattern: /https?:\/\//i,                                          msg: 'No se permiten enlaces' },
  { pattern: /www\.[a-z]/i,                                           msg: 'No se permiten enlaces' },
  { pattern: /discord\.gg|t\.me\//i,                                  msg: 'No se permiten invitaciones externas' },
  { pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i,               msg: 'No se permiten correos electrónicos' },
  { pattern: /(\+\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4,}/, msg: 'No se permiten números de teléfono' },
  { pattern: /\b\d{9,}\b/,                                            msg: 'No se permiten números de teléfono' },
];

function validateContent(content: string): string | null {
  const t = content.trim();
  if (!t) return 'Mensaje vacío';
  if (t.length > MAX_LENGTH) return `Máximo ${MAX_LENGTH} caracteres`;
  for (const { pattern, msg } of BLOCKED) {
    if (pattern.test(t)) return msg;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const after = searchParams.get('after');

  const messages = await prisma.communityMessage.findMany({
    where: after
      ? { createdAt: { gt: new Date(Number(after)) } }
      : undefined,
    orderBy: { createdAt: 'asc' },
    take: 50,
    select: {
      id: true,
      displayName: true,
      content: true,
      rank: true,
      userId: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { content } = body;

  if (typeof content !== 'string') {
    return NextResponse.json({ error: 'Contenido inválido' }, { status: 400 });
  }

  const err = validateContent(content);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { rank: true, chatNickname: true, lastChatMessageAt: true, username: true },
  });

  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  if (user.lastChatMessageAt) {
    const elapsed = Date.now() - user.lastChatMessageAt.getTime();
    if (elapsed < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `Espera ${remaining}s antes de enviar otro mensaje` },
        { status: 429 }
      );
    }
  }

  const displayName = user.chatNickname || user.username;

  const [message] = await prisma.$transaction([
    prisma.communityMessage.create({
      data: {
        userId: session.userId,
        displayName,
        content: content.trim(),
        rank: user.rank,
      },
      select: {
        id: true,
        displayName: true,
        content: true,
        rank: true,
        userId: true,
        createdAt: true,
      },
    }),
    prisma.user.update({
      where: { id: session.userId },
      data: { lastChatMessageAt: new Date() },
    }),
  ]);

  return NextResponse.json({ message });
}
