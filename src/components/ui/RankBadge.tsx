import type { Rank } from "@/types/game";

interface RankBadgeProps {
  rank: Rank;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

const rankConfig: Record<
  Rank,
  { label: string; shortLabel: string; color: string; glow: string; bg: string }
> = {
  SCRIPT_KIDDIE: {
    label: "Script Kiddie",
    shortLabel: "SK",
    color: "#888888",
    glow: "rgba(136,136,136,0.6)",
    bg: "rgba(136,136,136,0.1)",
  },
  JUNIOR: {
    label: "Junior",
    shortLabel: "JR",
    color: "#4CAF50",
    glow: "rgba(76,175,80,0.6)",
    bg: "rgba(76,175,80,0.1)",
  },
  PENTESTER: {
    label: "Pentester",
    shortLabel: "PT",
    color: "#2196F3",
    glow: "rgba(33,150,243,0.6)",
    bg: "rgba(33,150,243,0.1)",
  },
  RED_TEAM: {
    label: "Red Team",
    shortLabel: "RT",
    color: "#FF5722",
    glow: "rgba(255,87,34,0.6)",
    bg: "rgba(255,87,34,0.1)",
  },
  ELITE_HACKER: {
    label: "Elite Hacker",
    shortLabel: "EH",
    color: "#9C27B0",
    glow: "rgba(156,39,176,0.6)",
    bg: "rgba(156,39,176,0.1)",
  },
  LEGEND: {
    label: "Legend",
    shortLabel: "LG",
    color: "#FFD700",
    glow: "rgba(255,215,0,0.8)",
    bg: "rgba(255,215,0,0.1)",
  },
};

const sizeClasses = {
  sm: { wrap: "px-2 py-0.5 text-xs gap-1", dot: "w-1.5 h-1.5" },
  md: { wrap: "px-3 py-1 text-sm gap-1.5", dot: "w-2 h-2" },
  lg: { wrap: "px-4 py-2 text-base gap-2", dot: "w-2.5 h-2.5" },
};

export default function RankBadge({
  rank,
  size = "md",
  showLabel = true,
}: RankBadgeProps) {
  const config = rankConfig[rank];
  const sizes = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center font-mono uppercase tracking-wider font-bold border rounded-sm ${sizes.wrap}`}
      style={{
        color: config.color,
        borderColor: config.color,
        backgroundColor: config.bg,
        boxShadow: `0 0 6px ${config.glow}, inset 0 0 6px ${config.bg}`,
        textShadow: `0 0 6px ${config.glow}`,
      }}
    >
      <span
        className={`rounded-full shrink-0 ${sizes.dot}`}
        style={{
          backgroundColor: config.color,
          boxShadow: `0 0 6px ${config.glow}`,
        }}
      />
      {showLabel ? config.label : config.shortLabel}
    </span>
  );
}
