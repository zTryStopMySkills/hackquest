import GameLayout from '@/components/layout/GameLayout';

export default function GameGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameLayout>{children}</GameLayout>;
}
