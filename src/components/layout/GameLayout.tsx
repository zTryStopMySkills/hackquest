"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import RankBadge from "@/components/ui/RankBadge";
import EloBadge from "@/components/ui/EloBadge";
import type { Rank, EloState } from "@/types/game";

interface MatchInvite {
  id: string;
  fromUser: string;
  mode: string;
  expiresIn: number;
}

interface GameLayoutProps {
  children: React.ReactNode;
  username?: string;
  rank?: Rank;
  elo?: number;
  eloState?: EloState;
  points?: number;
  streak?: number;
  notifications?: MatchInvite[];
}

export default function GameLayout({
  children,
  username = "Agente_47",
  rank = "PENTESTER",
  elo = 1547,
  eloState = "STABLE",
  points = 12480,
  streak = 3,
  notifications = [],
}: GameLayoutProps) {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  const activeNotifications = notifications.filter(
    (n) => !dismissedNotifications.has(n.id)
  );

  function dismiss(id: string) {
    setDismissedNotifications((prev) => new Set([...prev, id]));
  }

  return (
    <div className="flex min-h-screen bg-military-dark">
      <Sidebar
        username={username}
        rank={rank}
        elo={elo}
        eloState={eloState}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-military-panel border-b border-military-border"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
        >
          {/* Left: greeting */}
          <div className="flex items-center gap-3">
            <p className="text-matrix-green/50 text-xs font-mono tracking-widest hidden sm:block">
              &gt; OPERATIVO:
            </p>
            <p
              className="text-matrix-green font-mono text-sm font-bold"
              style={{ textShadow: "0 0 6px rgba(0,255,65,0.5)" }}
            >
              {username}
            </p>
            <div className="hidden md:block">
              <RankBadge rank={rank} size="sm" />
            </div>
          </div>

          {/* Center: stats */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:block">
              <EloBadge elo={elo} state={eloState} compact />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-neon-amber/70">PTS</span>
              <span
                className="text-neon-amber font-bold tabular-nums"
                style={{ textShadow: "0 0 6px rgba(255,184,0,0.5)" }}
              >
                {points.toLocaleString()}
              </span>
            </div>

            {streak > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 border border-neon-amber/40 rounded-sm text-xs font-mono"
                style={{ backgroundColor: "rgba(255,184,0,0.05)" }}
              >
                <span className="text-neon-amber">{"[^]"}</span>
                <span className="text-neon-amber font-bold">{streak}</span>
                <span className="text-neon-amber/60">racha</span>
              </div>
            )}
          </div>

          {/* Right: system status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-mono text-matrix-green/40">
              <span
                className="inline-block w-1.5 h-1.5 bg-matrix-green rounded-full animate-pulse"
                style={{ boxShadow: "0 0 4px rgba(0,255,65,0.8)" }}
              />
              <span className="hidden sm:inline">CONECTADO</span>
            </div>

            <div className="text-xs font-mono text-matrix-green/30 hidden md:block">
              {new Date().toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </header>

        {/* Match invite notifications */}
        {activeNotifications.length > 0 && (
          <div className="px-6 pt-3 space-y-2">
            {activeNotifications.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between px-4 py-3 border border-neon-amber/40 bg-neon-amber/5 rounded-sm"
                style={{ boxShadow: "0 0 12px rgba(255,184,0,0.1)" }}
              >
                <div className="flex items-center gap-3 text-sm font-mono">
                  <span className="text-neon-amber font-bold">[!]</span>
                  <span className="text-matrix-green">
                    <span className="text-neon-amber font-bold">{invite.fromUser}</span>
                    {" te desafía a "}
                    <span className="text-matrix-bright font-bold uppercase">
                      {invite.mode}
                    </span>
                  </span>
                  <span className="text-matrix-green/40 text-xs">
                    Expira en {invite.expiresIn}s
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-hack py-1 px-3 text-xs">
                    ACEPTAR
                  </button>
                  <button
                    onClick={() => dismiss(invite.id)}
                    className="text-neon-red/60 hover:text-neon-red text-xs font-mono transition-colors"
                  >
                    [X]
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>

        {/* Footer bar */}
        <footer className="px-6 py-2 border-t border-military-border bg-military-panel/50">
          <p className="text-matrix-green/20 text-[10px] font-mono text-center tracking-widest uppercase">
            HackQuest v2.4.1 — Uso exclusivo de agentes autorizados — Todas las actividades son monitorizadas
          </p>
        </footer>
      </div>
    </div>
  );
}
