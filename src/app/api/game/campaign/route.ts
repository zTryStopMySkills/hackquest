export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { CampaignDifficulty } from '@/types/game';

const CHAPTERS = [
  { id: 1, name: 'La Brecha', challenges: 4, description: 'Una brecha de seguridad en un hospital. Tu primera misión como agente.' },
  { id: 2, name: 'Dentro del Muro', challenges: 4, description: 'Has penetrado el perímetro. Ahora debes moverte sin ser detectado.' },
  { id: 3, name: 'Escalada', challenges: 5, description: 'Necesitas más privilegios para alcanzar tu objetivo. Escala hasta root.' },
  { id: 4, name: 'Exfiltración', challenges: 5, description: 'Tienes los datos. Ahora sácalos sin dejar rastro.' },
  { id: 5, name: 'Ghost Protocol', challenges: 6, description: 'La misión final. Borra toda evidencia y desaparece como un fantasma.' },
];

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        campaignChapter: true,
        campaignDifficulty: true,
        campaignProgress: {
          select: {
            chapterId: true,
            score: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const progressMap = new Map(
      user.campaignProgress.map((p) => [p.chapterId, p.score]),
    );

    const chapters = CHAPTERS.map((ch) => {
      let status: 'completed' | 'unlocked' | 'locked';
      if (ch.id <= user.campaignChapter) {
        status = 'completed';
      } else if (ch.id === user.campaignChapter + 1) {
        status = 'unlocked';
      } else {
        status = 'locked';
      }

      return {
        id: ch.id,
        name: ch.name,
        challenges: ch.challenges,
        description: ch.description,
        status,
        score: progressMap.get(ch.id) ?? 0,
      };
    });

    return NextResponse.json({
      chapters,
      currentDifficulty: user.campaignDifficulty ?? null,
      currentChapter: user.campaignChapter,
    });
  } catch (error) {
    console.error('Campaign GET error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo la campaña' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { difficulty } = (await req.json()) as { difficulty: CampaignDifficulty };

    if (!difficulty || !['HARD', 'MEDIUM', 'EXPERT'].includes(difficulty)) {
      return NextResponse.json({ error: 'Dificultad inválida' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { campaignDifficulty: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.campaignDifficulty) {
      return NextResponse.json(
        { error: 'La dificultad de campaña ya fue establecida y no se puede cambiar' },
        { status: 409 },
      );
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: { campaignDifficulty: difficulty },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Campaign POST error:', error);
    return NextResponse.json(
      { error: 'Error estableciendo la dificultad' },
      { status: 500 },
    );
  }
}

// PATCH — guardar progreso al completar un capítulo
// Body: { chapterId: number, score: number }
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { chapterId, score = 0 } = (await req.json()) as { chapterId: number; score?: number };

    const chapter = CHAPTERS.find(c => c.id === chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'Capítulo inválido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { campaignChapter: true, campaignDifficulty: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (!user.campaignDifficulty) {
      return NextResponse.json({ error: 'Debes elegir una dificultad primero' }, { status: 400 });
    }

    // Only advance if completing the current unlocked chapter
    const newChapter = Math.max(user.campaignChapter, chapterId);

    // Fetch current best score before upserting
    const existingProgress = await prisma.campaignProgress.findUnique({
      where: {
        userId_chapterId_difficulty: {
          userId: session.userId,
          chapterId,
          difficulty: user.campaignDifficulty,
        },
      },
      select: { score: true },
    });

    // Upsert CampaignProgress
    await prisma.campaignProgress.upsert({
      where: {
        userId_chapterId_difficulty: {
          userId: session.userId,
          chapterId,
          difficulty: user.campaignDifficulty,
        },
      },
      create: {
        userId: session.userId,
        chapterId,
        difficulty: user.campaignDifficulty,
        completedAt: new Date(),
        score,
        attempts: 1,
      },
      update: {
        completedAt: new Date(),
        score: Math.max(existingProgress?.score ?? 0, score),
        attempts: { increment: 1 },
      },
    });

    // Update user's current chapter
    await prisma.user.update({
      where: { id: session.userId },
      data: { campaignChapter: newChapter },
    });

    return NextResponse.json({ success: true, newChapter });
  } catch (error) {
    console.error('Campaign PATCH error:', error);
    return NextResponse.json(
      { error: 'Error guardando el progreso' },
      { status: 500 },
    );
  }
}
