export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

// One-time migration endpoint — admin only
// Hit POST /api/admin/migrate once after deploy to apply pending schema changes
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

  const results: string[] = [];

  try {
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT`;
    results.push('displayName column: OK');
  } catch (e: any) {
    results.push(`displayName column: ${e.message}`);
  }

  return NextResponse.json({ success: true, results });
}
