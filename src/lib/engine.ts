/**
 * HackQuest – Core Game Engine
 *
 * All points, ELO, rank, time-bonus, hint-cost, and block-detection
 * logic lives here. Pure functions with no side-effects; safe to call
 * from both the Next.js server layer and Edge functions.
 */

import type {
  Rank,
  EloState,
  TimeBonus,
  HintLevel,
  Command,
  PointsCalculation,
  EloUpdate,
  RankChangeResult,
  TimeBonusResult,
  BlockDetection,
  EloMultiplier,
  RankPenalty,
} from "@/types/game";

// ============================================================
// Internal constants
// ============================================================

/** Minimum and maximum ELO values allowed. */
const ELO_MIN = 400;
const ELO_MAX = 1500;

/** ELO change on standard victory / defeat / perfect solve. */
const ELO_WIN = 50;
const ELO_LOSS = -60;
/** Added on top of ELO_WIN for a perfect solve → +80 total */
const ELO_PERFECT_BONUS = 30;

/** Fixed bonus points for submitting a writeup / report. */
const REPORT_BONUS = 30;

/** Fixed daily-first-solve bonus points. */
const DAILY_BONUS = 15;

/** Perfect solve points multiplier applied to the running total. */
const PERFECT_MULTIPLIER = 2.0;

/** Streak threshold (consecutive wins or losses) before streak multiplier kicks in. */
const STREAK_THRESHOLD = 3;
const STREAK_WIN_MULTIPLIER = 1.5;
const STREAK_LOSS_MULTIPLIER = 1.5;

// ------------------------------------------------------------------
// Rank thresholds – [minPoints, maxPoints)
// ------------------------------------------------------------------
const RANK_THRESHOLDS: Record<Rank, { min: number; max: number }> = {
  SCRIPT_KIDDIE: { min: 0, max: 500 },
  JUNIOR: { min: 500, max: 1500 },
  PENTESTER: { min: 1500, max: 4000 },
  RED_TEAM: { min: 4000, max: 8000 },
  ELITE_HACKER: { min: 8000, max: 15000 },
  LEGEND: { min: 15000, max: Infinity },
};

const RANK_ORDER: Rank[] = [
  "SCRIPT_KIDDIE",
  "JUNIOR",
  "PENTESTER",
  "RED_TEAM",
  "ELITE_HACKER",
  "LEGEND",
];

// ------------------------------------------------------------------
// Rank penalty/gain table
// ------------------------------------------------------------------
const RANK_PENALTIES: Record<Rank, RankPenalty> = {
  SCRIPT_KIDDIE: { gainBase: 100, lossBase: 0, lossTimeout: 0, bonusFirst: 50 },
  JUNIOR: { gainBase: 90, lossBase: -15, lossTimeout: -8, bonusFirst: 40 },
  PENTESTER: { gainBase: 80, lossBase: -40, lossTimeout: -20, bonusFirst: 35 },
  RED_TEAM: { gainBase: 70, lossBase: -70, lossTimeout: -35, bonusFirst: 30 },
  ELITE_HACKER: { gainBase: 60, lossBase: -110, lossTimeout: -55, bonusFirst: 25 },
  LEGEND: { gainBase: 50, lossBase: -150, lossTimeout: -80, bonusFirst: 20 },
};

// ------------------------------------------------------------------
// ELO multiplier table
// ------------------------------------------------------------------
interface EloRange {
  min: number;
  max: number;
  state: EloState;
  gainMultiplier: number;
  lossMultiplier: number;
}

const ELO_RANGES: EloRange[] = [
  { min: 400, max: 700, state: "TILTED", gainMultiplier: 0.6, lossMultiplier: 1.4 },
  { min: 700, max: 800, state: "COLD", gainMultiplier: 0.7, lossMultiplier: 1.2 },
  { min: 800, max: 900, state: "COOLING", gainMultiplier: 0.85, lossMultiplier: 1.1 },
  { min: 900, max: 1100, state: "STABLE", gainMultiplier: 1.0, lossMultiplier: 1.0 },
  { min: 1100, max: 1200, state: "WARMING", gainMultiplier: 1.15, lossMultiplier: 0.9 },
  { min: 1200, max: 1350, state: "HOT", gainMultiplier: 1.3, lossMultiplier: 0.8 },
  { min: 1350, max: 1501, state: "ON_FIRE", gainMultiplier: 1.5, lossMultiplier: 0.7 },
];

