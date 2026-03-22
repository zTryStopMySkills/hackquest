export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const notifications = await prisma.userNotification.findMany({
      where: { userId: session.userId },
      orderBy: [
        { read: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo notificaciones' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 });
    }

    const notification = await prisma.userNotification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== session.userId) {
      return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
    }

    const updated = await prisma.userNotification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ notification: updated });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json(
      { error: 'Error actualizando notificación' },
      { status: 500 },
    );
  }
}
