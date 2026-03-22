export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { prisma } = await import('./lib/db');
      // Apply pending schema changes that couldn't run at build time
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT`;
    } catch {
      // Column already exists or DB not ready — safe to ignore
    }
  }
}