// ============================================================
// Public API
// ============================================================

/**
 * Returns the rank penalty/gain config for a given rank.
 */
export function getPenalty(rank: Rank): RankPenalty {
  return { ...RANK_PENALTIES[rank] };
}

/**
 * Returns the ELO multiplier state for a given ELO value.
 */
export function getEloMultiplier(elo: number): EloMultiplier {
  const clamped = Math.max(ELO_MIN, Math.min(ELO_MAX, elo));
  for (const range of ELO_RANGES) {
    if (clamped >= range.min && clamped < range.max) {
      return {
        gainMultiplier: range.gainMultiplier,
        lossMultiplier: range.lossMultiplier,
        state: range.state,
      };
    }
  }
  // Fallback – should never be reached given full coverage above.
  return { gainMultiplier: 1.0, lossMultiplier: 1.0, state: "STABLE" };
}

/**
 * Returns the rank a player belongs to given their total cumulative points.
 */
export function getRankForPoints(points: number): Rank {
  for (const rank of [...RANK_ORDER].reverse()) {
    if (points >= RANK_THRESHOLDS[rank].min) {
      return rank;
    }
  }
  return "SCRIPT_KIDDIE";
}

/**
 * Returns the time bonus category and its point multiplier.
 *
 * @param timeSpent   Seconds the player spent on the challenge.
 * @param timeLimit   Maximum allowed seconds for the challenge.
 */
export function getTimeBonus(
  timeSpent: number,
  timeLimit: number
): TimeBonusResult {
  if (timeLimit <= 0) {
    return { bonus: "CLEAR", multiplier: 1.0, timePercent: 1.0 };
  }

  const ratio = timeSpent / timeLimit;

  if (ratio < 0.25) {
    return { bonus: "LIGHTNING", multiplier: 2.0, timePercent: ratio };
  }
  if (ratio < 0.5) {
    return { bonus: "FAST", multiplier: 1.5, timePercent: ratio };
  }
  if (ratio < 0.75) {
    return { bonus: "GOOD", multiplier: 1.2, timePercent: ratio };
  }
  if (ratio <= 1.0) {
    return { bonus: "CLEAR", multiplier: 1.0, timePercent: ratio };
  }

  // OVERTIME: -10% per additional 10% of timeLimit consumed beyond 100%.
  const overtimeRatio = ratio - 1.0;
  const tenPercentBlocks = Math.floor(overtimeRatio / 0.1);
  const multiplier = Math.max(0.1, 1.0 - tenPercentBlocks * 0.1);
  return { bonus: "OVERTIME", multiplier, timePercent: ratio };
}

/**
 * Calculates the point cost of revealing a hint.
 *
 * Level 1 → 10% of basePoints
 * Level 2 → 20% of basePoints
 * Level 3 → 35% of basePoints
 */
export function getHintCost(hintLevel: 1 | 2 | 3, basePoints: number): number {
  const costMap: Record<1 | 2 | 3, number> = { 1: 0.1, 2: 0.2, 3: 0.35 };
  return Math.round(basePoints * costMap[hintLevel]);
}

/**
 * Full points calculation for a successfully solved challenge.
 *
 * The returned shape matches the PointsCalculation interface from @/types/game:
 *   basePoints, eloMultiplier, speedBonus, streakBonus, hintPenalty, total
 *
 * Additional detail fields (breakdown string) are appended for UI use.
 *
 * @param params.rank          Current player rank (determines base gain).
 * @param params.basePoints    Challenge base point value.
 * @param params.position      Finishing position in competitive mode (1 = first; 1 for solo).
 * @param params.elo           Player ELO at time of solve.
 * @param params.timePercent   Fraction of timeLimit consumed (from getTimeBonus output).
 * @param params.hintsUsed     Number of hints consumed (0–3).
 * @param params.isPerfect     True if solved without any incorrect submissions.
 * @param params.isFirstOfDay  True if this is the player's first solve today.
 */
