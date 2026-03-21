"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RankBadge from "@/components/ui/RankBadge";
import EloBadge from "@/components/ui/EloBadge";
import type { Rank, EloState } from "@/types/game";

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: "[>]", label: "Dashboard", href: "/play" },
  { icon: "[◎]", label: "Jugar", href: "/matchmaking" },
  { icon: "[◈]", label: "Campaña", href: "/campaign" },
  { icon: "[▤]", label: "Pokédex", href: "/pokedex" },
  { icon: "[↟]", label: "Rankings", href: "/leaderboard" },
  { icon: "[◉]", label: "Perfil", href: "/profile" },
  { icon: "[#]", label: "Comunidad", href: "/community", badge: "NUEVO" },
];

interface SidebarProps {
  username?: string;
  rank?: Rank;
  elo?: number;
  eloState?: EloState;
}

export default function Sidebar({
  username = "Agente_47",
  rank = "PENTESTER",
  elo = 1547,
  eloState = "STABLE",
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/play") return pathname === "/play";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className="flex flex-col w-64 min-h-screen bg-military-panel border-r border-military-border relative shrink-0"
      style={{
        boxShadow: "4px 0 20px rgba(0,0,0,0.5), inset -1px 0 0 rgba(0,255,65,0.05)",
      }}
    >
      {/* Top classification banner */}
      <div className="px-4 py-2 border-b border-military-border bg-military-dark/50">
        <p className="text-center text-[9px] font-mono tracking-[0.4em] text-neon-amber/70 uppercase">
          // ACCESO AUTORIZADO //
        </p>
      </div>

      {/* Logo */}
      <div className="px-4 py-5 border-b border-military-border">
        <div className="flex items-center gap-2">
          <span
            className="text-matrix-green font-bold font-mono text-xl leading-none"
            style={{ textShadow: "0 0 10px rgba(0,255,65,0.8), 0 0 20px rgba(0,255,65,0.4)" }}
          >
            HACK
          </span>
          <span
            className="text-neon-amber font-bold font-mono text-xl leading-none"
            style={{ textShadow: "0 0 10px rgba(255,184,0,0.8)" }}
          >
            QUEST
          </span>
        </div>
        <p className="text-matrix-green/40 text-[10px] font-mono mt-0.5 tracking-widest">
          SISTEMA v2.4.1 // ACTIVO
        </p>
      </div>

      {/* User identity block */}
      <div className="px-4 py-4 border-b border-military-border">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-sm bg-military-accent border border-matrix-green/30 flex items-center justify-center text-matrix-green font-bold font-mono text-sm shrink-0"
            style={{ boxShadow: "0 0 8px rgba(0,255,65,0.2)" }}
          >
            {username.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p
              className="text-matrix-green font-mono text-sm font-bold truncate"
              style={{ textShadow: "0 0 4px rgba(0,255,65,0.5)" }}
            >
              {username}
            </p>
            <p className="text-matrix-green/40 text-[10px] font-mono">ID-{Math.floor(Math.random() * 90000) + 10000}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <RankBadge rank={rank} size="sm" />
          <EloBadge elo={elo} state={eloState} compact />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        <p className="text-matrix-green/30 text-[9px] font-mono tracking-[0.3em] uppercase px-2 mb-3">
          Navegacion
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-mono transition-all duration-150 group relative",
                active
                  ? "text-military-dark bg-matrix-green"
                  : "text-matrix-green/70 hover:text-matrix-green hover:bg-military-accent/60",
              ].join(" ")}
              style={
                active
                  ? { boxShadow: "0 0 12px rgba(0,255,65,0.5)", textShadow: "none" }
                  : {}
              }
            >
              {active && (
                <span
                  className="absolute left-0 top-0 bottom-0 w-0.5 bg-matrix-bright rounded-full"
                  style={{ boxShadow: "0 0 6px rgba(0,255,65,0.8)" }}
                />
              )}
              <span
                className={`text-xs font-bold shrink-0 w-8 text-center transition-all ${
                  active ? "text-military-dark" : "text-matrix-green/50 group-hover:text-matrix-green"
                }`}
              >
                {item.icon}
              </span>
              <span className="tracking-wider uppercase text-xs font-bold">
                {item.label}
              </span>
              {item.badge && (
                <span className="ml-auto text-[10px] bg-neon-red/20 text-neon-red border border-neon-red/30 px-1.5 py-0.5 rounded-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 py-4 border-t border-military-border mt-auto">
        <div className="text-[10px] font-mono text-matrix-green/30 space-y-1">
          <div className="flex items-center justify-between">
            <span>ESTADO DEL SISTEMA</span>
            <span className="text-matrix-green flex items-center gap-1">
              <span
                className="inline-block w-1.5 h-1.5 bg-matrix-green rounded-full"
                style={{ boxShadow: "0 0 4px rgba(0,255,65,0.8)" }}
              />
              ONLINE
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>CONEXION</span>
            <span className="text-matrix-green/60">SEGURA</span>
          </div>
          <div className="flex items-center justify-between">
            <span>CIFRADO</span>
            <span className="text-matrix-green/60">AES-256</span>
          </div>
        </div>
        <p className="mt-3 text-[8px] font-mono text-matrix-green/15 text-center leading-relaxed">
          © 2025 ★ zTryStopMySkills ★<br />
          HackQuest — Todos los derechos reservados
        </p>

        <Link
          href="/api/auth/logout"
          className="mt-3 flex items-center gap-2 text-neon-red/60 hover:text-neon-red text-xs font-mono uppercase tracking-wider transition-colors duration-150"
        >
          <span>[X]</span>
          <span>Desconectar</span>
        </Link>
      </div>
    </aside>
  );
}
