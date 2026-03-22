'use client';

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import Link from "next/link";

interface ActivityEntry {
  type: 'win' | 'loss';
  mode: string;
  challenge: string;
  points: string;
  time: string;
  solved: boolean;
  perfect: boolean;
}

const GAME_MODES = [
  {
    id: "race",
    icon: "[>>]",
    title: "CARRERA",
    subtitle: "Compite en tiempo real contra otros agentes",
    desc: "Resuelve retos más rápido que tu oponente. Cada segundo cuenta. El primer agente en capturar la flag gana puntos ELO y puntos de temporada.",
    href: "/play/matchmaking?mode=race",
    color: "#00FF41",
    glow: "rgba(0,255,65,0.3)",
    border: "#00FF41",
    badge: "ACTIVO",
    badgeColor: "#00FF41",
    players: "1v1",
    avgTime: "~8 min",
    locked: false,
  },
  {
    id: "turns",
    icon: "[|>]",
    title: "POR TURNOS",
    subtitle: "Observa y aprende de otros agentes",
    desc: "Modo asíncrono. Ve las soluciones de otros jugadores en tiempo diferido. Ideal para aprender nuevas técnicas sin presión de tiempo.",
    href: "/play/matchmaking?mode=turns",
    color: "#00FFFF",
    glow: "rgba(0,255,255,0.3)",
    border: "#00FFFF",
    badge: "NUEVO",
    badgeColor: "#00FFFF",
    players: "Asíncrono",
    avgTime: "~15 min",
    locked: false,
  },
  {
    id: "campaign",
    icon: "[◈]",
    title: "CAMPAÑA",
    subtitle: "Misiones clasificadas. Historia épica.",
    desc: "Sigue la narrativa de operaciones encubiertas. Cada capítulo revela nuevas técnicas y lore del mundo HackQuest. Requiere avanzar secuencialmente.",
    href: "/play/campaign",
    color: "#FFB800",
    glow: "rgba(255,184,0,0.3)",
    border: "#FFB800",
    badge: "EP.1",
    badgeColor: "#FFB800",
    players: "Solo",
    avgTime: "~30 min/cap.",
    locked: false,
  },
  {
    id: "redblue",
    icon: "[R/B]",
    title: "RED vs BLUE",
    subtitle: "Ataque vs Defensa. Requiere rango RED_TEAM",
    desc: "El modo más avanzado. Un equipo ataca infraestructura mientras el otro defiende en tiempo real. Solo disponible para agentes de alto rango.",
    href: "/play/matchmaking?mode=redblue",
    color: "#FF5722",
    glow: "rgba(255,87,34,0.3)",
    border: "#FF5722",
    badge: "BLOQUEADO",
    badgeColor: "#888888",
    players: "5v5",
    avgTime: "~45 min",
    locked: true,
    lockReason: "Requiere rango RED_TEAM",
  },
];

// QUICK_STATS and RECENT_ACTIVITY populated dynamically