export function calculatePoints(params: {
  rank: Rank;
  basePoints: number;
  position: number;
  elo: number;
  timePercent: number;
  hintsUsed: number;
  isPerfect: boolean;
  isFirstOfDay: boolean;
}): PointsCalculation & {
  positionBonus: number;
  dailyBonus: number;
  perfectBonus: number;
  breakdown: string;
} {
  const {
    rank,
    basePoints,
    position,
    elo,
    timePercent,
    hintsUsed,
    isPerfect,
    isFirstOfDay,
  } = params;

  const penalty = getPenalty(rank);
  const eloMult = getEloMultiplier(elo);

  // ① Base gain from rank table
  const rankBaseGain = penalty.gainBase;

  // ② ELO multiplier on the rank base
  const eloMultiplierValue = eloMult.gainMultiplier;
  let running = rankBaseGain * eloMultiplierValue;

  // ③ Speed (time) bonus
  let speedBonusMultiplier: number;
  let timeBonusCategory: TimeBonus;
  if (timePercent < 0.25) {
    speedBonusMultiplier = 2.0;
    timeBonusCategory = "LIGHTNING";
  } else if (timePercent < 0.5) {
    speedBonusMultiplier = 1.5;
    timeBonusCategory = "FAST";
  } else if (timePercent < 0.75) {
    speedBonusMultiplier = 1.2;
    timeBonusCategory = "GOOD";
  } else if (timePercent <= 1.0) {
    speedBonusMultiplier = 1.0;
    timeBonusCategory = "CLEAR";
  } else {
    const blocks = Math.floor((timePercent - 1.0) / 0.1);
    speedBonusMultiplier = Math.max(0.1, 1.0 - blocks * 0.1);
    timeBonusCategory = "OVERTIME";
  }
  // speedBonus = the delta added by the time multiplier
  const beforeSpeed = running;
  running = running * speedBonusMultiplier;
  const speedBonus = Math.round(running - beforeSpeed);

  // ④ Perfect solve multiplier
  const perfectBonus = isPerfect ? Math.round(running * (PERFECT_MULTIPLIER - 1)) : 0;
  if (isPerfect) {
    running = running * PERFECT_MULTIPLIER;
  }

  // ⑤ Position / first-blood bonus
  // 1st → full bonusFirst, 2nd → 50%, 3rd → 25%, 4th+ → 0
  let positionBonus = 0;
  if (position === 1) {
    positionBonus = penalty.bonusFirst;
  } else if (position === 2) {
    positionBonus = Math.round(penalty.bonusFirst * 0.5);
  } else if (position === 3) {
    positionBonus = Math.round(penalty.bonusFirst * 0.25);
  }
  running += positionBonus;

  // ⑥ Daily first-solve bonus
  const dailyBonus = isFirstOfDay ? DAILY_BONUS : 0;
  running += dailyBonus;

  // ⑦ Streak bonus (caller passes streakBonus separately; here we expose 0 as default
  //    since streaks are tracked session-layer side, not inside this pure function).
  const streakBonus = 0;

  // ⑧ Hint penalty: cumulative cost of each hint level used
  let hintPenalty = 0;
  for (let i = 1; i <= Math.min(hintsUsed, 3); i++) {
    hintPenalty += getHintCost(i as 1 | 2 | 3, basePoints);
  }
  running -= hintPenalty;

  const total = Math.max(1, Math.round(running));

  const breakdown = [
    `Base(${rank}): ${rankBaseGain}`,
    `× ELO(${eloMult.state}): ${eloMultiplierValue}`,
    `× Speed(${timeBonusCategory}): ${speedBonusMultiplier}`,
    isPerfect ? `× Perfect: ${PERFECT_MULTIPLIER}` : null,
    positionBonus > 0 ? `+ Pos#${position}: +${positionBonus}` : null,
    dailyBonus > 0 ? `+ Daily: +${dailyBonus}` : null,
    hintPenalty > 0 ? `- Hints(${hintsUsed}): -${hintPenalty}` : null,
    `= ${total}`,
  ]
    .filter(Boolean)
    .join(" | ");

  return {
    // PointsCalculation fields (from @/types/game)
    basePoints: rankBaseGain,
    eloMultiplier: eloMultiplierValue,
    speedBonus,
    streakBonus,
    hintPenalty,
    total,
    // Extra detail fields for UI breakdown panel
    positionBonus,
    dailyBonus,
    perfectBonus,
    breakdown,
  };
}

