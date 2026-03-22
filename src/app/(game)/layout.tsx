import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import GameLayout from '@/components/layout/GameLayout';

export default async function GameGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      displayName: true,
      rank: true,
      elo: true,
      eloState: true,
      points: true,
      winStreak: true,
      isAdmin: true,
      isPremium: true,
    },
  });

  if (!user) redirect('/login');

  return (
    <GameLayout
      username={(user as any).displayName ?? user.username}
      rank={user.rank as import('@/types/game').Rank}
      elo={user.elo}
      eloState={user.eloState as import('@/types/game').EloState}
      points={user.points}
      streak={user.winStreak}
      isAdmin={user.isAdmin}
      isPremium={user.isPremium}
    >
      {children}
    </GameLayout>
  );
}
