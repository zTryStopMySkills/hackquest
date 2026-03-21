// HackQuest — Core Game Types
// Mirrors the Prisma schema and adds all game-specific runtime types.

// ---------------------------------------------------------------------------
// Enums (string literal unions kept for compatibility with existing code;
//        TypeScript const enums below are available for new code)
// ---------------------------------------------------------------------------

export type Rank =
  | "SCRIPT_KIDDIE"
  | "JUNIOR"
  | "PENTESTER"
  | "RED_TEAM"
  | "ELITE_HACKER"
  | "LEGEND";

export type EloState =
  | "TILTED"
  | "COLD"
  | "COOLING"
  | "STABLE"
  | "WARMING"
  | "HOT"
  | "ON_FIRE";

export type CampaignDifficulty = "HARD" | "MEDIUM" | "EXPERT";

export type ProfileTitle = "NONE" | "SECURITY" | "HACKER" | "THE_ONE";

export type BannerType =
  | "NONE"
  | "SECURITY_BLUE"
  | "SECURITY_CYAN"
  | "HACKER_MATRIX"
  | "HACKER_GOLD"
  | "THE_ONE_RED";

export type Branch =
  | "WEB_HACKING"
  | "NETWORKS"
  | "CRYPTOGRAPHY"
  | "FORENSICS"
  | "SYSTEMS";

/**
 * @deprecated Use Branch. ChallengeBranch kept for backwards compatibility
 * with existing component code that imported it from this module.
 */
export type ChallengeBranch =
  | "WEB_HACKING"
  | "NETWORK"
  | "CRYPTOGRAPHY"
  | "REVERSE_ENGINEERING"
  | "FORENSICS"
  | "CAMPAIGN";

export type Difficulty =
  | "TRIVIAL"
  | "EASY"
  | "MEDIUM"
  | "HARD"
  | "EXPERT"
  | "LEGENDARY";

export type ChallengeType = "PUZZLE" | "SANDBOX" | "MULTIPLAYER" | "CAMPAIGN";

export type MatchMode = "RACE" | "TURNS" | "RED_VS_BLUE";

export type MatchStatus = "WAITING" | "IN_PROGRESS" | "FINISHED";

export type TeamColor = "RED" | "BLUE";

export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AchievementType =
  | "CAMPAIGN_HARD"
  | "CAMPAIGN_MEDIUM"
  | "CAMPAIGN_EXPERT"
  | "DAILY_STREAK"
  | "FIRST_BLOOD"
  | "PERFECT_SOLVE"
  | "ELO_MILESTONE"
  | "RANK_UP"
  | "BRANCH_MASTERY"
  | "POKEDEX_COMPLETE"
  | "WIN_STREAK"
  | "SPEED_DEMON"
  | "NO_HINTS"
  | "LEGEND_RANK";

/**
 * Bonus tier based on time-to-solve relative to the challenge time limit.
 *
 * - LIGHTNING  <= 20 % of time limit
 * - FAST       <= 40 %
 * - GOOD       <= 60 %
 * - CLEAR      <= 100 %
 * - OVERTIME   > 100 % (penalty zone)
 */
export type TimeBonus = "LIGHTNING" | "FAST" | "GOOD" | "CLEAR" | "OVERTIME";

/**
 * Hint visibility tier — 0-indexed, matching the 3-element hints array
 * stored in the Challenge model.
 */
export type HintLevel = 0 | 1 | 2;

// ---------------------------------------------------------------------------
// Database-mirroring interfaces
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  rank: Rank;
  points: number;
  elo: number;
  eloState: EloState;
  winStreak: number;
  lossStreak: number;
  isPremium: boolean;
  campaignDifficulty: CampaignDifficulty | null;
  campaignChapter: number;
  profileTitle: ProfileTitle;
  bannerType: BannerType;
  dailyBonusClaimed: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface SkillBranch {
  id: string;
  userId: string;
  branch: Branch;
  level: number;
  xp: number;
  unlockedChallenges: string[];
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  branch: Branch;
  difficulty: Difficulty;
  type: ChallengeType;
  timeLimitSeconds: number;
  basePoints: number;
  phases: GamePhase[];
  flag: string;
  briefing: string;
  debriefing: string;
  hints: Hint[];
  requiredRank: Rank;
  isFree: boolean;
  orderInBranch: number;
}

