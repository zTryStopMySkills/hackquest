export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'global';
  const branch = searchParams.get('branch');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  if (filter === 'branch' && branch) {
    const users = await prisma.user.findMany({
      where: {
        skillBranches: {
          some: { branch: branch as 'WEB_HACKING' | 'NETWORKS' | 'CRYPTOGRAPHY' | 'FORENSICS' | 'SYSTEMS' },
        },
      },
      orderBy: { points: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        rank: true,
        points: true,
        elo: true,
        eloState: true,
        profileTitle: true,
        winStreak: true,
        skillBranches: {
          where: { branch: branch as 'WEB_HACKING' },
        },
      },
    });

    return NextResponse.json({ leaderboard: users, filter, branch });
  }

  if (filter === 'campaign') {
    const users = await prisma.user.findMany({
      where: { campaignChapter: { gt: 0 } },
      orderBy: [{ campaignChapter: 'desc' }, { points: 'desc' }],
      take: limit,
      select: {
        id: true,
        username: true,
        rank: true,
        points: true,
        campaignChapter: true,
        campaignDifficulty: true,
        profileTitle: true,
      },
    });

    return NextResponse.json({ leaderboard: users, filter });
  }

  const users = await prisma.user.findMany({
    orderBy: { points: 'desc' },
    take: limit,
    select: {
      id: true,
      username: true,
      rank: true,
      points: true,
      elo: true,
      eloState: true,
      profileTitle: true,
      winStreak: true,
    },
  });

  const total = await prisma.user.count();

  return NextResponse.json({ leaderboard: users, total, filter });
}
