"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import MatrixRain from "@/components/effects/MatrixRain";
import GlitchText from "@/components/effects/GlitchText";
import Button from "@/components/ui/Button";

const TERMINAL_MESSAGES = [
  "Iniciando protocolo de autenticación...",
  "Verificando credenciales...",
  "Comprobando firma digital...",
  "Estableciendo canal seguro TLS 1.3...",
  "Acceso concedido. Bienvenido, Agente.",
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function simulateTerminalOutput(messages: string[]) {
    for (const msg of messages) {
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      setTerminalOutput((prev) => [...prev, msg]);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username || !password) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    setError("");
    setIsLoading(true);
    setPhase("loading");
    setTerminalOutput(["Estableciendo conexión cifrada..."]);

    try {
      await simulateTerminalOutput(TERMINAL_MESSAGES);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setPhase("success");
        setTerminalOutput((prev) => [
          ...prev,
          "Acceso concedido.",
          "Redirigiendo al sistema...",
        ]);
        setTimeout(() => {
          window.location.href = "/play";
        }, 1200);
      } else {
        const data = await res.json().catch(() => ({ message: "Error de autenticación." }));
        setPhase("error");
        setTerminalOutput((prev) => [
          ...prev,
          `ERROR: ${data.message ?? "Credenciales inválidas."}`,
          "Acceso denegado.",
        ]);
        setError(data.message ?? "Credenciales inválidas.");
      }
    } catch {
      setPhase("error");
      setTerminalOutput((prev) => [
        ...prev,
        "ERROR: No se pudo conectar con el servidor.",
      ]);
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-military-dark flex items-center justify-center overflow-hidden scanline">
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

      {/* Form container */}
      <div className="relative z-20 w-full max-w-md px-4">
        {/* Back to home */}
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
            boxShadow:
              "0 0 40px rgba(0,255,65,0.1), 0 20px 60px rgba(0,0,0,0.7)",
          }}
        >
          {/* Classification header */}
          <div className="px-6 py-3 border-b border-military-border bg-military-accent/40">
            <p className="text-center text-xs font-mono tracking-[0.4em] text-neon-amber uppercase">
              // ACCESO AL SISTEMA — CLASIFICADO //
            </p>
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-mono font-bold text-2xl mb-2">
                <GlitchText
                  text="ACCESO AL SISTEMA"
                  className="text-matrix-green glow-text"
                />
              </h1>
              <p className="text-matrix-green/40 text-xs font-mono tracking-widest uppercase">
                Autenticacion de agente requerida
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Identificador de Agente
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="agent_username"
                  autoComplete="username"
                  className="input-hack w-full"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-mono uppercase tracking-widest text-matrix-green/60"
                >
                  &gt; Contraseña de Acceso
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="input-hack w-full"
                  disabled={isLoading}
                  required
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2 border border-neon-red/40 bg-neon-red/5 rounded-sm">
                  <span className="text-neon-red text-xs font-bold shrink-0">[!]</span>
                  <p className="text-neon-red/80 text-xs font-mono">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full mt-2"
                disabled={isLoading}
              >
                {isLoading ? "VERIFICANDO..." : "[ACCEDER]"}
              </Button>
            </form>

            {/* Terminal output */}
            {terminalOutput.length > 0 && (
              <div className="mt-6 p-4 bg-military-dark/80 border border-military-border rounded-sm font-mono text-xs space-y-1">
                {terminalOutput.map((line, i) => (
                  <p
                    key={i}
                    className={`terminal-line ${
                      line.includes("ERROR") || line.includes("denegado")
                        ? "text-neon-red"
                        : line.includes("concedido") || line.includes("Bienvenido")
                        ? "text-matrix-green glow-text"
                        : "text-matrix-green/60"
                    }`}
                  >
                    {line.includes("ERROR") ? "" : "> "}{line}
                  </p>
                ))}
                {phase === "success" && (
                  <p className="text-matrix-green glow-text">&gt; Redirigiendo...</p>
                )}
              </div>
            )}

            {/* Footer links */}
            <div className="mt-6 pt-5 border-t border-military-border/50 text-center space-y-3">
              <p className="text-matrix-green/40 text-xs font-mono">
                Nuevo agente?{" "}
                <Link
                  href="/register"
                  className="text-matrix-green/80 hover:text-matrix-green underline underline-offset-2 transition-colors"
                >
                  Solicitar registro
                </Link>
              </p>
              <p className="text-matrix-green/20 text-[10px] font-mono tracking-wider">
                Todas las sesiones son auditadas y monitorizadas
              </p>
            </div>
          </div>
        </div>

        {/* Bottom decoration */}
        <p className="mt-4 text-center text-matrix-green/20 text-[10px] font-mono tracking-widest">
          HACKQUEST SECURE ACCESS GATEWAY v2.4 — AES-256-GCM
        </p>
      </div>
    </div>
  );
}