export interface ChallengeAttempt {
  id: string;
  userId: string;
  challengeId: string;
  startedAt: Date;
  completedAt: Date | null;
  solved: boolean;
  score: number;
  hintsUsed: number;
  perfectSolve: boolean;
  timeSpentSeconds: number;
  commandLog: CommandEntry[];
  reportContent: string | null;
}

export interface Match {
  id: string;
  mode: MatchMode;
  status: MatchStatus;
  challengeId: string;
  maxPlayers: number;
  timeLimit: number;
  createdAt: Date;
  finishedAt: Date | null;
}

export interface MatchPlayer {
  id: string;
  matchId: string;
  userId: string;
  position: number | null;
  score: number;
  progress: number;
  solved: boolean;
  solvedAt: Date | null;
  team: TeamColor | null;
}

export interface CampaignProgress {
  id: string;
  userId: string;
  chapterId: number;
  difficulty: CampaignDifficulty;
  completedAt: Date | null;
  attempts: number;
  currentPhase: number;
  score: number;
}

export interface PokedexEntry {
  id: string;
  userId: string;
  techniqueId: string;
  unlockedAt: Date;
  bestScore: number;
  bestTime: number;
  solvedPerfect: boolean;
}

export interface Technique {
  id: string;
  slug: string;
  name: string;
  branch: Branch;
  severity: Severity;
  cvssScore: number;
  description: string;
  howItWorks: string;
  realWorldImpact: string;
  howToDefend: string;
  relatedCves: string[];
  requiredRank: Rank;
}

export interface Achievement {
  id: string;
  userId: string;
  type: AchievementType;
  unlockedAt: Date;
  metadata: Record<string, unknown> | null;
}

