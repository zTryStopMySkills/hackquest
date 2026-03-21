"use client";

import { useState } from "react";
import GameLayout from "@/components/layout/GameLayout";
import Panel from "@/components/ui/Panel";
import RankBadge from "@/components/ui/RankBadge";
import EloBadge from "@/components/ui/EloBadge";
import type { Rank, EloState } from "@/types/game";

type FilterType = "GLOBAL" | "WEB" | "REDES" | "CRYPTO" | "CAMPANA";

interface LeaderboardEntry {
  position: number;
  username: string;
  rank: Rank;
  eloState: EloState;
  elo: number;
  points: number;
  winRate: number;
  wins: number;
  title: string;
  isCurrentUser: boolean;
  streak: number;
}

const LEADERBOARD_DATA: LeaderboardEntry[] = [
  {
    position: 1, username: "phantom_kernel", rank: "LEGEND", eloState: "ON_FIRE",
    elo: 2847, points: 94200, winRate: 78, wins: 312, title: "THE LEGEND", isCurrentUser: false, streak: 14,
  },
  {
    position: 2, username: "null_byte_zero", rank: "ELITE_HACKER", eloState: "ON_FIRE",
    elo: 2641, points: 78500, winRate: 74, wins: 287, title: "ELITE GHOST", isCurrentUser: false, streak: 8,
  },
  {
    position: 3, username: "recon_infinity", rank: "ELITE_HACKER", eloState: "HOT",
    elo: 2398, points: 67100, winRate: 71, wins: 241, title: "THE PHANTOM", isCurrentUser: false, streak: 5,
  },
  {
    position: 4, username: "shadow_exe", rank: "RED_TEAM", eloState: "HOT",
    elo: 2174, points: 55400, winRate: 68, wins: 198, title: "RED OPERATOR", isCurrentUser: false, streak: 4,
  },
  {
    position: 5, username: "void_walker_x", rank: "RED_TEAM", eloState: "WARMING",
    elo: 1987, points: 48900, winRate: 65, wins: 174, title: "INFILTRATOR", isCurrentUser: false, streak: 3,
  },
  {
    position: 6, username: "zero_day_hunter", rank: "RED_TEAM", eloState: "WARMING",
    elo: 1834, points: 43200, winRate: 63, wins: 159, title: "HUNTER", isCurrentUser: false, streak: 2,
  },
  {
    position: 7, username: "ghost_protocol_7", rank: "PENTESTER", eloState: "STABLE",
    elo: 1712, points: 37800, winRate: 61, wins: 143, title: "GHOST", isCurrentUser: false, streak: 0,
  },
  {
    position: 8, username: "Agente_47", rank: "PENTESTER", eloState: "STABLE",
    elo: 1547, points: 12480, winRate: 58, wins: 85, title: "THE PENTESTER", isCurrentUser: true, streak: 3,
  },
  {
    position: 9, username: "cryptic_mind_88", rank: "PENTESTER", eloState: "COOLING",
    elo: 1498, points: 29400, winRate: 56, wins: 128, title: "CRYPTOGRAPHER", isCurrentUser: false, streak: 0,
  },
  {
    position: 10, username: "byte_bender", rank: "JUNIOR", eloState: "STABLE",
    elo: 1421, points: 22100, winRate: 54, wins: 110, title: "SECURITY", isCurrentUser: false, streak: 1,
  },
  {
    position: 11, username: "exploit_dev_9", rank: "JUNIOR", eloState: "COOLING",
    elo: 1387, points: 19800, winRate: 53, wins: 102, title: "DEVELOPER", isCurrentUser: false, streak: 0,
  },
  {
    position: 12, username: "net_phantom_01", rank: "JUNIOR", eloState: "COLD",
    elo: 1310, points: 17200, winRate: 50, wins: 98, title: "NETWORKER", isCurrentUser: false, streak: 0,
  },
  {
    position: 13, username: "malware_analyst", rank: "JUNIOR", eloState: "COLD",
    elo: 1248, points: 14500, winRate: 48, wins: 87, title: "ANALYST", isCurrentUser: false, streak: 0,
  },
  {
    position: 14, username: "kernel_panic_404", rank: "SCRIPT_KIDDIE", eloState: "COLD",
    elo: 1189, points: 11200, winRate: 46, wins: 71, title: "INITIATE", isCurrentUser: false, streak: 0,
  },
  {
    position: 15, username: "script_master_v2", rank: "SCRIPT_KIDDIE", eloState: "TILTED",
    elo: 1050, points: 8900, winRate: 41, wins: 58, title: "BEGINNER", isCurrentUser: false, streak: 0,
  },
];

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "GLOBAL", label: "Global" },
  { key: "WEB", label: "Web Hacking" },
  { key: "REDES", label: "Redes" },
  { key: "CRYPTO", label: "Criptografía" },
  { key: "CAMPANA", label: "Campaña" },
];

