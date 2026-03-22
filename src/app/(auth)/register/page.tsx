"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import MatrixRain from "@/components/effects/MatrixRain";
import GlitchText from "@/components/effects/GlitchText";
import Button from "@/components/ui/Button";

export default function RegisterPage() {
  const [agentName, setAgentName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recruitCode, setRecruitCode] = useState("");
  const [acceptedProtocol, setAcceptedProtocol] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!agentName || agentName.length < 3) {
      newErrors.agentName = "El usuario debe tener al menos 3 caracteres.";
    } else if (!/^[a-zA-Z0-9_\-]+$/.test(agentName)) {
      newErrors.agentName = "Solo letras, números, _ y - (es el usuario de login).";
    }

    if (displayName && displayName.length > 32) {
      newErrors.displayName = "El nombre visible no puede superar 32 caracteres.";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email inválido.";
    }

    if (!password || password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres.";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (!acceptedProtocol) {
      newErrors.protocol = "Debes aceptar el protocolo de conducta.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setTerminalOutput(["Iniciando registro de nuevo agente..."]);

    await new Promise((r) => setTimeout(r, 500));
    setTerminalOutput((p) => [...p, `Nombre de agente: ${agentName}`]);
    await new Promise((r) => setTimeout(r, 400));
    setTerminalOutput((p) => [...p, "Verificando disponibilidad..."]);
    await new Promise((r) => setTimeout(r, 500));
    setTerminalOutput((p) => [...p, "Generando credenciales de acceso..."]);
    await new Promise((r) => setTimeout(r, 400));
    setTerminalOutput((p) => [...p, "Asignando rango inicial: SCRIPT_KIDDIE"]);
    await new Promise((r) => setTimeout(r, 400));
    setTerminalOutput((p) => [...p, "Inicializando perfil de agente..."]);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: agentName,
          displayName: displayName || undefined,
          email,
          password,
          recruitCode: recruitCode || undefined,
        }),
      });

      if (res.ok) {
        setTerminalOutput((p) => [
          ...p,
          "Registro completado exitosamente.",
          "Agente #" + Math.floor(Math.random() * 90000 + 10000) + " registrado.",
          "Redirigiendo al sistema...",
        ]);
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        const data = await res.json().catch(() => ({ error: "Error en el registro." }));
        const msg = data.error ?? data.message ?? "Registro fallido.";
        setTerminalOutput((p) => [...p, `ERROR: ${msg}`]);
        setErrors({ general: msg });
      }
    } catch {
      setTerminalOutput((p) => [
        ...p,
        "ERROR: No se pudo conectar con el servidor de reclutamiento.",
      ]);
      setErrors({ general: "No se pudo conectar con el servidor." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-military-dark flex items-center justify-center overflow-hidden scanline py-8">
      {/* Background */}
      <div className="fixed inset-0 z-0 opacity-20" aria-hidden="true">
        <MatrixRain speed={70} density={0.98} opacity={0.8} className="w-full h-full" />
      </div>
      <div
        className="fixed inset-0 z-10 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 20%, rgba(10,14,10,0.9) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-20 w-full max-w-lg px-4">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/"
            className="text-matrix-green/40 hover:text-matrix-green text-xs font-mono uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <span>[&lt;]</span>
            <span>Volver al inicio</span>
          </Link>
        </div>

        <div
          className="panel-classified overflow-hidden"
          style={{
            boxShadow: "0 0 40px rgba(0,255,65,0.1), 0 20px 60px rgba(0,0,0,0.7)",
          }}
        >
          {/* Classification header */}
          <div className="px-6 py-3 border-b border-military-border bg-military-accent/40">
            <p className="text-center text-xs font-mono tracking-[0.4em] text-neon-amber uppercase">
              // REGISTRO DE AGENTE — OPERACION RECLUTAMIENTO //
            </p>
          </div>

          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="font-mono font-bold text-2xl mb-2">
                <GlitchText
                  text="REGISTRO DE AGENTE"
                  className="text-matrix-green glow-text"
                />
              </h1>
              <p className="text-matrix-green/40 text-xs font-mono tracking-widest uppercase">
                Completa el formulario para unirte a la red
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Login username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="agentName"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Usuario de Login
                </label>
                <input
                  id="agentName"
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="ghost_operator"
                  autoComplete="username"
                  className="input-hack w-full"
                  disabled={isLoading}
                />
                <p className="text-matrix-green/25 text-[10px] font-mono">
                  Solo letras, números, _ y - · Se usa para iniciar sesión
                </p>
                {errors.agentName && (
                  <p className="text-neon-red text-xs font-mono">[!] {errors.agentName}</p>
                )}
              </div>

              {/* Display name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="displayName"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Nombre Visible{" "}
                  <span className="text-matrix-green/30">(opcional)</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="★ Tu nombre con símbolos, emojis..."
                  autoComplete="off"
                  className="input-hack w-full"
                  disabled={isLoading}
                />
                <p className="text-matrix-green/25 text-[10px] font-mono">
                  Acepta cualquier carácter Unicode · Se muestra en el perfil y rankings
                </p>
                {errors.displayName && (
                  <p className="text-neon-red text-xs font-mono">[!] {errors.displayName}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Email Operativo
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@hackquest.io"
                  autoComplete="email"
                  className="input-hack w-full"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-neon-red text-xs font-mono">[!] {errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 caracteres"
                  autoComplete="new-password"
                  className="input-hack w-full"
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-neon-red text-xs font-mono">[!] {errors.password}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  autoComplete="new-password"
                  className="input-hack w-full"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-neon-red text-xs font-mono">
                    [!] {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Recruit code */}
              <div className="space-y-1.5">
                <label
                  htmlFor="recruitCode"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Codigo de Reclutamiento{" "}
                  <span className="text-matrix-green/30">(opcional)</span>
                </label>
                <input
                  id="recruitCode"
                  type="text"
                  value={recruitCode}
                  onChange={(e) => setRecruitCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX"
                  autoComplete="off"
                  className="input-hack w-full"
                  disabled={isLoading}
                />
                <p className="text-matrix-green/25 text-[10px] font-mono">
                  Para acceso beta. Solicita tu codigo al equipo de reclutamiento.
                </p>
              </div>

              {/* Protocol checkbox */}
              <div className="space-y-1.5">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={acceptedProtocol}
                      onChange={(e) => setAcceptedProtocol(e.target.checked)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <div
                      className={`w-4 h-4 border font-mono text-[10px] flex items-center justify-center transition-all ${
                        acceptedProtocol
                          ? "border-matrix-green bg-matrix-green/20 text-matrix-green"
                          : "border-military-border text-transparent"
                      }`}
                      style={
                        acceptedProtocol
                          ? { boxShadow: "0 0 6px rgba(0,255,65,0.4)" }
                          : {}
                      }
                    >
                      {acceptedProtocol ? "X" : ""}
                    </div>
                  </div>
                  <span className="text-xs font-mono text-matrix-green/60 group-hover:text-matrix-green/80 transition-colors leading-relaxed">
                    Acepto el{" "}
                    <Link
                      href="#"
                      className="text-matrix-green underline underline-offset-2 hover:glow-text"
                    >
                      protocolo de conducta
                    </Link>{" "}
                    y confirmo que realizaré actividades de hacking exclusivamente en
                    entornos autorizados dentro de la plataforma.
                  </span>
                </label>
                {errors.protocol && (
                  <p className="text-neon-red text-xs font-mono">[!] {errors.protocol}</p>
                )}
              </div>

              {errors.general && (
                <div className="flex items-start gap-2 px-3 py-2 border border-neon-red/40 bg-neon-red/5 rounded-sm">
                  <span className="text-neon-red text-xs font-bold shrink-0">[!]</span>
                  <p className="text-neon-red/80 text-xs font-mono">{errors.general}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full mt-2"
                disabled={isLoading || success}
              >
                {isLoading
                  ? "PROCESANDO..."
                  : success
                  ? "REGISTRO COMPLETADO"
                  : "[REGISTRARSE]"}
              </Button>
            </form>

            {/* Terminal output */}
            {terminalOutput.length > 0 && (
              <div className="mt-5 p-4 bg-military-dark/80 border border-military-border rounded-sm font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                {terminalOutput.map((line, i) => (
                  <p
                    key={i}
                    className={`terminal-line ${
                      line.includes("ERROR")
                        ? "text-neon-red"
                        : line.includes("completado") || line.includes("exitosamente")
                        ? "text-matrix-green glow-text"
                        : "text-matrix-green/60"
                    }`}
                  >
                    {"> "}{line}
                  </p>
                ))}
              </div>
            )}

            {/* Footer links */}
            <div className="mt-6 pt-5 border-t border-military-border/50 text-center">
              <p className="text-matrix-green/40 text-xs font-mono">
                Ya tienes cuenta?{" "}
                <Link
                  href="/login"
                  className="text-matrix-green/80 hover:text-matrix-green underline underline-offset-2 transition-colors"
                >
                  Iniciar sesion
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-matrix-green/20 text-[10px] font-mono tracking-widest">
          HACKQUEST AGENT RECRUITMENT SYSTEM — CLEARANCE LEVEL: PUBLIC
        </p>
      </div>
    </div>
  );
}
