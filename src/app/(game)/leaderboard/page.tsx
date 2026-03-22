"use client";

import { useState, useEffect, useCallback } from "react";
import Panel from "@/components/ui/Panel";
import RankBadge from "@/components/ui/RankBadge";
import EloBadge from "@/components/ui/EloBadge";
import type { Rank, EloState } from "@/types/game";

type FilterType = "GLOBAL" | "WEB_HACKING" | "NETWORKS" | "CRYPTOGRAPHY" | "FORENSICS" | "SYSTEMS" | "CAMPAIGN";

interface LeaderboardEntry {
  id: string;
  position: number;
  username: string;
  rank: Rank;
  eloState: EloState;
  elo: number;
  points: number;
  profileTitle: string;
  winStreak: number;
  isCurrentUser: boolean;
  // campaign filter extras
  campaignChapter?: number;
  campaignDifficulty?: string;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "GLOBAL",      label: "Global" },
  { key: "WEB_HACKING", label: "Web Hacking" },
  { key: "NETWORKS",    label: "Redes" },
  { key: "CRYPTOGRAPHY",label: "Criptografía" },
  { key: "FORENSICS",   label: "Forense" },
  { key: "SYSTEMS",     label: "Sistemas" },
  { key: "CAMPAIGN",    label: "Campaña" },
];

const POSITION_STYLES: Record<number, { color: string; glow: string; label: string }> = {
  1: { color: "#FFD700", glow: "rgba(255,215,0,0.4)", label: "ORO" },
  2: { color: "#C0C0C0", glow: "rgba(192,192,192,0.3)", label: "PLATA" },
  3: { color: "#CD7F32", glow: "rgba(205,127,50,0.3)", label: "BRONCE" },
};