const POSITION_STYLES: Record<number, { color: string; glow: string; label: string }> = {
  1: { color: "#FFD700", glow: "rgba(255,215,0,0.4)", label: "ORO" },
  2: { color: "#C0C0C0", glow: "rgba(192,192,192,0.3)", label: "PLATA" },
  3: { color: "#CD7F32", glow: "rgba(205,127,50,0.3)", label: "BRONCE" },
};

export default function LeaderboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("GLOBAL");
  const currentUser = LEADERBOARD_DATA.find((e) => e.isCurrentUser);

  return (
    <GameLayout username="Agente_47" rank="PENTESTER" elo={1547} eloState="STABLE" points={12480} streak={3}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-matrix-green/40 text-xs font-mono tracking-widest">
              &gt; CLASIFICACION DE AGENTES — TOP SECRET
            </span>
          </div>
          <h1
            className="text-2xl font-mono font-bold text-matrix-green"
            style={{ textShadow: "0 0 8px rgba(0,255,65,0.5)" }}
          >
            RANKING GLOBAL
          </h1>
          <p className="text-matrix-green/40 text-sm font-mono mt-1">
            Los agentes más letales de la red.
          </p>
        </div>

        {/* Podium for top 3 */}
        <div className="grid grid-cols-3 gap-4">
          {LEADERBOARD_DATA.slice(0, 3).map((entry) => {
            const pos = POSITION_STYLES[entry.position]!;
            return (
              <div
                key={entry.username}
                className={`panel-classified p-4 text-center transition-all ${
                  entry.position === 1 ? "md:-mt-2 md:pb-6" : ""
                }`}
                style={{
                  borderLeft: `3px solid ${pos.color}`,
                  boxShadow: `0 0 20px ${pos.glow}, 0 0 40px ${pos.glow.replace("0.", "0.0")}`,
                }}
              >
                <p
                  className="text-3xl font-bold font-mono mb-1"
                  style={{
                    color: pos.color,
                    textShadow: `0 0 10px ${pos.glow}, 0 0 20px ${pos.glow}`,
                  }}
                >
                  #{entry.position}
                </p>
                <p className="text-[10px] font-mono tracking-widest mb-3" style={{ color: pos.color + "80" }}>
                  {pos.label}
                </p>
                <div
                  className="w-12 h-12 rounded-sm border-2 mx-auto flex items-center justify-center text-lg font-bold font-mono mb-3"
                  style={{
                    borderColor: pos.color,
                    color: pos.color,
                    backgroundColor: pos.color + "10",
                    boxShadow: `0 0 12px ${pos.glow}`,
                  }}
                >
                  {entry.username.slice(0, 2).toUpperCase()}
                </div>
                <p
                  className="font-mono font-bold text-sm mb-1 truncate"
                  style={{ color: pos.color, textShadow: `0 0 4px ${pos.glow}` }}
                >
                  {entry.username}
                </p>
                <p className="text-[10px] font-mono mb-2" style={{ color: pos.color + "60" }}>
                  {entry.title}
                </p>
                <div className="flex justify-center mb-2">
                  <RankBadge rank={entry.rank} size="sm" />
                </div>
                <p className="font-mono font-bold text-lg" style={{ color: pos.color }}>
                  {entry.elo}
                </p>
                <p className="text-[10px] font-mono text-matrix-green/30">ELO</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className="px-4 py-2 border font-mono text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0"
              style={{
                borderColor: activeFilter === filter.key ? "#00FF41" : "#1a2a1a",
                color: activeFilter === filter.key ? "#00FF41" : "#00FF4155",
                backgroundColor: activeFilter === filter.key ? "rgba(0,255,65,0.08)" : "transparent",
                boxShadow: activeFilter === filter.key ? "0 0 10px rgba(0,255,65,0.3)" : "none",
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Your position banner */}
        {currentUser && (
          <div
            className="flex items-center justify-between px-5 py-3 border border-matrix-green/40 bg-matrix-green/5 rounded-sm"
            style={{ boxShadow: "0 0 15px rgba(0,255,65,0.1)" }}
          >
            <div className="flex items-center gap-4">
              <span className="text-matrix-green/40 text-xs font-mono">TU POSICION:</span>
              <span
                className="text-2xl font-bold font-mono text-matrix-green"
                style={{ textShadow: "0 0 8px rgba(0,255,65,0.6)" }}
              >
                #{currentUser.position}
              </span>
              <div className="hidden sm:flex items-center gap-2">
                <RankBadge rank={currentUser.rank} size="sm" />
                <EloBadge elo={currentUser.elo} state={currentUser.eloState} compact />
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <p className="text-matrix-green/60">
                {currentUser.points.toLocaleString()} puntos
              </p>
              <p className="text-matrix-green/30">{currentUser.winRate}% win rate</p>
            </div>
          </div>
        )}

        {/* Full leaderboard table */}
        <Panel title="CLASIFICACION COMPLETA" classification="TOP_SECRET" noPadding>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-military-border text-matrix-green/40 text-xs uppercase tracking-widest">
                  <th className="px-4 py-3 text-left w-14">#</th>
                  <th className="px-4 py-3 text-left">Agente</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Rango</th>
                  <th className="px-4 py-3 text-right">Puntos</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">ELO</th>
                  <th className="px-4 py-3 text-right hidden lg:table-cell">Win Rate</th>
                  <th className="px-4 py-3 text-right hidden xl:table-cell">Victorias</th>
                  <th className="px-4 py-3 text-left hidden xl:table-cell">Titulo</th>
                </tr>
              </thead>
              <tbody>
                {LEADERBOARD_DATA.map((entry) => {
                  const posStyle = POSITION_STYLES[entry.position];
                  const isTop3 = entry.position <= 3;

                  return (
                    <tr
                      key={entry.username}
                      className={`border-b border-military-border/40 transition-all ${
                        entry.isCurrentUser
                          ? "bg-matrix-green/5 border-matrix-green/20"
                          : "hover:bg-military-accent/30"
                      }`}
                      style={
                        isTop3
                          ? { backgroundColor: posStyle.glow.replace("0.", "0.03") }
                          : {}
                      }
                    >
                      {/* Position */}
                      <td className="px-4 py-3 w-14">
                        <span
                          className={`font-bold text-base ${isTop3 ? "text-xl" : ""}`}
                          style={
                            isTop3
                              ? {
                                  color: posStyle.color,
                                  textShadow: `0 0 8px ${posStyle.glow}`,
                                }
                              : { color: "#00FF4150" }
                          }
                        >
                          {isTop3 ? `${entry.position}` : `${entry.position}`}
                        </span>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.isCurrentUser && (
                            <span
                              className="text-[9px] font-bold text-matrix-green border border-matrix-green/40 px-1 py-0.5 shrink-0"
                              style={{ boxShadow: "0 0 4px rgba(0,255,65,0.3)" }}
                            >
                              TU
                            </span>
                          )}
                          <span
                            className={`font-bold ${entry.isCurrentUser ? "text-matrix-green glow-text" : ""}`}
                            style={
                              isTop3
                                ? {
                                    color: posStyle.color,
                                    textShadow: `0 0 4px ${posStyle.glow}`,
                                  }
                                : {}
                            }
                          >
                            {entry.username}
                          </span>
                          {entry.streak >= 3 && (
                            <span
                              className="text-[9px] font-mono text-neon-amber"
                              style={{ textShadow: "0 0 4px rgba(255,184,0,0.5)" }}
                            >
                              [{entry.streak}]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rank */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <RankBadge rank={entry.rank} size="sm" />
                      </td>

                      {/* Points */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className="font-bold text-neon-amber tabular-nums"
                          style={{ textShadow: "0 0 4px rgba(255,184,0,0.3)" }}
                        >
                          {entry.points.toLocaleString()}
                        </span>
                      </td>

                      {/* ELO */}
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <EloBadge elo={entry.elo} state={entry.eloState} compact />
                      </td>

                      {/* Win Rate */}
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span
                          className="text-matrix-green tabular-nums"
                          style={
                            entry.winRate >= 70
                              ? { color: "#00FF41", textShadow: "0 0 4px rgba(0,255,65,0.4)" }
                              : entry.winRate >= 55
                              ? { color: "#FFB800" }
                              : { color: "#00FF4160" }
                          }
                        >
                          {entry.winRate}%
                        </span>
                      </td>

                      {/* Wins */}
                      <td className="px-4 py-3 text-right hidden xl:table-cell">
                        <span className="text-matrix-green/60 tabular-nums">{entry.wins}</span>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span
                          className="text-xs tracking-wider"
                          style={
                            isTop3
                              ? { color: posStyle.color + "80" }
                              : { color: "#00FF4140" }
                          }
                        >
                          {entry.title}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Footer note */}
        <p className="text-center text-matrix-green/20 text-[10px] font-mono tracking-wider">
          Rankings actualizados en tiempo real — Temporada 1 activa — Reinicio en 23 dias
        </p>
      </div>
    </GameLayout>
  );
}