export interface EloHistory {
  id: string;
  userId: string;
  elo: number;
  change: number;
  reason: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Challenge phase model
// ---------------------------------------------------------------------------

/**
 * A single phase inside a challenge.
 * Stored as JSON in the Challenge.phases column.
 * The validationFn field is a server-side resolver key, never eval'd from DB.
 */
export interface GamePhase {
  /** Display name shown in the terminal UI */
  name: string;
  /** Narrative description rendered before the phase prompt */
  description: string;
  /** Ordered commands the player must execute to advance */
  expectedCommands: string[];
  /**
   * Identifier for the server-side validation function.
   * Resolved by the challenge runner — never eval'd from DB.
   * Optional for static data definitions; required at runtime.
   */
  validationFn?: string;
  /** Optional per-phase time budget in seconds */
  timeLimitSeconds?: number;
  /** Optional points awarded specifically for completing this phase */
  points?: number;
  /** Per-phase hints shown progressively when the player is stuck */
  hints?: PhaseHint[];
}

// Backwards-compatible alias used by existing component code.
export type ChallengePhase = GamePhase;

// ---------------------------------------------------------------------------
// Hints
// ---------------------------------------------------------------------------

export interface Hint {
  level: HintLevel;
  text: string;
  /** Percentage of basePoints deducted when this hint is revealed */
  costPercent: number;
}

/** Per-phase hint (original shape, kept for backwards compatibility) */
export interface PhaseHint {
  level: 1 | 2 | 3;
  text: string;
}

/** Full challenge-level hint with a runtime cost (original shape) */
export interface ChallengeHint {
  level: 1 | 2 | 3;
  cost: number;
  text: string;
}

// ---------------------------------------------------------------------------
// Command log (ChallengeAttempt.commandLog rows)
// ---------------------------------------------------------------------------

export interface CommandEntry {
  timestamp: number;
  input: string;
  output: string;
  phase: number;
  success: boolean;
}

/** Original Command shape kept for backwards compatibility */
export interface Command {
  id: string;
  phaseIndex: number;
  input: string;
  output: string;
  timestamp: number;
  wasHint: boolean;
}

// ---------------------------------------------------------------------------
// Points & ELO calculation
// ---------------------------------------------------------------------------

export interface PointsCalculation {
  basePoints: number;
  /** Multiplier derived from the opponent's / leaderboard ELO spread */
  eloMultiplier: number;
  /** Bonus for finishing fast relative to the time limit */
  speedBonus: number;
  /** Bonus for consecutive wins / solves */
  streakBonus: number;
  /** Penalty applied per hint used */
  hintPenalty: number;
  /**
   * Final score after all modifiers:
   * floor(basePoints * eloMultiplier + speedBonus + streakBonus - hintPenalty)
   */
  total: number;
}

export interface RankConfig {
  rank: Rank;
  /** Minimum cumulative points to enter this rank */
  minPoints: number;
  /** Maximum cumulative points before forced promotion */
  maxPoints: number;
  /** Base points gained per solve at this rank */
  baseGain: number;
  /** Base points lost per failed attempt at this rank */
  baseLoss: number;
  /** Extra bonus awarded for first-blood (first global solve) */
  bonusFirst: number;
}

export interface EloConfig {
  /** Floor — ELO cannot drop below this */
  min: number;
  /** Ceiling — ELO cannot exceed this */
  max: number;
  /**
   * Daily inactivity decay applied when the player has not competed
   * for more than 7 consecutive days
   */
  decay: number;
  /** ELO gained per ranked victory */
  victoryChange: number;
  /** ELO lost per ranked defeat */
  defeatChange: number;
}

// ---------------------------------------------------------------------------
// Backwards-compatible engine result shapes
// ---------------------------------------------------------------------------

export interface EloUpdate {
  newElo: number;
  change: number;
  state: EloState;
}

export interface RankChangeResult {
  newRank: Rank;
  newPoints: number;
  rankChanged: boolean;
  direction: "UP" | "DOWN" | "NONE";
}

export interface TimeBonusResult {
  bonus: TimeBonus;
  multiplier: number;
  /** 0-1+ fraction of timeLimit used */
  timePercent: number;
}

export interface EloMultiplier {
  gainMultiplier: number;
  lossMultiplier: number;
  state: EloState;
}

export interface RankPenalty {
  gainBase: number;
  lossBase: number;
  lossTimeout: number;
  bonusFirst: number;
}

// ---------------------------------------------------------------------------
// Narrative wrappers
// ---------------------------------------------------------------------------

export interface BriefingData {
  challengeId: string;
  title: string;
  /** Full mission narrative shown before the challenge starts */
  narrative: string;
  /** Optional inline image or ASCII art asset path */
  assetUrl?: string;
  objectives: string[];
  /** Branch icon identifier rendered in the UI */
  branchIcon: Branch;
  difficulty: Difficulty;
  estimatedMinutes: number;
}

export interface DebriefingData {
  challengeId: string;
  solved: boolean;
  /** Story conclusion paragraph */
  narrative: string;
  /** Technique unlocked in the Pokedex (if any) */
  unlockedTechniqueId?: string;
  pointsAwarded: number;
  timeTaken: number;
  timeBonus: TimeBonus;
  perfectSolve: boolean;
  eloChange: number;
  newRank?: Rank;
}

// ---------------------------------------------------------------------------
// Challenge result (API response after an attempt completes)
// ---------------------------------------------------------------------------

export interface ChallengeResult {
  attemptId: string;
  challengeId: string;
  userId: string;
  solved: boolean;
  score: number;
  timeSpentSeconds: number;
  hintsUsed: number;
  perfectSolve: boolean;
  timeBonus: TimeBonus;
  pointsBreakdown: PointsCalculation;
  eloChange: number;
  newElo: number;
  newEloState: EloState;
  rankUp: boolean;
  newRank: Rank;
  achievementsUnlocked: AchievementType[];
  debriefing: DebriefingData;
}

// ---------------------------------------------------------------------------
// Real-time match state (Socket.IO payloads)
// ---------------------------------------------------------------------------

export interface PlayerProgress {
  userId: string;
  username: string;
  avatarUrl: string | null;
  rank: Rank;
  currentPhase: number;
  totalPhases: number;
  /** 0-1 float representing completion percentage */
  progress: number;
  score: number;
  solved: boolean;
  solvedAt: number | null;
  team: TeamColor | null;
  /** Latest command submitted by this player */
  lastCommand?: string;
}

export interface MatchState {
  matchId: string;
  mode: MatchMode;
  status: MatchStatus;
  challengeId: string;
  challengeTitle: string;
  timeLimit: number;
  /** Server timestamp (ms) when the match transitioned to IN_PROGRESS */
  startedAt: number | null;
  /** Remaining time in seconds — computed server-side and broadcast periodically */
  remainingSeconds: number;
  players: PlayerProgress[];
  /** Populated once the match is FINISHED */
  finalRanking: Array<{ userId: string; position: number; score: number }>;
}

// ---------------------------------------------------------------------------
// Matchmaking
// ---------------------------------------------------------------------------

export interface MatchmakingRequest {
  userId: string;
  mode: MatchMode;
  /** Target branch to filter challenges — optional */
  branch?: Branch;
  /** Target difficulty — optional; server may widen the search if no match found */
  difficulty?: Difficulty;
  /** ELO of the requesting player — used for fair pairing */
  elo: number;
  rank: Rank;
  /** Epoch ms timestamp when the player entered the queue */
  queuedAt: number;
}

// ---------------------------------------------------------------------------
// Block detection (anti-frustration system)
// ---------------------------------------------------------------------------

export interface BlockDetection {
  /** True when the engine determines the player is stuck */
  isStuck: boolean;
  /** Index of the phase where the player is blocked */
  stuckAtPhase: number;
  /**
   * Human-readable reason for the block determination.
   * Example: "No progress in last 8 minutes" or "Wrong command repeated 5 times"
   */
  reason: string;
  /** Index into Challenge.hints the engine recommends revealing */
  suggestedHint: HintLevel;
  /** Number of failed attempts on the current phase */
  failedAttempts: number;
  /** Time spent on the current phase in seconds */
  timeOnPhaseSeconds: number;
}

// ---------------------------------------------------------------------------
// Static data types (challenge/technique definitions stored in /data/)
// ---------------------------------------------------------------------------

export interface ChallengeData {
  slug: string;
  title: string;
  description: string;
  branch: ChallengeBranch;
  difficulty: Difficulty;
  type: ChallengeType;
  timeLimitSeconds: number;
  basePoints: number;
  briefing: string;
  debriefing: string;
  flag: string;
  phases: ChallengePhase[];
  hints: ChallengeHint[];
  requiredRank: Rank;
  isFree: boolean;
  orderInBranch: number;
}

export interface RelatedCve {
  id: string;
  description: string;
  severity: Severity;
}

export interface TechniqueData {
  slug: string;
  name: string;
  branch: ChallengeBranch;
  severity: Severity;
  cvssScore: number;
  description: string;
  howItWorks: string;
  realWorldImpact: string;
  howToDefend: string;
  relatedCves: RelatedCve[];
}

export interface CampaignChapter {
  slug: string;
  title: string;
  subtitle: string;
  narrative: string;
  branch: ChallengeBranch;
  orderIndex: number;
  requiredRank: Rank;
  challenges: ChallengeData[];
}
