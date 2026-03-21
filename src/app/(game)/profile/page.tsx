import GameLayout from "@/components/layout/GameLayout";
import Panel from "@/components/ui/Panel";
import RankBadge from "@/components/ui/RankBadge";
import EloBadge from "@/components/ui/EloBadge";
import ProgressBar from "@/components/ui/ProgressBar";

const PROFILE_DATA = {
  username: "Agente_47",
  title: "THE PENTESTER",
  rank: "PENTESTER" as const,
  elo: 1547,
  eloState: "STABLE" as const,
  points: 12480,
  streak: 3,
  joinDate: "Enero 2025",
  totalMatches: 147,
  wins: 85,
  losses: 62,
  perfectSolves: 23,
  campaignChapter: 3,
  campaignMode: "NORMAL",
  pokedexCount: 47,
  pokedexTotal: 120,
};

const SKILL_BRANCHES = [
  {
    name: "Web Hacking",
    key: "web",
    level: 7,
    maxLevel: 10,
    xp: 2840,
    xpMax: 3500,
    color: "#00FF41",
    glow: "rgba(0,255,65,0.5)",
    techniques: 18,
  },
  {
    name: "Redes",
    key: "net",
    level: 5,
    maxLevel: 10,
    xp: 1200,
    xpMax: 2000,
    color: "#00FFFF",
    glow: "rgba(0,255,255,0.5)",
    techniques: 12,
  },
  {
    name: "Criptografía",
    key: "crypto",
    level: 4,
    maxLevel: 10,
    xp: 880,
    xpMax: 1500,
    color: "#FFB800",
    glow: "rgba(255,184,0,0.5)",
    techniques: 9,
  },
  {
    name: "Forense",
    key: "forensics",
    level: 3,
    maxLevel: 10,
    xp: 540,
    xpMax: 1200,
    color: "#9C27B0",
    glow: "rgba(156,39,176,0.5)",
    techniques: 5,
  },
  {
    name: "Sistemas",
    key: "systems",
    level: 6,
    maxLevel: 10,
    xp: 1680,
    xpMax: 2500,
    color: "#FF5722",
    glow: "rgba(255,87,34,0.5)",
    techniques: 13,
  },
];

const ACHIEVEMENTS = [
  {
    id: "first_blood",
    icon: "[!]",
    name: "Primera Sangre",
    desc: "Ganar la primera partida",
    unlocked: true,
    color: "#00FF41",
  },
  {
    id: "streak_5",
    icon: "[^]",
    name: "En Racha",
    desc: "5 victorias consecutivas",
    unlocked: true,
    color: "#FFB800",
  },
  {
    id: "perfect",
    icon: "[*]",
    name: "Perfección",
    desc: "Resolver sin pistas ni errores",
    unlocked: true,
    color: "#00FFFF",
  },
  {
    id: "web_master",
    icon: "[W]",
    name: "Web Master",
    desc: "Nivel 7 en Web Hacking",
    unlocked: true,
    color: "#00FF41",
  },
  {
    id: "legend",
    icon: "[L]",
    name: "Leyenda",
    desc: "Alcanzar rango LEGEND",
    unlocked: false,
    color: "#FFD700",
  },
  {
    id: "pokedex_half",
    icon: "[P]",
    name: "Coleccionista",
    desc: "Descubrir 60 técnicas",
    unlocked: false,
    color: "#9C27B0",
  },
];

const PROFILE_TITLES = [
  { id: "SECURITY", label: "SECURITY", unlocked: true, color: "#00FF41" },
  { id: "HACKER", label: "HACKER", unlocked: true, color: "#00FFFF" },
  { id: "THE_PENTESTER", label: "THE PENTESTER", unlocked: true, color: "#2196F3", active: true },
  { id: "GHOST", label: "GHOST", unlocked: false, color: "#888" },
  { id: "THE_ONE", label: "THE ONE", unlocked: false, color: "#FFD700" },
];

