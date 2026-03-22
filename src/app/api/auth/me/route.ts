export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      skillBranches: true,
      achievements: true,
      _count: {
        select: {
          challengeAttempts: { where: { solved: true } },
          pokedexEntries: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    createdAt: user.createdAt,
    username: user.username,
    displayName: (user as any).displayName ?? user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    rank: user.rank,
    points: user.points,
    elo: user.elo,
    eloState: user.eloState,
    winStreak: user.winStreak,
    lossStreak: user.lossStreak,
    isPremium: user.isPremium,
    profileTitle: user.profileTitle,
    bannerType: user.bannerType,
    campaignDifficulty: user.campaignDifficulty,
    campaignChapter: user.campaignChapter,
    skillBranches: user.skillBranches,
    achievements: user.achievements,
    solvedChallenges: user._count.challengeAttempts,
    pokedexCount: user._count.pokedexEntries,
    isAdmin: user.isAdmin,
    isBanned: user.isBanned,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { profileTitle } = await req.json();

  const VALID_TITLES = ['SECURITY', 'HACKER', 'THE_ONE', 'NONE'];
  if (!VALID_TITLES.includes(profileTitle)) {
    return NextResponse.json({ error: 'Título inválido' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: { profileTitle },
  });

  return NextResponse.json({ success: true });
}