/**
 * Updates a player's ELO after a match result.
 *
 * @param currentElo  Player's current ELO.
 * @param won         Whether the player won / solved.
 * @param isPerfect   Whether it was a perfect solve (no wrong attempts).
 */
export function updateElo(
  currentElo: number,
  won: boolean,
  isPerfect: boolean
): EloUpdate {
  let delta: number;

  if (won) {
    // Standard win = +50; perfect solve = +80 (+50 base + 30 bonus)
    delta = isPerfect ? ELO_WIN + ELO_PERFECT_BONUS : ELO_WIN;
  } else {
    delta = ELO_LOSS; // -60
  }

  const rawElo = currentElo + delta;
  const newElo = Math.max(ELO_MIN, Math.min(ELO_MAX, rawElo));
  const actualChange = newElo - currentElo;
  const { state } = getEloMultiplier(newElo);

  return { newElo, change: actualChange, state };
}

/**
 * Checks whether a points delta causes a rank promotion or demotion.
 *
 * Rank floor protection: a player cannot drop below the minimum points
 * of their current rank via normal loss (they stay at the floor instead).
 * This prevents rank demotion from a single loss after just promoting.
 *
 * @param currentRank    The player's current rank.
 * @param currentPoints  The player's current cumulative points.
 * @param pointChange    Signed point delta (positive = gain, negative = loss).
 */
export function checkRankChange(
  currentRank: Rank,
  currentPoints: number,
  pointChange: number
): RankChangeResult {
  const floor = RANK_THRESHOLDS[currentRank].min;

  let rawPoints = currentPoints + pointChange;

  // Apply rank floor protection
  if (rawPoints < floor) {
    rawPoints = floor;
  }

  const newRank = getRankForPoints(rawPoints);
  const rankChanged = newRank !== currentRank;

  let direction: "UP" | "DOWN" | "NONE" = "NONE";
  if (rankChanged) {
    const oldIndex = RANK_ORDER.indexOf(currentRank);
    const newIndex = RANK_ORDER.indexOf(newRank);
    direction = newIndex > oldIndex ? "UP" : "DOWN";
  }

  return { newRank, newPoints: rawPoints, rankChanged, direction };
}

/**
 * Detects whether a player appears to be stuck / blocked on a challenge phase.
 *
 * Returns a BlockDetection matching the interface from @/types/game.
 *
 * Heuristics:
 *   1. Time overrun: elapsed > 2× average phase time → increasing confidence.
 *   2. Repeated identical command: last 3+ commands are the same → +0.35.
 *   3. High command count with no completion: ≥ 10 attempts → +0.1–0.3.
 *
 * @param commandLog    Full command log for the current session.
 * @param currentPhase  0-indexed phase number the player is on.
 * @param averageTime   Average seconds a player takes per phase (global stat).
 * @param elapsedTime   Seconds elapsed since this phase started.
 */
