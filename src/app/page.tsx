import Link from "next/link";
import MatrixRain from "@/components/effects/MatrixRain";
import GlitchText from "@/components/effects/GlitchText";
import TypingEffect from "@/components/effects/TypingEffect";

const ASCII_LOGO = [
  " ██╗  ██╗ █████╗  ██████╗██╗  ██╗",
  " ██║  ██║██╔══██╗██╔════╝██║ ██╔╝",
  " ███████║███████║██║     █████╔╝ ",
  " ██╔══██║██╔══██║██║     ██╔═██╗ ",
  " ██║  ██║██║  ██║╚██████╗██║  ██╗",
  " ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝",
  "",
  " ██████╗ ██╗   ██╗███████╗███████╗████████╗",
  " ██╔═══██╗██║   ██║██╔════╝██╔════╝╚══██╔══╝",
  " ██║   ██║██║   ██║█████╗  ███████╗   ██║   ",
  " ██║▄▄ ██║██║   ██║██╔══╝  ╚════██║   ██║   ",
  " ╚██████╔╝╚██████╔╝███████╗███████║   ██║   ",
  "  ╚══▀▀═╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ",
];

const TERMINAL_COMMANDS = [
  "nmap -sV -p 1-65535 target.hackquest.io",
  "Iniciando escaneo de puertos...",
  "[OPEN] 22/tcp   ssh    OpenSSH 8.4",
  "[OPEN] 80/tcp   http   nginx 1.20.1",
  "[OPEN] 443/tcp  https  nginx 1.20.1",
  "Analizando vulnerabilidades conocidas...",
  "CVE-2021-44228 detectado en servidor de logs",
  "sqlmap -u 'http://target/login' --dbs",
  "Database found: [users, sessions, flags]",
  "Extrayendo tablas... FLAG{aprendizaje_real}",
  "Misión completada. +450 puntos obtenidos.",
  "Rango subido: JUNIOR > PENTESTER",
];

