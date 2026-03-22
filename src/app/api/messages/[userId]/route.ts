export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/messages/[userId] — historial de mensajes con ese usuario
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { userId: contactId } = await params;

  const messages = await prisma.privateMessage.findMany({
    where: {
      OR: [
        { senderId: session.userId, recipientId: contactId },
        { senderId: contactId, recipientId: session.userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 100,
    select: {
      id: true,
      content: true,
      createdAt: true,
      read: true,
      senderId: true,
      sender: { select: { username: true, rank: true } },
    },
  });

  // Marcar como leídos los mensajes recibidos
  await prisma.privateMessage.updateMany({
    where: { senderId: contactId, recipientId: session.userId, read: false },
    data: { read: true },
  });

  const contact = await prisma.user.findUnique({
    where: { id: contactId },
    select: { id: true, username: true, rank: true },
  });

  return NextResponse.json({ messages, contact });
}

// POST /api/messages/[userId] — enviar mensaje
export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { userId: recipientId } = await params;
  const { content } = await req.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: 'Mensaje demasiado largo (máx 1000 caracteres)' }, { status: 400 });
  }
  if (recipientId === session.userId) {
    return NextResponse.json({ error: 'No puedes enviarte mensajes a ti mismo' }, { status: 400 });
  }

  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true, isIsolated: true, isolatedUntil: true } });
  if (!recipient) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  // Check isolation
  if (recipient.isIsolated) {
    const stillIsolated = !recipient.isolatedUntil || recipient.isolatedUntil > new Date();
    if (stillIsolated) {
      return NextResponse.json({ error: 'Este usuario está temporalmente aislado' }, { status: 403 });
    }
  }

  const message = await prisma.privateMessage.create({
    data: { senderId: session.userId, recipientId, content: content.trim() },
    include: { sender: { select: { username: true, rank: true } } },
  });

  return NextResponse.json({ message });
}
