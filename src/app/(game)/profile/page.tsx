'use client';

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import RankBadge from "@/components/ui/RankBadge";
import EloBadge from "@/components/ui/EloBadge";
import ProgressBar from "@/components/ui/ProgressBar";

// Data is now fetched from /api/auth/me + /api/game/stats

// SKILL_BRANCHES is computed from user.skillBranches in the component

const ACHIEVEMENTS_META = [
  { id: "FIRST_BLOOD",       icon: "[!]", name: "Primera Sangre",    desc: "Resolver tu primer reto",               color: "#00FF41" },
  { id: "WIN_STREAK",        icon: "[^]", name: "En Racha",           desc: "5 victorias consecutivas",             color: "#FFB800" },
  { id: "PERFECT_SOLVE",     icon: "[*]", name: "Perfección",         desc: "Resolver sin pistas ni errores",        color: "#00FFFF" },
  { id: "BRANCH_MASTERY",    icon: "[W]", name: "Maestría",           desc: "Dominar una rama de especialización",   color: "#00FF41" },
  { id: "LEGEND_RANK",       icon: "[L]", name: "Leyenda",            desc: "Alcanzar rango LEGEND",                 color: "#FFD700" },
  { id: "POKEDEX_COMPLETE",  icon: "[P]", name: "Coleccionista",      desc: "Completar el Pokédex de técnicas",      color: "#9C27B0" },
  { id: "RANK_UP",           icon: "[R]", name: "Ascenso",            desc: "Subir de rango",                        color: "#00FFFF" },
  { id: "SPEED_DEMON",       icon: "[S]", name: "Speed Demon",        desc: "Resolver un reto en tiempo relámpago",  color: "#FF5722" },
  { id: "NO_HINTS",          icon: "[N]", name: "Sin Ayudas",         desc: "Resolver 5 retos sin usar pistas",      color: "#FFB800" },
  { id: "DAILY_STREAK",      icon: "[D]", name: "Constante",          desc: "7 días seguidos de actividad",          color: "#2196F3" },
];

// PROFILE_TITLES computed dynamically inside component

