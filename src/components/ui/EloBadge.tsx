import type { EloState } from "@/types/game";

interface EloBadgeProps {
  elo: number;
  state: EloState;
  showProgress?: boolean;
  compact?: boolean;
}

const eloStateConfig: Record<
  EloState,
  {
    label: string;
    color: string;
    bg: string;
    glow: string;
    icon: string;
    description: string;
    thresholds: [number, number];
  }
> = {
  TILTED: {
    label: "TILTED",
    color: "#FF0040",
    bg: "rgba(255,0,64,0.1)",
    glow: "rgba(255,0,64,0.5)",
    icon: "[-]",
    description: "En racha negativa",
    thresholds: [0, 1000],
  },
  COLD: {
    label: "COLD",
    color: "#6688AA",
    bg: "rgba(102,136,170,0.1)",
    glow: "rgba(102,136,170,0.4)",
    icon: "[~]",
    description: "Rendimiento bajo",
    thresholds: [1000, 1200],
  },
  COOLING: {
    label: "COOLING",
    color: "#88AACC",
    bg: "rgba(136,170,204,0.1)",
    glow: "rgba(136,170,204,0.4)",
    icon: "[*]",
    description: "Recuperando forma",
    thresholds: [1200, 1400],
  },
  STABLE: {
    label: "STABLE",
    color: "#00FF41",
    bg: "rgba(0,255,65,0.1)",
    glow: "rgba(0,255,65,0.5)",
    icon: "[=]",
    description: "Rendimiento estable",
    thresholds: [1400, 1600],
  },
  WARMING: {
    label: "WARMING",
    color: "#FF8800",
    bg: "rgba(255,136,0,0.1)",
    glow: "rgba(255,136,0,0.5)",
    icon: "[+]",
    description: "En racha positiva",
    thresholds: [1600, 1800],
  },
  HOT: {
    label: "HOT",
    color: "#FF6600",
    bg: "rgba(255,102,0,0.1)",
    glow: "rgba(255,102,0,0.6)",
    icon: "[^]",
    description: "Muy en racha",
    thresholds: [1800, 2000],
  },
  ON_FIRE: {
    label: "ON FIRE",
    color: "#FF0066",
    bg: "rgba(255,0,102,0.1)",
    glow: "rgba(255,0,102,0.7)",
    icon: "[!]",
    description: "Imparable",
    thresholds: [2000, 2400],
  },
};

export default function EloBadge({
  elo,
  state,
  showProgress = false,
  compact = false,
}: EloBadgeProps) {
  const config = eloStateConfig[state];
  const [min, max] = config.thresholds;
  const progressPercent = Math.min(100, Math.max(0, ((elo - min) / (max - min)) * 100));

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono border rounded-sm"
        style={{
          color: config.color,
          borderColor: config.color,
          backgroundColor: config.bg,
          boxShadow: `0 0 6px ${config.glow}`,
          textShadow: `0 0 4px ${config.glow}`,
        }}
      >
        <span className="font-bold">{elo}</span>
        <span className="opacity-70">{config.label}</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-sm font-mono"
        style={{
          color: config.color,
          borderColor: config.color,
          backgroundColor: config.bg,
          boxShadow: `0 0 8px ${config.glow}`,
        }}
      >
        <span
          className="text-xs font-bold tracking-wider"
          style={{ textShadow: `0 0 6px ${config.glow}` }}
        >
          {config.icon}
        </span>
        <span
          className="text-lg font-bold"
          style={{ textShadow: `0 0 8px ${config.glow}` }}
        >
          {elo}
        </span>
        <span className="text-xs opacity-80 tracking-widest uppercase">
          {config.label}
        </span>
      </div>

      {showProgress && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-military-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: config.color,
                boxShadow: `0 0 6px ${config.glow}`,
              }}
            />
          </div>
          <span className="text-xs font-mono opacity-50 shrink-0">
            {max} ELO
          </span>
        </div>
      )}
    </div>
  );
}
