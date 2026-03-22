export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/messages — lista de conversaciones del usuario
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // Obtener usuarios con los que se ha intercambiado mensajes
  const sent      = await prisma.privateMessage.findMany({ where: { senderId: session.userId }, select: { recipientId: true }, distinct: ['recipientId'] });
  const received  = await prisma.privateMessage.findMany({ where: { recipientId: session.userId }, select: { senderId: true }, distinct: ['senderId'] });

  const contactIds = [...new Set([...sent.map(m => m.recipientId), ...received.map(m => m.senderId)])];

  const contacts = await prisma.user.findMany({
    where: { id: { in: contactIds } },
    select: { id: true, username: true, rank: true, lastActiveAt: true },
  });

  // Añadir el último mensaje y unread count por contacto
  const result = await Promise.all(contacts.map(async (c) => {
    const [lastMsg, unread] = await Promise.all([
      prisma.privateMessage.findFirst({
        where: { OR: [{ senderId: session.userId, recipientId: c.id }, { senderId: c.id, recipientId: session.userId }] },
        orderBy: { createdAt: 'desc' },
        select: { content: true, createdAt: true, senderId: true },
      }),
      prisma.privateMessage.count({ where: { senderId: c.id, recipientId: session.userId, read: false } }),
    ]);
    return { ...c, lastMessage: lastMsg, unreadCount: unread };
  }));

  result.sort((a, b) => {
    const ta = a.lastMessage?.createdAt?.getTime() ?? 0;
    const tb = b.lastMessage?.createdAt?.getTime() ?? 0;
    return tb - ta;
  });

  return NextResponse.json({ contacts: result });
}