const STATS = [
  { value: "120", label: "técnicas", sub: "en el Pokédex" },
  { value: "5", label: "ramas", sub: "de especialización" },
  { value: "6", label: "rangos", sub: "de progresión" },
  { value: "∞", label: "conocimiento", sub: "sin límites" },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-military-dark overflow-hidden scanline">
      {/* Matrix rain background */}
      <div className="fixed inset-0 z-0 opacity-30" aria-hidden="true">
        <MatrixRain speed={60} density={0.978} opacity={0.9} className="w-full h-full" />
      </div>

      {/* Vignette overlay */}
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(10,14,10,0.85) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Header nav */}
        <header className="flex items-center justify-between px-8 py-5 border-b border-military-border/50">
          <div className="flex items-center gap-2">
            <span
              className="font-bold font-mono text-lg text-matrix-green"
              style={{ textShadow: "0 0 10px rgba(0,255,65,0.8)" }}
            >
              HACK
            </span>
            <span
              className="font-bold font-mono text-lg text-neon-amber"
              style={{ textShadow: "0 0 10px rgba(255,184,0,0.8)" }}
            >
              QUEST
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/play/leaderboard"
              className="text-matrix-green/60 hover:text-matrix-green text-xs font-mono uppercase tracking-widest transition-colors"
            >
              Rankings
            </Link>
            <Link
              href="/login"
              className="text-matrix-green/60 hover:text-matrix-green text-xs font-mono uppercase tracking-widest transition-colors"
            >
              Acceder
            </Link>
            <Link
              href="/register"
              className="btn-hack py-1.5 px-4 text-xs"
            >
              Registrarse
            </Link>
          </nav>
        </header>

        {/* Hero section */}
        <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          {/* Classification stamp */}
          <div className="mb-8 inline-flex items-center gap-3 px-4 py-1.5 border border-neon-amber/40 bg-neon-amber/5 rounded-sm">
            <span className="text-neon-amber text-xs font-mono tracking-[0.4em] uppercase">
              // PLATAFORMA CLASIFICADA //
            </span>
          </div>

          {/* ASCII Logo */}
          <div className="mb-6 overflow-hidden" aria-label="HackQuest Logo">
            <pre
              className="text-matrix-green text-xs sm:text-sm leading-tight font-mono select-none flicker"
              style={{
                textShadow:
                  "0 0 4px rgba(0,255,65,0.8), 0 0 10px rgba(0,255,65,0.4), 0 0 20px rgba(0,255,65,0.2)",
                fontSize: "clamp(5px, 1.2vw, 13px)",
              }}
            >
              {ASCII_LOGO.join("\n")}
            </pre>
          </div>

          {/* Tagline */}
          <h1 className="mb-3 font-mono font-bold text-2xl sm:text-3xl md:text-4xl tracking-wider">
            <GlitchText
              text="Aprende Ciberseguridad."
              className="text-matrix-green glow-text"
            />
          </h1>
          <h2
            className="mb-8 font-mono text-xl sm:text-2xl font-bold tracking-[0.15em]"
            style={{
              background: "linear-gradient(90deg, #00FF41, #00FFFF, #00FF41)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
            }}
          >
            Compite. Domina.
          </h2>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
            <Link href="/login" className="btn-hack py-3 px-8 text-base tracking-widest">
              [INICIAR SESION]
            </Link>
            <Link
              href="/register"
              className="px-8 py-3 border border-neon-amber text-neon-amber font-mono uppercase tracking-widest text-base transition-all duration-200 hover:bg-neon-amber hover:text-military-dark active:scale-95"
              style={{ boxShadow: "0 0 12px rgba(255,184,0,0.2)" }}
            >
              [CREAR CUENTA]
            </Link>
          </div>

          {/* Terminal demo */}
          <div className="w-full max-w-2xl mx-auto mb-16">
            <div
              className="rounded-sm border border-military-border overflow-hidden"
              style={{
                boxShadow:
                  "0 0 30px rgba(0,255,65,0.1), 0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Terminal title bar */}
              <div className="flex items-center justify-between px-4 py-2 bg-military-accent/60 border-b border-military-border">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-neon-red/60" />
                  <span className="w-3 h-3 rounded-full bg-neon-amber/60" />
                  <span className="w-3 h-3 rounded-full bg-matrix-green/60" />
                </div>
                <span className="text-matrix-green/40 text-xs font-mono">
                  hackquest@agent:~$
                </span>
                <span className="text-matrix-green/20 text-xs font-mono">
                  bash
                </span>
              </div>
              {/* Terminal body */}
              <div className="p-5 bg-military-panel/80 min-h-[200px]">
                <TypingEffect
                  lines={TERMINAL_COMMANDS}
                  speed={45}
                  loop={true}
                  pauseBetweenLines={600}
                />
              </div>
            </div>
          </div>

          {/* Stats section */}
          <div className="w-full max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {STATS.map((stat, i) => (
              <div
                key={i}
                className="panel-classified py-6 px-4 text-center"
                style={{
                  boxShadow: "0 0 15px rgba(0,255,65,0.05)",
                }}
              >
                <p
                  className="text-4xl font-bold font-mono text-matrix-green mb-1"
                  style={{
                    textShadow:
                      "0 0 8px rgba(0,255,65,0.8), 0 0 16px rgba(0,255,65,0.4)",
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-matrix-bright text-sm font-mono uppercase tracking-widest font-bold">
                  {stat.label}
                </p>
                <p className="text-matrix-green/40 text-xs font-mono mt-1">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Feature highlights */}
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "[◈]",
                title: "Campañas Narrativas",
                desc: "Misiones estilo novela de espías con lore profundo. Aprende hacking a través de historias inmersivas con contexto real.",
              },
              {
                icon: "[◎]",
                title: "Competición en Tiempo Real",
                desc: "Enfrenta a otros agentes en retos de hacking en vivo. Sistema ELO dinámico con rangos desde Script Kiddie hasta Legend.",
              },
              {
                icon: "[▤]",
                title: "Pokédex de Técnicas",
                desc: "120 técnicas documentadas con CVEs reales, vectores de ataque y contramedidas. Tu enciclopedia de ciberseguridad.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="panel-classified p-5 group hover:border-matrix-green/50 transition-all duration-200"
                style={{
                  boxShadow: "0 0 10px rgba(0,0,0,0.3)",
                }}
              >
                <p
                  className="text-2xl font-mono mb-3 text-matrix-green"
                  style={{ textShadow: "0 0 6px rgba(0,255,65,0.6)" }}
                >
                  {feature.icon}
                </p>
                <h3 className="text-matrix-green font-mono font-bold text-sm uppercase tracking-wider mb-2">
                  {feature.title}
                </h3>
                <p className="text-matrix-green/50 text-xs font-mono leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="px-8 py-5 border-t border-military-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-matrix-green/40 text-[10px] font-mono tracking-widest uppercase">
              HackQuest — Plataforma de formación en ciberseguridad — Uso educativo
            </p>
            <p
              className="text-matrix-green/30 text-[10px] font-mono tracking-widest"
              style={{ textShadow: "0 0 4px rgba(0,255,65,0.2)" }}
            >
              © 2025 ★ zTryStopMySkills ★ — Todos los derechos reservados
            </p>
          </div>
          <p className="text-matrix-green/20 text-[10px] font-mono">
            Todas las actividades de hacking se realizan en entornos controlados
          </p>
        </footer>
      </div>
    </div>
  );
}
