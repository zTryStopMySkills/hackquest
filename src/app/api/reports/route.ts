export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_TYPES = ['BUG', 'FEEDBACK', 'IMPROVEMENT', 'CONTENT_ERROR', 'OTHER'];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  try {
    const { type, title, description } = await req.json();

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Tipo de reporte inválido' }, { status: 400 });
    }
    if (!title || title.trim().length < 5 || title.trim().length > 120) {
      return NextResponse.json({ error: 'El título debe tener entre 5 y 120 caracteres' }, { status: 400 });
    }
    if (!description || description.trim().length < 20 || description.trim().length > 2000) {
      return NextResponse.json({ error: 'La descripción debe tener entre 20 y 2000 caracteres' }, { status: 400 });
    }

    // Rate limit: 1 report per 10 minutes per user
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recent = await prisma.report.findFirst({
      where: { userId: session.userId, createdAt: { gte: tenMinutesAgo } },
    });
    if (recent) {
      const waitMs = recent.createdAt.getTime() + 10 * 60 * 1000 - Date.now();
      const waitMin = Math.ceil(waitMs / 60000);
      return NextResponse.json(
        { error: `Espera ${waitMin} minuto${waitMin !== 1 ? 's' : ''} antes de enviar otro reporte` },
        { status: 429 }
      );
    }

    const report = await prisma.report.create({
      data: {
        userId: session.userId,
        type,
        title: title.trim(),
        description: description.trim(),
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (err) {
    console.error('Report create error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const reports = await prisma.report.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, type: true, title: true, status: true, createdAt: true, adminNote: true },
  });

  return NextResponse.json({ reports });
}
