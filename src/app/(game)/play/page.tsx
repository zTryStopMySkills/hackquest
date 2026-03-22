'use client';

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import Link from "next/link";
import { DAILY_BONUS } from "@/lib/constants";

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
    id: "duel",
    icon: "[⚔]",
    title: "DUELO 1v1",
    subtitle: "Hacker vs Hacker. Objetivos asimétricos.",
    desc: "Tú y tu oponente atacáis objetivos distintos al mismo tiempo. Sabotea el progreso enemigo con NOISE, HONEYPOT e IDS_ALERT. El primero en capturar la flag gana.",
    href: "/duel",
    color: "#B347EA",
    glow: "rgba(179,71,234,0.3)",
    border: "#B347EA",
    badge: "NEW",
    badgeColor: "#B347EA",
    players: "1v1",
    avgTime: "~20 min",
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
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    fetch('/api/game/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); });
    fetch('/api/game/activity').then(r => r.ok ? r.json() : null).then(d => { if (d) setRecentActivity(d.activity ?? []); });
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) setDailyBonusClaimed(d.user.dailyBonusClaimed ?? null);
    });
    // Show onboarding only on first visit
    if (typeof window !== 'undefined' && !localStorage.getItem('hq_onboarded')) {
      setShowOnboarding(true);
    }
  }, []);

  const dismissOnboarding = () => {
    localStorage.setItem('hq_onboarded', '1');
    setShowOnboarding(false);
  };

  const dailyBonusAvailable = (() => {
    if (!dailyBonusClaimed) return true;
    const lastClaimed = new Date(dailyBonusClaimed);
    return lastClaimed.toDateString() !== new Date().toDateString();
  })();

  const QUICK_STATS = [
    { label: "Partidas Jugadas", value: String(stats.totalMatches), icon: "[=]" },
    { label: "Tasa de Victoria", value: stats.totalMatches ? `${Math.round(stats.winRate * 100)}%` : "—", icon: "[^]" },
    { label: "Resueltos Perfecto", value: String(stats.perfectSolves), icon: "[!]" },
    { label: "Victorias", value: String(stats.wins), icon: "[*]" },
  ];

  const ONBOARDING_STEPS = [
    {
      icon: '[◈]',
      title: 'Elige una rama',
      desc: 'Ve a tu perfil y selecciona una rama de habilidades: Web Hacking, Redes, Criptografía, Forense o Sistemas.',
    },
    {
      icon: '[>>]',
      title: 'Completa retos',
      desc: 'Cada reto que resuelvas te da puntos ELO y puntos de temporada. Los solves perfectos (sin pistas) multiplican la recompensa.',
    },
    {
      icon: '[⚔]',
      title: 'Compite contra otros',
      desc: 'Úsate el modo Carrera o Duelo 1v1 para enfrentarte a otros agentes en tiempo real y subir en el ranking global.',
    },
  ];

  return (
      <div className="p-6 space-y-8">
        {/* Onboarding modal */}
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div
              className="w-full max-w-md mx-4 border border-neon-amber/50 bg-military-panel p-6 font-mono"
              style={{ boxShadow: '0 0 40px rgba(255,184,0,0.2)' }}
            >
              <div className="text-center mb-1">
                <p className="text-neon-amber/60 text-[9px] tracking-[0.4em] uppercase mb-3">
                  // BRIEFING INICIAL //
                </p>
                <p className="text-matrix-green text-lg font-bold" style={{ textShadow: '0 0 6px rgba(0,255,65,0.5)' }}>
                  BIENVENIDO, AGENTE
                </p>
                <p className="text-matrix-green/40 text-xs mt-1">Paso {onboardingStep + 1} de {ONBOARDING_STEPS.length}</p>
              </div>
              <div className="my-6 border border-military-border p-4 text-center min-h-[120px] flex flex-col items-center justify-center">
                <span className="text-3xl text-matrix-green mb-3">{ONBOARDING_STEPS[onboardingStep].icon}</span>
                <p className="text-matrix-green font-bold text-sm mb-2">{ONBOARDING_STEPS[onboardingStep].title}</p>
                <p className="text-matrix-green/60 text-xs leading-relaxed">{ONBOARDING_STEPS[onboardingStep].desc}</p>
              </div>
              <div className="flex items-center gap-2 mb-4">
                {ONBOARDING_STEPS.map((_, i) => (
                  <div key={i} className={`flex-1 h-0.5 transition-colors ${i <= onboardingStep ? 'bg-matrix-green' : 'bg-military-border'}`} />
                ))}
              </div>
              <div className="flex gap-3">
                {onboardingStep < ONBOARDING_STEPS.length - 1 ? (
                  <button
                    onClick={() => setOnboardingStep(s => s + 1)}
                    className="flex-1 py-2.5 border border-matrix-green text-matrix-green text-xs font-bold tracking-widest uppercase hover:bg-matrix-green hover:text-military-dark transition-all"
                  >
                    SIGUIENTE &gt;
                  </button>
                ) : (
                  <button
                    onClick={dismissOnboarding}
                    className="flex-1 py-2.5 border border-matrix-green bg-matrix-green text-military-dark text-xs font-bold tracking-widest uppercase"
                    style={{ boxShadow: '0 0 10px rgba(0,255,65,0.4)' }}
                  >
                    [&gt;] COMENZAR MISIÓN
                  </button>
                )}
                <button
                  onClick={dismissOnboarding}
                  className="px-4 py-2.5 border border-military-border text-matrix-green/30 text-xs font-mono hover:text-matrix-green/60 transition-colors"
                >
                  Saltar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Daily bonus banner */}
        {dailyBonusClaimed !== undefined && (
          <div
            className={`flex items-center justify-between px-4 py-2.5 border text-xs font-mono ${
              dailyBonusAvailable
                ? 'border-neon-amber/40 bg-neon-amber/5 text-neon-amber'
                : 'border-military-border bg-military-accent/30 text-matrix-green/40'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>{dailyBonusAvailable ? '[★]' : '[✓]'}</span>
              <span>
                {dailyBonusAvailable
                  ? `Bonus diario disponible — +${DAILY_BONUS} pts en tu próximo solve`
                  : 'Bonus diario reclamado — vuelve mañana'}
              </span>
            </span>
            {dailyBonusAvailable && (
              <span className="text-neon-amber/60 animate-pulse">DISPONIBLE</span>
            )}
          </div>
        )}

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