export default function ProfilePage() {
  const winRate = Math.round((PROFILE_DATA.wins / PROFILE_DATA.totalMatches) * 100);

  return (
    <GameLayout
      username={PROFILE_DATA.username}
      rank={PROFILE_DATA.rank}
      elo={PROFILE_DATA.elo}
      eloState={PROFILE_DATA.eloState}
      points={PROFILE_DATA.points}
      streak={PROFILE_DATA.streak}
    >
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
                    {PROFILE_DATA.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="pb-1">
                    <RankBadge rank={PROFILE_DATA.rank} size="sm" />
                  </div>
                </div>

                <h2
                  className="font-mono font-bold text-xl text-matrix-green mb-0.5"
                  style={{ textShadow: "0 0 6px rgba(0,255,65,0.5)" }}
                >
                  {PROFILE_DATA.username}
                </h2>

                {/* Active title */}
                <p
                  className="font-mono font-bold text-sm tracking-widest uppercase mb-3"
                  style={{
                    color: "#2196F3",
                    textShadow: "0 0 8px rgba(33,150,243,0.6)",
                  }}
                >
                  // {PROFILE_DATA.title} //
                </p>

                <EloBadge
                  elo={PROFILE_DATA.elo}
                  state={PROFILE_DATA.eloState}
                  showProgress
                />

                <div className="mt-4 pt-4 border-t border-military-border/50 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-matrix-green/40">Agente desde</span>
                    <span className="text-matrix-green/70">{PROFILE_DATA.joinDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-matrix-green/40">Puntos totales</span>
                    <span
                      className="text-neon-amber font-bold"
                      style={{ textShadow: "0 0 4px rgba(255,184,0,0.4)" }}
                    >
                      {PROFILE_DATA.points.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Combat stats */}
            <Panel title="ESTADISTICAS DE COMBATE" classification="SECRET">
              <div className="space-y-3 text-sm font-mono">
                {[
                  { label: "Partidas jugadas", value: PROFILE_DATA.totalMatches, color: "#00FF41" },
                  { label: "Victorias", value: PROFILE_DATA.wins, color: "#00FF41" },
                  { label: "Derrotas", value: PROFILE_DATA.losses, color: "#FF0040" },
                  { label: "Soluciones perfectas", value: PROFILE_DATA.perfectSolves, color: "#00FFFF" },
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
                    value={PROFILE_DATA.wins}
                    max={PROFILE_DATA.totalMatches}
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
                  <div
                    key={title.id}
                    className={`flex items-center justify-between px-3 py-2 border rounded-sm text-xs font-mono transition-all ${
                      title.active
                        ? "border-rank-pentester bg-rank-pentester/10"
                        : title.unlocked
                        ? "border-military-border hover:border-matrix-green/30"
                        : "border-military-border/30 opacity-40"
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
                    {!title.unlocked && (
                      <span className="text-[10px] text-[#444]">[L]</span>
                    )}
                  </div>
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
                    {PROFILE_DATA.campaignChapter}
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
                      Capitulo {PROFILE_DATA.campaignChapter}: La Infiltración
                    </p>
                    <p className="text-matrix-green/40 text-xs font-mono">
                      Modo: {PROFILE_DATA.campaignMode} — En progreso
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
                      {PROFILE_DATA.pokedexCount}
                      <span className="text-matrix-green/40 text-sm">/{PROFILE_DATA.pokedexTotal}</span>
                    </p>
                  </div>
                  <ProgressBar
                    value={PROFILE_DATA.pokedexCount}
                    max={PROFILE_DATA.pokedexTotal}
                    showPercent
                    color="#00FF41"
                    height="md"
                  />
                  <p className="text-matrix-green/30 text-xs font-mono">
                    {PROFILE_DATA.pokedexTotal - PROFILE_DATA.pokedexCount} técnicas aun por descubrir. Sigue jugando para completar tu arsenal.
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
    </GameLayout>
  );
}
