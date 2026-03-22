export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const { id } = await params;
  const { status, adminNote } = await req.json();

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
  }

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });

  const isClosing = status === 'RESOLVED' || status === 'DISMISSED';
  const wasNotClosed = report.status !== 'RESOLVED' && report.status !== 'DISMISSED';

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status,
      adminNote: adminNote?.trim() ?? report.adminNote,
      resolvedAt: isClosing && wasNotClosed ? new Date() : report.resolvedAt,
    },
  });

  // Send notification to user when resolved
  if (status === 'RESOLVED' && wasNotClosed) {
    await prisma.userNotification.create({
      data: {
        userId: report.userId,
        type: 'SYSTEM',
        title: '✓ Reporte resuelto',
        message: adminNote?.trim()
          ? `Tu reporte "${report.title}" ha sido marcado como resuelto. Nota del admin: ${adminNote.trim()}`
          : `Tu reporte "${report.title}" ha sido revisado y marcado como resuelto. ¡Gracias por el feedback!`,
      },
    });
  }

  if (status === 'DISMISSED' && wasNotClosed) {
    await prisma.userNotification.create({
      data: {
        userId: report.userId,
        type: 'SYSTEM',
        title: 'Reporte cerrado',
        message: adminNote?.trim()
          ? `Tu reporte "${report.title}" ha sido cerrado. Nota: ${adminNote.trim()}`
          : `Tu reporte "${report.title}" ha sido revisado y cerrado.`,
      },
    });
  }

  return NextResponse.json({ success: true, report: updated });
}
