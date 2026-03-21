export const RANK_THRESHOLDS = {
  SCRIPT_KIDDIE: { min: 0, max: 500 },
  JUNIOR: { min: 500, max: 1500 },
  PENTESTER: { min: 1500, max: 4000 },
  RED_TEAM: { min: 4000, max: 8000 },
  ELITE_HACKER: { min: 8000, max: 15000 },
  LEGEND: { min: 15000, max: Infinity },
} as const;

export const RANK_ORDER = [
  'SCRIPT_KIDDIE',
  'JUNIOR',
  'PENTESTER',
  'RED_TEAM',
  'ELITE_HACKER',
  'LEGEND',
] as const;

export const RANK_POINTS = {
  SCRIPT_KIDDIE: { gain: 100, loss: 0, lossTimeout: 0, bonusFirst: 50 },
  JUNIOR: { gain: 90, loss: -15, lossTimeout: -8, bonusFirst: 40 },
  PENTESTER: { gain: 80, loss: -40, lossTimeout: -20, bonusFirst: 35 },
  RED_TEAM: { gain: 70, loss: -70, lossTimeout: -35, bonusFirst: 30 },
  ELITE_HACKER: { gain: 60, loss: -110, lossTimeout: -55, bonusFirst: 25 },
  LEGEND: { gain: 50, loss: -150, lossTimeout: -80, bonusFirst: 20 },
} as const;

export const ELO_CONFIG = {
  BASE: 1000,
  MIN: 400,
  MAX: 1500,
  VICTORY_CHANGE: 50,
  DEFEAT_CHANGE: -60,
  PERFECT_CHANGE: 80,
  DECAY_PER_DAY: 30,
  DECAY_AFTER_DAYS: 3,
} as const;

export const ELO_STATES = {
  TILTED: { min: 400, max: 700, gainMult: 0.6, lossMult: 1.4 },
  COLD: { min: 700, max: 800, gainMult: 0.7, lossMult: 1.2 },
  COOLING: { min: 800, max: 900, gainMult: 0.85, lossMult: 1.1 },
  STABLE: { min: 900, max: 1100, gainMult: 1.0, lossMult: 1.0 },
  WARMING: { min: 1100, max: 1200, gainMult: 1.15, lossMult: 0.9 },
  HOT: { min: 1200, max: 1350, gainMult: 1.3, lossMult: 0.8 },
  ON_FIRE: { min: 1350, max: 1500, gainMult: 1.5, lossMult: 0.7 },
} as const;

export const TIME_BONUSES = {
  LIGHTNING: { maxPercent: 25, multiplier: 2.0 },
  FAST: { maxPercent: 50, multiplier: 1.5 },
  GOOD: { maxPercent: 75, multiplier: 1.2 },
  CLEAR: { maxPercent: 100, multiplier: 1.0 },
} as const;

export const DIFFICULTY_TIMES = {
  TRIVIAL: { estimated: 180, given: 300 },
  EASY: { estimated: 480, given: 720 },
  MEDIUM: { estimated: 900, given: 1500 },
  HARD: { estimated: 1800, given: 2700 },
  EXPERT: { estimated: 3600, given: 5400 },
  LEGENDARY: { estimated: 7200, given: 10800 },
} as const;

export const HINT_COSTS = {
  1: 0.10,
  2: 0.25,
  3: 0.50,
} as const;

export const MAX_HINT_REVEAL = 0.38;

export const STREAK_THRESHOLD = 3;
export const STREAK_MULTIPLIER = 1.5;

export const PERFECT_SOLVE_MULTIPLIER = 2.0;
export const REPORT_BONUS = 30;
export const DAILY_BONUS = 15;

export const TESTER_CODE = '4l0p3c1411%';

export const BRANCHES = [
  { id: 'WEB_HACKING', name: 'Web Hacking', icon: '◈', color: '#FF5722' },
  { id: 'NETWORKS', name: 'Redes', icon: '◎', color: '#2196F3' },
  { id: 'CRYPTOGRAPHY', name: 'Criptografía', icon: '⬡', color: '#9C27B0' },
  { id: 'FORENSICS', name: 'Forense', icon: '◉', color: '#FF9800' },
  { id: 'SYSTEMS', name: 'Sistemas', icon: '▣', color: '#4CAF50' },
] as const;

export const RANK_COLORS = {
  SCRIPT_KIDDIE: '#888888',
  JUNIOR: '#4CAF50',
  PENTESTER: '#2196F3',
  RED_TEAM: '#FF5722',
  ELITE_HACKER: '#9C27B0',
  LEGEND: '#FFD700',
} as const;

export const RANK_NAMES: Record<string, string> = {
  SCRIPT_KIDDIE: 'Script Kiddie',
  JUNIOR: 'Junior',
  PENTESTER: 'Pentester',
  RED_TEAM: 'Red Team',
  ELITE_HACKER: 'Elite Hacker',
  LEGEND: 'Legend',
};

export const ELO_STATE_NAMES: Record<string, string> = {
  TILTED: 'Tilted',
  COLD: 'Cold',
  COOLING: 'Cooling',
  STABLE: 'Stable',
  WARMING: 'Warming',
  HOT: 'Hot',
  ON_FIRE: 'On Fire',
};

export const CAMPAIGN_CHAPTERS = [
  { id: 1, name: 'La Brecha', challenges: 4 },
  { id: 2, name: 'Dentro del Muro', challenges: 4 },
  { id: 3, name: 'Escalada', challenges: 5 },
  { id: 4, name: 'Exfiltración', challenges: 5 },
  { id: 5, name: 'Ghost Protocol', challenges: 6 },
] as const;

export const MATCHMAKING_CONFIG = {
  MAX_PLAYERS: 5,
  MIN_PLAYERS: 2,
  SEARCH_TIMEOUT_SECONDS: 60,
  RANK_RANGE_INITIAL: 1,
  RANK_RANGE_EXPANSION_SECONDS: 15,
  MAX_RANK_RANGE: 2,
} as const;

export const BLOCK_DETECTION = {
  TIME_MULTIPLIER: 2,
  REPEATED_COMMANDS_THRESHOLD: 3,
  INACTIVITY_SECONDS: 120,
  RANDOM_COMMANDS_THRESHOLD: 5,
} as const;