export default function PlayPage() {
  const [stats, setStats] = useState({ totalMatches: 0, wins: 0, losses: 0, perfectSolves: 0, winRate: 0 });
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    fetch('/api/game/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); });
    fetch('/api/game/activity').then(r => r.ok ? r.json() : null).then(d => { if (d) setRecentActivity(d.activity ?? []); });
  }, []);

  const QUICK_STATS = [
    { label: "Partidas Jugadas", value: String(stats.totalMatches), icon: "[=]" },
    { label: "Tasa de Victoria", value: stats.totalMatches ? `${Math.round(stats.winRate * 100)}%` : "—", icon: "[^]" },
    { label: "Resueltos Perfecto", value: String(stats.perfectSolves), icon: "[!]" },
    { label: "Victorias", value: String(stats.wins), icon: "[*]" },
  ];

  return (
      <div className="p-6 space-y-8">
        {/* Page header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-matrix-green/40 text-xs font-mono tracking-widest">
              &gt; CENTRO DE OPERACIONES
            </span>
          </div>
          <h1
            className="text-2xl font-mono font-bold text-matrix-green"
            style={{ textShadow: "0 0 8px rgba(0,255,65,0.5)" }}
          >
            SELECCION DE MODO DE JUEGO
          </h1>
          <p className="text-matrix-green/40 text-sm font-mono mt-1">
            Elige tu próxima operación, Agente.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_STATS.map((stat) => (
            <div
              key={stat.label}
              className="panel-classified px-4 py-3 flex items-center gap-3"
            >
              <span className="text-matrix-green/50 font-mono text-sm shrink-0">
                {stat.icon}
              </span>
              <div>
                <p
                  className="text-xl font-bold font-mono text-matrix-green"
                  style={{ textShadow: "0 0 6px rgba(0,255,65,0.6)" }}
                >
                  {stat.value}
                </p>
                <p className="text-matrix-green/40 text-[10px] font-mono uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Game modes grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GAME_MODES.map((mode) => (
            <div
              key={mode.id}
              className={`relative group ${mode.locked ? "opacity-70" : ""}`}
            >
              <Link
                href={mode.locked ? "#" : mode.href}
                onClick={(e) => mode.locked && e.preventDefault()}
                className="block"
                aria-disabled={mode.locked}
              >
                <div
                  className="panel overflow-hidden transition-all duration-300 cursor-pointer"
                  style={{
                    borderLeft: `3px solid ${mode.locked ? "#444" : mode.border}`,
                    boxShadow: mode.locked
                      ? "none"
                      : `0 0 0 rgba(0,0,0,0), inset 0 0 20px rgba(0,0,0,0.5)`,
                  }}
                >
                  {/* Mode header */}
                  <div
                    className="flex items-center justify-between px-5 pt-5 pb-3 transition-all duration-300"
                    style={
                      !mode.locked
                        ? {}
                        : {}
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="text-2xl font-mono font-bold"
                        style={{
                          color: mode.locked ? "#444" : mode.color,
                          textShadow: mode.locked ? "none" : `0 0 8px ${mode.glow}`,
                        }}
                      >
                        {mode.icon}
                      </span>
                      <div>
                        <h2
                          className="font-mono font-bold text-lg tracking-widest"
                          style={{
                            color: mode.locked ? "#555" : mode.color,
                            textShadow: mode.locked ? "none" : `0 0 6px ${mode.glow}`,
                          }}
                        >
                          {mode.title}
                        </h2>
                        <p
                          className="text-xs font-mono"
                          style={{ color: mode.locked ? "#444" : `${mode.color}99` }}
                        >
                          {mode.subtitle}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 border rounded-sm"
                      style={{
                        color: mode.badgeColor,
                        borderColor: mode.badgeColor,
                        backgroundColor: `${mode.badgeColor}10`,
                        textShadow:
                          mode.badge !== "BLOQUEADO"
                            ? `0 0 4px ${mode.badgeColor}`
                            : "none",
                      }}
                    >
                      {mode.badge}
                    </span>
                  </div>

                  {/* Divider */}
                  <div
                    className="mx-5 h-px"
                    style={{
                      background: `linear-gradient(90deg, ${mode.locked ? "#1a2a1a" : mode.border}44, transparent)`,
                    }}
                  />

                  {/* Mode body */}
                  <div className="px-5 py-4">
                    <p
                      className="text-sm font-mono leading-relaxed mb-4"
                      style={{ color: mode.locked ? "#444" : "#00FF4199" }}
                    >
                      {mode.desc}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span style={{ color: mode.locked ? "#333" : `${mode.color}60` }}>
                          Jugadores:{" "}
                          <span
                            className="font-bold"
                            style={{ color: mode.locked ? "#444" : mode.color }}
                          >
                            {mode.players}
                          </span>
                        </span>
                        <span style={{ color: mode.locked ? "#333" : `${mode.color}60` }}>
                          Duración:{" "}
                          <span
                            className="font-bold"
                            style={{ color: mode.locked ? "#444" : mode.color }}
                          >
                            {mode.avgTime}
                          </span>
                        </span>
                      </div>

                      {mode.locked ? (
                        <span className="text-xs font-mono text-[#555] border border-[#333] px-3 py-1.5">
                          [BLOQUEADO]
                        </span>
                      ) : (
                        <span
                          className="text-xs font-mono font-bold px-3 py-1.5 border transition-all duration-200 group-hover:opacity-100 opacity-80"
                          style={{
                            color: mode.color,
                            borderColor: mode.color,
                            backgroundColor: `${mode.color}10`,
                            boxShadow: `0 0 8px ${mode.glow}`,
                          }}
                        >
                          [INICIAR] &gt;
                        </span>
                      )}
                    </div>

                    {mode.locked && mode.lockReason && (
                      <p className="mt-2 text-[10px] font-mono text-[#555] flex items-center gap-1">
                        <span>[L]</span>
                        <span>{mode.lockReason}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <Panel title="ACTIVIDAD RECIENTE" classification="UNCLASSIFIED">
          {recentActivity.length === 0 ? (
            <p className="text-matrix-green/20 text-xs font-mono text-center py-6">
              Sin actividad reciente — juega tu primer reto
            </p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 px-3 border border-military-border/40 hover:border-military-border transition-colors font-mono text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xs font-bold shrink-0"
                      style={{
                        color: activity.type === "win" ? "#00FF41" : "#FF0040",
                        textShadow: `0 0 4px currentColor`,
                      }}
                    >
                      {activity.type === "win" ? "[W]" : "[L]"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-matrix-green/80 text-xs truncate flex items-center gap-1">
                        {activity.challenge}
                        {activity.perfect && (
                          <span className="text-[9px] text-neon-cyan border border-neon-cyan/30 px-1 py-0.5 ml-1">PERFECT</span>
                        )}
                      </p>
                      <p className="text-matrix-green/30 text-[10px]">{activity.mode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    <span
                      className="font-bold"
                      style={{ color: activity.points.startsWith("+") ? "#00FF41" : "#FF0040" }}
                    >
                      {activity.points} pts
                    </span>
                    <span className="text-matrix-green/30">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
  );
}