export function detectBlock(
  commandLog: Command[],
  currentPhase: number,
  averageTime: number,
  elapsedTime: number
): BlockDetection {
  const phaseCommands = commandLog.filter((c) => c.phaseIndex === currentPhase);
  const commandCount = phaseCommands.length;

  let confidence = 0;
  const reasons: string[] = [];

  // Heuristic 1: time overrun
  if (averageTime > 0 && elapsedTime > averageTime * 2) {
    const overFactor = elapsedTime / (averageTime * 2);
    const timeFactor = Math.min(0.5, overFactor * 0.15);
    confidence += timeFactor;
    reasons.push(
      `Tiempo ${Math.round(elapsedTime)}s vs media ${Math.round(averageTime)}s`
    );
  }

  // Heuristic 2: repeated identical commands
  if (commandCount >= 3) {
    const last3 = phaseCommands.slice(-3).map((c) => c.input.trim());
    const allSame = last3.every((cmd) => cmd === last3[0]);
    if (allSame && last3[0] !== "") {
      confidence += 0.35;
      reasons.push(`Repitiendo el mismo comando: "${last3[0]}"`);
    }
  }

  // Heuristic 3: high command count without phase completion
  if (commandCount >= 10) {
    confidence += Math.min(0.3, (commandCount - 10) * 0.02 + 0.1);
    reasons.push(`${commandCount} intentos sin completar la fase`);
  }

  confidence = Math.min(1.0, confidence);
  const isStuck = confidence >= 0.4;

  // Map confidence to a suggested hint level (HintLevel is 0 | 1 | 2)
  let suggestedHint: HintLevel = 0;
  if (confidence >= 0.7) {
    suggestedHint = 2; // Level 3 hint (0-indexed → 2)
  } else if (confidence >= 0.45) {
    suggestedHint = 1; // Level 2 hint
  }

  return {
    isStuck,
    stuckAtPhase: currentPhase,
    reason: reasons.join("; ") || "Sin indicadores de bloqueo",
    suggestedHint,
    failedAttempts: commandCount,
    timeOnPhaseSeconds: Math.round(elapsedTime),
  };
}

// ============================================================
// Streak helpers (used by the multiplayer / session layer)
// ============================================================

/**
 * Applies streak multipliers to a raw ELO delta.
 *
 * @param baseDelta   Raw ELO change before streak modifier.
 * @param winStreak   Consecutive wins count.
 * @param lossStreak  Consecutive losses count.
 */
export function applyStreakToElo(
  baseDelta: number,
  winStreak: number,
  lossStreak: number
): number {
  if (baseDelta > 0 && winStreak >= STREAK_THRESHOLD) {
    return Math.round(baseDelta * STREAK_WIN_MULTIPLIER);
  }
  if (baseDelta < 0 && lossStreak >= STREAK_THRESHOLD) {
    return Math.round(baseDelta * STREAK_LOSS_MULTIPLIER);
  }
  return baseDelta;
}

/**
 * Applies streak multiplier to a points gain (used by session layer).
 *
 * @param basePoints  Points before streak modifier.
 * @param winStreak   Consecutive wins count.
 */
export function applyStreakToPoints(
  basePoints: number,
  winStreak: number
): number {
  if (winStreak >= STREAK_THRESHOLD) {
    return Math.round(basePoints * STREAK_WIN_MULTIPLIER);
  }
  return basePoints;
}

// ============================================================
// Convenience helpers
// ============================================================

/** Fixed report / writeup bonus (always +30 points). */
export function getReportBonus(): number {
  return REPORT_BONUS;
}

/** Fixed daily first-solve bonus (always +15 points). */
export function getDailyBonus(): number {
  return DAILY_BONUS;
}

/** Human-readable display label for a rank. */
export function getRankLabel(rank: Rank): string {
  const labels: Record<Rank, string> = {
    SCRIPT_KIDDIE: "Script Kiddie",
    JUNIOR: "Junior",
    PENTESTER: "Pentester",
    RED_TEAM: "Red Team",
    ELITE_HACKER: "Elite Hacker",
    LEGEND: "Legend",
  };
  return labels[rank];
}

/** Returns the min/max points band for a rank. */
export function getRankThreshold(rank: Rank): { min: number; max: number } {
  return { ...RANK_THRESHOLDS[rank] };
}

/** Returns all ranks in ascending order. */
export function getAllRanks(): Rank[] {
  return [...RANK_ORDER];
}

/** Returns progress within the current rank band as a 0–1 fraction. */
export function getRankProgress(rank: Rank, currentPoints: number): number {
  const { min, max } = RANK_THRESHOLDS[rank];
  if (max === Infinity) return 1.0; // LEGEND – no ceiling
  const range = max - min;
  if (range <= 0) return 1.0;
  return Math.max(0, Math.min(1, (currentPoints - min) / range));
}
