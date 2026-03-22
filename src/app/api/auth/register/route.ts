export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateToken, setSessionCookie } from '@/lib/auth';
const TESTER_CODE = process.env.TESTER_CODE || '';

// In-memory rate limiting: max 3 registrations per hour per IP
const registerAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  const max = 3;

  const entry = registerAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    registerAttempts.set(ip, { count: 1, resetAt: now + window });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { allowed, retryAfterSeconds } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: `Demasiados registros desde esta IP. Espera ${Math.ceil(retryAfterSeconds / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
    );
  }
  try {
    const { username, displayName, email, password, agentCode } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'El nombre de usuario debe tener entre 3 y 20 caracteres' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'El usuario solo puede tener letras, números, _ y -' },
        { status: 400 }
      );
    }

    if (displayName && displayName.length > 32) {
      return NextResponse.json(
        { error: 'El nombre visible no puede superar 32 caracteres' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: existingUser.username === username ? 'Nombre de agente ya en uso' : 'Email ya registrado' },
        { status: 409 }
      );
    }

    // Ensure displayName column exists (safe no-op if already present)
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT`;
    } catch {}

    const passwordHash = await hashPassword(password);
    const isPremium = agentCode === TESTER_CODE;

    const user = await prisma.user.create({
      data: {
        username,
        displayName: displayName || null,
        email,
        passwordHash,
        isPremium,
        rank: 'SCRIPT_KIDDIE',
        elo: 1000,
        eloState: 'STABLE',
        points: 0,
        skillBranches: {
          createMany: {
            data: [
              { branch: 'WEB_HACKING' },
              { branch: 'NETWORKS' },
              { branch: 'CRYPTOGRAPHY' },
              { branch: 'FORENSICS' },
              { branch: 'SYSTEMS' },
            ],
          },
        },
      },
    });

    const token = generateToken({ userId: user.id, username: user.username });
    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        rank: user.rank,
        isPremium,
      },
      message: isPremium
        ? '¡Código de reclutamiento aceptado! Acceso completo desbloqueado.'
        : '¡Agente registrado con éxito! Bienvenido a HackQuest.',
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
