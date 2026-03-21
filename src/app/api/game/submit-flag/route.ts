export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  RANK_POINTS,
  ELO_CONFIG,
  PERFECT_SOLVE_MULTIPLIER,
  REPORT_BONUS,
  DAILY_BONUS,
  STREAK_THRESHOLD,
  STREAK_MULTIPLIER,
  HINT_COSTS,
  RANK_THRESHOLDS,
  RANK_ORDER,
} from '@/lib/constants';

function getEloState(elo: number) {
  if (elo < 700) return 'TILTED';
  if (elo < 800) return 'COLD';
  if (elo < 900) return 'COOLING';
  if (elo < 1100) return 'STABLE';
  if (elo < 1200) return 'WARMING';
  if (elo < 1350) return 'HOT';
  return 'ON_FIRE';
}

function getEloMultipliers(elo: number) {
  const state = getEloState(elo);
  const multipliers: Record<string, { gain: number; loss: number }> = {
    TILTED: { gain: 0.6, loss: 1.4 },
    COLD: { gain: 0.7, loss: 1.2 },
    COOLING: { gain: 0.85, loss: 1.1 },
    STABLE: { gain: 1.0, loss: 1.0 },
    WARMING: { gain: 1.15, loss: 0.9 },
    HOT: { gain: 1.3, loss: 0.8 },
    ON_FIRE: { gain: 1.5, loss: 0.7 },
  };
  return multipliers[state];
}

function getTimeBonus(timeSpent: number, timeLimit: number) {
  const percent = (timeSpent / timeLimit) * 100;
  if (percent < 25) return { name: 'LIGHTNING', multiplier: 2.0 };
  if (percent < 50) return { name: 'FAST', multiplier: 1.5 };
  if (percent < 75) return { name: 'GOOD', multiplier: 1.2 };
  if (percent <= 100) return { name: 'CLEAR', multiplier: 1.0 };
  const overtimePercent = Math.floor((percent - 100) / 10);
  return { name: 'OVERTIME', multiplier: Math.max(0.1, 1 - overtimePercent * 0.1) };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  try {
    const { challengeId, flag, timeSpent, hintsUsed, commandLog, reportContent } = await req.json();

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json({ error: 'Reto no encontrado' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const isCorrect = flag === challenge.flag;
    const isPerfect = isCorrect && hintsUsed === 0;
    const rank = user.rank as keyof typeof RANK_POINTS;
    const rankConfig = RANK_POINTS[rank];
    const eloMults = getEloMultipliers(user.elo);

    let pointsChange = 0;
    let eloChange = 0;
    let timeBonusResult = { name: 'CLEAR', multiplier: 1.0 };

    if (isCorrect) {
      let baseGain: number = rankConfig.gain;

      timeBonusResult = getTimeBonus(timeSpent, challenge.timeLimitSeconds);
      baseGain = Math.round(baseGain * timeBonusResult.multiplier);

      if (isPerfect) {
        baseGain = Math.round(baseGain * PERFECT_SOLVE_MULTIPLIER);
      }

      baseGain = Math.round(baseGain * eloMults.gain);

      if (user.winStreak + 1 >= STREAK_THRESHOLD) {
        baseGain = Math.round(baseGain * STREAK_MULTIPLIER);
      }

      let hintPenalty = 0;
      for (let i = 1; i <= hintsUsed; i++) {
        hintPenalty += HINT_COSTS[i as 1 | 2 | 3] || 0;
      }
      baseGain = Math.round(baseGain * (1 - hintPenalty));

      if (reportContent && reportContent.length > 50) {
        baseGain += REPORT_BONUS;
      }

      const now = new Date();
      const lastBonus = user.dailyBonusClaimed;
      if (!lastBonus || now.toDateString() !== lastBonus.toDateString()) {
        baseGain += DAILY_BONUS;
      }

      pointsChange = baseGain;
      eloChange = isPerfect ? ELO_CONFIG.PERFECT_CHANGE : ELO_CONFIG.VICTORY_CHANGE;
    } else {
      pointsChange = rankConfig.loss as number;
      pointsChange = Math.round(pointsChange * eloMults.loss);

      if (user.lossStreak + 1 >= STREAK_THRESHOLD) {
        pointsChange = Math.round(pointsChange * STREAK_MULTIPLIER);
      }

      eloChange = ELO_CONFIG.DEFEAT_CHANGE;
    }

    const newPoints = Math.max(
      RANK_THRESHOLDS[rank].min,
      user.points + pointsChange
    );

    const newElo = Math.max(
      ELO_CONFIG.MIN,
      Math.min(ELO_CONFIG.MAX, user.elo + eloChange)
    );

    let newRank = rank;
    for (const r of RANK_ORDER) {
      if (newPoints >= RANK_THRESHOLDS[r].min && newPoints < RANK_THRESHOLDS[r].max) {
        newRank = r;
        break;
      }
    }
    if (newPoints >= RANK_THRESHOLDS.LEGEND.min) {
      newRank = 'LEGEND';
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: newPoints,
        elo: newElo,
        eloState: getEloState(newElo),
        rank: newRank,
        winStreak: isCorrect ? user.winStreak + 1 : 0,
        lossStreak: isCorrect ? 0 : user.lossStreak + 1,
        dailyBonusClaimed: isCorrect ? new Date() : user.dailyBonusClaimed,
      },
    });

    await prisma.challengeAttempt.create({
      data: {
        userId: user.id,
        challengeId,
        solved: isCorrect,
        score: isCorrect ? pointsChange : 0,
        hintsUsed,
        perfectSolve: isPerfect,
        timeSpentSeconds: timeSpent,
        commandLog: commandLog || [],
        reportContent,
      },
    });

    await prisma.eloHistory.create({
      data: {
        userId: user.id,
        elo: newElo,
        change: eloChange,
        reason: isCorrect ? `Resolvió ${challenge.title}` : `Falló ${challenge.title}`,
      },
    });

    if (isCorrect) {
      const technique = await prisma.technique.findFirst({
        where: { slug: challenge.slug },
      });

      if (technique) {
        await prisma.pokedexEntry.upsert({
          where: {
            userId_techniqueId: {
              userId: user.id,
              techniqueId: technique.id,
            },
          },
          create: {
            userId: user.id,
            techniqueId: technique.id,
            bestScore: pointsChange,
            bestTime: timeSpent,
            solvedPerfect: isPerfect,
          },
          update: {
            bestScore: { set: Math.max(pointsChange) },
            bestTime: { set: Math.min(timeSpent) },
            solvedPerfect: isPerfect || undefined,
          },
        });
      }
    }

    return NextResponse.json({
      correct: isCorrect,
      pointsChange,
      eloChange,
      newPoints,
      newElo,
      newRank,
      newEloState: getEloState(newElo),
      rankChanged: newRank !== rank,
      isPerfect,
      timeBonus: timeBonusResult,
      streakBonus: isCorrect && user.winStreak + 1 >= STREAK_THRESHOLD,
      debriefing: isCorrect ? challenge.debriefing : null,
    });
  } catch (error) {
    console.error('Submit flag error:', error);
    return NextResponse.json(
      { error: 'Error procesando la flag' },
      { status: 500 }
    );
  }
}
