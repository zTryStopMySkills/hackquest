export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, generateToken, setSessionCookie } from '@/lib/auth';
import { TESTER_CODE } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const { username, email, password, agentCode } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json(
        { error: 'El nombre de agente debe tener entre 3 y 20 caracteres' },
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

    const passwordHash = await hashPassword(password);
    const isPremium = agentCode === TESTER_CODE;

    const user = await prisma.user.create({
      data: {
        username,
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