export default function LeaderboardPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("GLOBAL");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string>('');

  // Fetch current user id once
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setMyId(d.id); });
  }, []);

  const fetchLeaderboard = useCallback(async (filter: FilterType) => {
    setLoading(true);
    let url = '/api/game/leaderboard?limit=50';
    if (filter === 'CAMPAIGN') {
      url += '&filter=campaign';
    } else if (filter !== 'GLOBAL') {
      url += `&filter=branch&branch=${filter}`;
    }
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const list = (data.leaderboard ?? []).map((u: any, idx: number) => ({
        ...u,
        position: idx + 1,
        isCurrentUser: u.id === myId,
        eloState: u.eloState ?? 'STABLE',
        winStreak: u.winStreak ?? 0,
        profileTitle: u.profileTitle ?? 'NONE',
      }));
      setEntries(list);
    }
    setLoading(false);
  }, [myId]);

  useEffect(() => {
    fetchLeaderboard(activeFilter);
  }, [activeFilter, fetchLeaderboard]);

  const top3 = entries.slice(0, 3);
  const currentUser = entries.find(e => e.isCurrentUser);
  const isCampaign = activeFilter === 'CAMPAIGN';

  return (
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

      {/* Podium for top 3 — only in non-campaign modes */}
      {!isCampaign && !loading && top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {top3.map((entry) => {
            const pos = POSITION_STYLES[entry.position]!;
            return (
              <div
                key={entry.id}
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
                  style={{ color: pos.color, textShadow: `0 0 10px ${pos.glow}, 0 0 20px ${pos.glow}` }}
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
                <p className="font-mono font-bold text-sm mb-1 truncate" style={{ color: pos.color, textShadow: `0 0 4px ${pos.glow}` }}>
                  {entry.username}
                </p>
                <p className="text-[10px] font-mono mb-2" style={{ color: pos.color + "60" }}>
                  {entry.profileTitle.replace(/_/g, ' ')}
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
      )}

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
            {!isCampaign && (
              <div className="hidden sm:flex items-center gap-2">
                <RankBadge rank={currentUser.rank} size="sm" />
                <EloBadge elo={currentUser.elo} state={currentUser.eloState} compact />
              </div>
            )}
          </div>
          <div className="text-right text-xs font-mono">
            <p className="text-matrix-green/60">
              {isCampaign
                ? `Capítulo ${currentUser.campaignChapter ?? 0}`
                : `${currentUser.points.toLocaleString()} puntos`}
            </p>
            {!isCampaign && (
              <p className="text-matrix-green/30">
                Racha: {currentUser.winStreak > 0 ? `${currentUser.winStreak} victorias` : '—'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Full leaderboard table */}
      <Panel title="CLASIFICACION COMPLETA" classification="TOP_SECRET" noPadding>
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-matrix-green/30 text-xs font-mono tracking-widest animate-pulse">
              &gt; DESCARGANDO DATOS CLASIFICADOS...
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-matrix-green/20 text-xs font-mono">Sin registros para este filtro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="border-b border-military-border text-matrix-green/40 text-xs uppercase tracking-widest">
                  <th className="px-4 py-3 text-left w-14">#</th>
                  <th className="px-4 py-3 text-left">Agente</th>
                  {!isCampaign && <th className="px-4 py-3 text-left hidden sm:table-cell">Rango</th>}
                  <th className="px-4 py-3 text-right">{isCampaign ? 'Capítulo' : 'Puntos'}</th>
                  {!isCampaign && <th className="px-4 py-3 text-right hidden md:table-cell">ELO</th>}
                  {!isCampaign && <th className="px-4 py-3 text-right hidden lg:table-cell">Racha</th>}
                  {isCampaign && <th className="px-4 py-3 text-center hidden md:table-cell">Dificultad</th>}
                  <th className="px-4 py-3 text-left hidden xl:table-cell">Título</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const posStyle = POSITION_STYLES[entry.position];
                  const isTop3 = entry.position <= 3;

                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-military-border/40 transition-all ${
                        entry.isCurrentUser
                          ? "bg-matrix-green/5 border-matrix-green/20"
                          : "hover:bg-military-accent/30"
                      }`}
                      style={isTop3 ? { backgroundColor: posStyle.glow.replace("0.", "0.03") } : {}}
                    >
                      {/* Position */}
                      <td className="px-4 py-3 w-14">
                        <span
                          className={`font-bold ${isTop3 ? "text-xl" : "text-base"}`}
                          style={isTop3 ? { color: posStyle.color, textShadow: `0 0 8px ${posStyle.glow}` } : { color: "#00FF4150" }}
                        >
                          {entry.position}
                        </span>
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {entry.isCurrentUser && (
                            <span className="text-[9px] font-bold text-matrix-green border border-matrix-green/40 px-1 py-0.5 shrink-0" style={{ boxShadow: "0 0 4px rgba(0,255,65,0.3)" }}>
                              TU
                            </span>
                          )}
                          <span
                            className={`font-bold ${entry.isCurrentUser ? "text-matrix-green glow-text" : ""}`}
                            style={isTop3 ? { color: posStyle.color, textShadow: `0 0 4px ${posStyle.glow}` } : {}}
                          >
                            {entry.username}
                          </span>
                          {entry.winStreak >= 3 && (
                            <span className="text-[9px] font-mono text-neon-amber" style={{ textShadow: "0 0 4px rgba(255,184,0,0.5)" }}>
                              [{entry.winStreak}🔥]
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rank */}
                      {!isCampaign && (
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <RankBadge rank={entry.rank} size="sm" />
                        </td>
                      )}

                      {/* Points / Chapter */}
                      <td className="px-4 py-3 text-right">
                        {isCampaign ? (
                          <span className="font-bold text-neon-amber tabular-nums" style={{ textShadow: "0 0 4px rgba(255,184,0,0.3)" }}>
                            Cap. {entry.campaignChapter ?? 0}
                          </span>
                        ) : (
                          <span className="font-bold text-neon-amber tabular-nums" style={{ textShadow: "0 0 4px rgba(255,184,0,0.3)" }}>
                            {entry.points.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* ELO */}
                      {!isCampaign && (
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <EloBadge elo={entry.elo} state={entry.eloState} compact />
                        </td>
                      )}

                      {/* Streak */}
                      {!isCampaign && (
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className={`tabular-nums ${entry.winStreak >= 5 ? 'text-neon-amber' : 'text-matrix-green/40'}`}>
                            {entry.winStreak > 0 ? `${entry.winStreak}x` : '—'}
                          </span>
                        </td>
                      )}

                      {/* Campaign difficulty */}
                      {isCampaign && (
                        <td className="px-4 py-3 text-center hidden md:table-cell">
                          <span className="text-[10px] font-mono text-matrix-green/40">
                            {entry.campaignDifficulty ?? '—'}
                          </span>
                        </td>
                      )}

                      {/* Title */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs tracking-wider" style={isTop3 ? { color: posStyle.color + "80" } : { color: "#00FF4140" }}>
                          {entry.profileTitle.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Footer note */}
      <p className="text-center text-matrix-green/20 text-[10px] font-mono tracking-wider">
        Rankings actualizados en tiempo real — Temporada 1 activa
      </p>
    </div>
  );
}