const BRANCH_META: Record<string, { name: string; color: string; glow: string }> = {
  WEB_HACKING:  { name: "Web Hacking",  color: "#00FF41", glow: "rgba(0,255,65,0.5)" },
  NETWORKS:     { name: "Redes",        color: "#00FFFF", glow: "rgba(0,255,255,0.5)" },
  CRYPTOGRAPHY: { name: "Criptografía", color: "#FFB800", glow: "rgba(255,184,0,0.5)" },
  FORENSICS:    { name: "Forense",      color: "#9C27B0", glow: "rgba(156,39,176,0.5)" },
  SYSTEMS:      { name: "Sistemas",     color: "#FF5722", glow: "rgba(255,87,34,0.5)" },
};

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ totalMatches: 0, wins: 0, losses: 0, perfectSolves: 0, winRate: 0 });
  const [savingTitle, setSavingTitle] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d) setUser(d); });
    fetch('/api/game/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); });
  }, []);

  async function handleTitleSelect(titleId: string, unlocked: boolean) {
    if (!unlocked || savingTitle) return;
    setSavingTitle(true);
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileTitle: titleId }),
    });
    if (res.ok) setUser((prev: any) => ({ ...prev, profileTitle: titleId }));
    setSavingTitle(false);
  }

  if (!user) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-matrix-green/40 text-xs font-mono animate-pulse">
          &gt; CARGANDO DOSSIER...
        </p>
      </div>
    );
  }

  const winRate = stats.totalMatches ? Math.round(stats.winRate * 100) : 0;
  const skillBranches = (user.skillBranches ?? [])
    .filter((b: any) => b.branch !== 'CAMPAIGN')
    .map((b: any) => {
      const meta = BRANCH_META[b.branch] ?? { name: b.branch, color: "#00FF41", glow: "rgba(0,255,65,0.5)" };
      const xpMax = (b.level + 1) * 500;
      return { key: b.branch, name: meta.name, level: b.level, maxLevel: 99, xp: b.xp, xpMax, color: meta.color, glow: meta.glow, techniques: b.unlockedChallenges?.length ?? 0 };
    });

  const SKILL_BRANCHES = skillBranches;
  const unlockedAchievementTypes = new Set((user.achievements ?? []).map((a: any) => a.type));
  const ACHIEVEMENTS = ACHIEVEMENTS_META.map(a => ({ ...a, unlocked: unlockedAchievementTypes.has(a.id) }));

  const PROFILE_TITLES = [
    { id: "SECURITY",     label: "SECURITY",       unlocked: user.rank !== 'SCRIPT_KIDDIE', color: "#00FF41", active: user.profileTitle === 'SECURITY' },
    { id: "HACKER",       label: "HACKER",          unlocked: ['RED_TEAM','ELITE_HACKER','LEGEND'].includes(user.rank), color: "#00FFFF", active: user.profileTitle === 'HACKER' },
    { id: "THE_ONE",      label: "THE ONE",          unlocked: user.rank === 'LEGEND', color: "#FFD700", active: user.profileTitle === 'THE_ONE' },
    { id: "NONE",         label: "SIN TÍTULO",       unlocked: true, color: "#888", active: user.profileTitle === 'NONE' },
  ];

  return (
      <div className="p-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-matrix-green/40 text-xs font-mono tracking-widest">
            &gt; DOSSIER DE AGENTE — CLASIFICADO
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Identity + stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Identity card */}
            <Panel classification="CLASSIFIED" noPadding>
              {/* Banner area */}
              <div
                className="h-24 w-full relative overflow-hidden"
                style={{
                  background:
                    "repeating-linear-gradient(-45deg, #0a0e0a 0, #0a0e0a 2px, #0d1117 2px, #0d1117 10px)",
                  borderBottom: "1px solid #1a2a1a",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0,255,65,0.05) 0%, rgba(33,150,243,0.05) 100%)",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-matrix-green/10 text-xs font-mono tracking-[0.5em] uppercase">
                    CLASSIFIED DOSSIER
                  </p>
                </div>
              </div>

              {/* Avatar + info */}
              <div className="px-5 pb-5">
                <div className="flex items-end gap-4 -mt-8 mb-4">
                  <div
                    className="w-16 h-16 rounded-sm border-2 border-rank-pentester bg-military-dark flex items-center justify-center text-2xl font-bold font-mono text-rank-pentester shrink-0"
                    style={{
                      boxShadow: "0 0 12px rgba(33,150,243,0.4)",
                      background: "rgba(33,150,243,0.05)",
                    }}
                  >
                    {[...(user.displayName ?? user.username)].slice(0, 2).join("").toUpperCase()}
                  </div>
                  <div className="pb-1">
                    <RankBadge rank={user.rank} size="sm" />
                  </div>
                </div>

                <h2
                  className="font-mono font-bold text-xl text-matrix-green mb-0.5"
                  style={{ textShadow: "0 0 6px rgba(0,255,65,0.5)" }}
                >
                  {user.displayName ?? user.username}
                </h2>

                {/* Active title */}
                {user.profileTitle && user.profileTitle !== 'NONE' && (
                  <p
                    className="font-mono font-bold text-sm tracking-widest uppercase mb-3"
                    style={{
                      color: PROFILE_TITLES.find(t => t.id === user.profileTitle)?.color ?? '#2196F3',
                      textShadow: "0 0 8px rgba(33,150,243,0.6)",
                    }}
                  >
                    // {PROFILE_TITLES.find(t => t.id === user.profileTitle)?.label ?? user.profileTitle} //
                  </p>
                )}

                <EloBadge
                  elo={user.elo}
                  state={user.eloState}
                  showProgress
                />

                <div className="mt-4 pt-4 border-t border-military-border/50 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-matrix-green/40">Agente desde</span>
                    <span className="text-matrix-green/70">{new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-green/40">Puntos totales</span>
                    <span
                      className="text-neon-amber font-bold"
                      style={{ textShadow: "0 0 4px rgba(255,184,0,0.4)" }}
                    >
                      {user.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Combat stats */}
            <Panel title="ESTADISTICAS DE COMBATE" classification="SECRET">
              <div className="space-y-3 text-sm font-mono">
                {[
                  { label: "Partidas jugadas", value: stats.totalMatches, color: "#00FF41" },
                  { label: "Victorias", value: stats.wins, color: "#00FF41" },
                  { label: "Derrotas", value: stats.losses, color: "#FF0040" },
                  { label: "Soluciones perfectas", value: stats.perfectSolves, color: "#00FFFF" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-1 border-b border-military-border/30">
                    <span className="text-matrix-green/50">{stat.label}</span>
                    <span
                      className="font-bold"
                      style={{
                        color: stat.color,
                        textShadow: `0 0 4px ${stat.color}`,
                      }}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
                <div className="pt-2">
                  <ProgressBar
                    value={stats.wins}
                    max={stats.totalMatches}
                    label="Tasa de victoria"
                    showPercent
                    color="#00FF41"
                    height="md"
                  />
                </div>
              </div>
            </Panel>

            {/* Profile titles */}
            <Panel title="TITULOS DESBLOQUEADOS">
              <div className="space-y-1.5">
                {PROFILE_TITLES.map((title) => (
                  <button
                    key={title.id}
                    onClick={() => handleTitleSelect(title.id, title.unlocked)}
                    disabled={!title.unlocked || savingTitle}
                    className={`w-full flex items-center justify-between px-3 py-2 border rounded-sm text-xs font-mono transition-all ${
                      title.active
                        ? "border-rank-pentester bg-rank-pentester/10"
                        : title.unlocked
                        ? "border-military-border hover:border-matrix-green/30 cursor-pointer"
                        : "border-military-border/30 opacity-40 cursor-not-allowed"
                    }`}
                    style={
                      title.active
                        ? { boxShadow: "0 0 8px rgba(33,150,243,0.2)" }
                        : {}
                    }
                  >
                    <span style={{ color: title.unlocked ? title.color : "#444" }}>
                      {title.label}
                    </span>
                    {title.active && (
                      <span className="text-[10px] text-rank-pentester border border-rank-pentester/40 px-1.5 py-0.5">
                        ACTIVO
                      </span>
                    )}
                    {!title.active && title.unlocked && (
                      <span className="text-[10px] text-matrix-green/30">[EQUIPAR]</span>
                    )}
                    {!title.unlocked && (
                      <span className="text-[10px] text-[#444]">[L]</span>
                    )}
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          {/* RIGHT COLUMN: Skills + progress + achievements */}
          <div className="lg:col-span-2 space-y-4">
            {/* Skill branches */}
            <Panel title="RAMAS DE ESPECIALIZACION" classification="SECRET">
              <div className="space-y-5">
                {SKILL_BRANCHES.map((branch) => (
                  <div key={branch.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <span
                          className="font-bold text-sm"
                          style={{
                            color: branch.color,
                            textShadow: `0 0 6px ${branch.glow}`,
                          }}
                        >
                          {branch.name}
                        </span>
                        <span
                          className="px-1.5 py-0.5 border text-[10px] rounded-sm"
                          style={{
                            color: branch.color,
                            borderColor: branch.color,
                            backgroundColor: `${branch.color}10`,
                          }}
                        >
                          Nv.{branch.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span className="text-matrix-green/40">
                          {branch.techniques} técnicas
                        </span>
                        <span style={{ color: `${branch.color}80` }}>
                          {branch.xp}/{branch.xpMax} XP
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={branch.xp}
                      max={branch.xpMax}
                      color={branch.color}
                      glowColor={branch.glow}
                      height="sm"
                    />
                  </div>
                ))}
              </div>
            </Panel>

            {/* Campaign progress */}
            <Panel title="PROGRESO DE CAMPANA" classification="CLASSIFIED">
              <div className="flex items-center gap-6">
                <div
                  className="w-16 h-16 rounded-sm border border-neon-amber/40 bg-neon-amber/5 flex flex-col items-center justify-center shrink-0"
                  style={{ boxShadow: "0 0 12px rgba(255,184,0,0.1)" }}
                >
                  <span
                    className="text-2xl font-bold font-mono text-neon-amber"
                    style={{ textShadow: "0 0 8px rgba(255,184,0,0.6)" }}
                  >
                    {user.campaignChapter}
                  </span>
                  <span className="text-neon-amber/50 text-[9px] font-mono uppercase">
                    cap
                  </span>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p
                      className="font-mono font-bold text-neon-amber"
                      style={{ textShadow: "0 0 6px rgba(255,184,0,0.4)" }}
                    >
                      Capitulo {user.campaignChapter}: La Infiltración
                    </p>
                    <p className="text-matrix-green/40 text-xs font-mono">
                      Modo: {user.campaignDifficulty ?? '—'} — En progreso
                    </p>
                  </div>
                  <ProgressBar
                    value={3}
                    max={7}
                    label="Misiones completadas"
                    showPercent
                    color="#FFB800"
                    height="sm"
                  />
                </div>
              </div>
            </Panel>

            {/* Pokédex count */}
            <Panel title="POKÉDEX DE TECNICAS" classification="CLASSIFIED">
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-matrix-green/80 text-sm">
                      Técnicas descubiertas
                    </p>
                    <p
                      className="font-mono font-bold text-xl text-matrix-green"
                      style={{ textShadow: "0 0 8px rgba(0,255,65,0.6)" }}
                    >
                      {user.pokedexCount}
                      <span className="text-matrix-green/40 text-sm">/{120}</span>
                    </p>
                  </div>
                  <ProgressBar
                    value={user.pokedexCount}
                    max={120}
                    showPercent
                    color="#00FF41"
                    height="md"
                  />
                  <p className="text-matrix-green/30 text-xs font-mono">
                    {120 - user.pokedexCount} técnicas aun por descubrir. Sigue jugando para completar tu arsenal.
                  </p>
                </div>
              </div>
            </Panel>

            {/* Achievements */}
            <Panel title="LOGROS" classification="UNCLASSIFIED">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ACHIEVEMENTS.map((ach) => (
                  <div
                    key={ach.id}
                    className={`flex flex-col items-center gap-2 p-3 border rounded-sm text-center transition-all ${
                      ach.unlocked
                        ? "border-military-border hover:border-matrix-green/30"
                        : "border-military-border/30 opacity-35"
                    }`}
                    style={
                      ach.unlocked
                        ? { backgroundColor: `${ach.color}08` }
                        : {}
                    }
                  >
                    <span
                      className="text-xl font-mono font-bold"
                      style={{
                        color: ach.unlocked ? ach.color : "#333",
                        textShadow: ach.unlocked
                          ? `0 0 8px ${ach.color}`
                          : "none",
                      }}
                    >
                      {ach.icon}
                    </span>
                    <div>
                      <p
                        className="text-xs font-mono font-bold"
                        style={{ color: ach.unlocked ? ach.color : "#444" }}
                      >
                        {ach.name}
                      </p>
                      <p className="text-[10px] font-mono text-matrix-green/30 mt-0.5">
                        {ach.desc}
                      </p>
                    </div>
                    {!ach.unlocked && (
                      <span className="text-[10px] font-mono text-[#333]">[BLOQUEADO]</span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
  );
}
