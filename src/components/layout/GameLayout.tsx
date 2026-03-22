"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import RankBadge from "@/components/ui/RankBadge";
import EloBadge from "@/components/ui/EloBadge";
import type { Rank, EloState } from "@/types/game";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface GameLayoutProps {
  children: React.ReactNode;
  username?: string;
  rank?: Rank;
  elo?: number;
  eloState?: EloState;
  points?: number;
  streak?: number;
  isAdmin?: boolean;
  isPremium?: boolean;
}

export default function GameLayout({
  children,
  username = "Agente",
  rank = "SCRIPT_KIDDIE",
  elo = 1000,
  eloState = "STABLE",
  points = 0,
  streak = 0,
  isAdmin = false,
  isPremium = false,
}: GameLayoutProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on mount and every 30s
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications ?? []);
        }
      } catch {
        // silently ignore
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const TYPE_COLOR: Record<string, string> = {
    WARNING: "#FF0040",
    REWARD: "#FFB800",
    SYSTEM: "#00FFFF",
    ADMIN_MESSAGE: "#B347EA",
  };

  return (
    <div className="flex min-h-screen bg-military-dark">
      <Sidebar
        username={username}
        rank={rank}
        elo={elo}
        eloState={eloState}
        isAdmin={isAdmin}
        isPremium={isPremium}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 bg-military-panel border-b border-military-border"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.5)" }}
        >
          {/* Left: operativo */}
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
                <span className="text-neon-amber">[^]</span>
                <span className="text-neon-amber font-bold">{streak}</span>
                <span className="text-neon-amber/60">racha</span>
              </div>
            )}
          </div>

          {/* Right: notifications + status */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowNotifDropdown((v) => !v)}
                className="relative flex items-center justify-center w-8 h-8 border border-military-border hover:border-matrix-green/40 transition-colors rounded-sm"
                style={{ backgroundColor: unreadCount > 0 ? "rgba(0,255,65,0.05)" : undefined }}
                title="Notificaciones"
              >
                <span className="text-matrix-green/60 font-mono text-xs">[!]</span>
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold font-mono"
                    style={{ backgroundColor: "#FF0040", color: "#fff", boxShadow: "0 0 6px rgba(255,0,64,0.8)" }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 border border-military-border bg-military-panel z-50 shadow-2xl"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.8)" }}
                >
                  <div className="px-4 py-2 border-b border-military-border flex items-center justify-between">
                    <span className="text-matrix-green text-xs font-mono font-bold tracking-widest">
                      NOTIFICACIONES
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-matrix-green/40 text-[10px] font-mono">
                        {unreadCount} sin leer
                      </span>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-matrix-green/30 text-xs font-mono">Sin notificaciones</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="px-4 py-3 border-b border-military-border/40 hover:bg-military-accent/20 transition-colors cursor-pointer"
                          style={{ opacity: n.read ? 0.5 : 1 }}
                          onClick={() => !n.read && markRead(n.id)}
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className="text-xs font-bold font-mono shrink-0 mt-0.5"
                              style={{ color: TYPE_COLOR[n.type] ?? "#00FF41" }}
                            >
                              [{n.type.slice(0, 1)}]
                            </span>
                            <div className="min-w-0">
                              <p
                                className="text-xs font-bold font-mono truncate"
                                style={{ color: TYPE_COLOR[n.type] ?? "#00FF41" }}
                              >
                                {n.title}
                              </p>
                              <p className="text-matrix-green/60 text-[11px] font-mono leading-relaxed mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                            </div>
                            {!n.read && (
                              <span
                                className="shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                                style={{ backgroundColor: "#00FF41", boxShadow: "0 0 4px rgba(0,255,65,0.8)" }}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* System status */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-matrix-green/40">
              <span
                className="inline-block w-1.5 h-1.5 bg-matrix-green rounded-full animate-pulse"
                style={{ boxShadow: "0 0 4px rgba(0,255,65,0.8)" }}
              />
              <span className="hidden sm:inline">CONECTADO</span>
            </div>
            <div className="text-xs font-mono text-matrix-green/30 hidden md:block">
              {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>

        {/* Footer */}
        <footer className="px-6 py-2 border-t border-military-border bg-military-panel/50">
          <p className="text-matrix-green/20 text-[10px] font-mono text-center tracking-widest uppercase">
            HackQuest v2.4.1 — Uso exclusivo de agentes autorizados — Todas las actividades son monitorizadas
          </p>
        </footer>
      </div>
    </div>
  );
}
