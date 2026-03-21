"use client";

import { useState } from "react";
import GameLayout from "@/components/layout/GameLayout";
import Panel from "@/components/ui/Panel";
import type { Severity } from "@/types/game";

type Branch = "WEB_HACKING" | "REDES" | "CRIPTOGRAFIA" | "FORENSE" | "SISTEMAS";

interface TechniqueCard {
  id: number;
  name: string;
  branch: Branch;
  severity: Severity;
  cvss: number;
  unlocked: boolean;
  description: string;
}

const BRANCHES: { key: Branch; label: string; color: string; icon: string }[] = [
  { key: "WEB_HACKING", label: "Web Hacking", color: "#00FF41", icon: "[W]" },
  { key: "REDES", label: "Redes", color: "#00FFFF", icon: "[N]" },
  { key: "CRIPTOGRAFIA", label: "Criptografía", color: "#FFB800", icon: "[C]" },
  { key: "FORENSE", label: "Forense", color: "#9C27B0", icon: "[F]" },
  { key: "SISTEMAS", label: "Sistemas", color: "#FF5722", icon: "[S]" },
];

const SEVERITY_CONFIG: Record<Severity, { color: string; label: string }> = {
  LOW: { color: "#4CAF50", label: "BAJO" },
  MEDIUM: { color: "#FFB800", label: "MEDIO" },
  HIGH: { color: "#FF5722", label: "ALTO" },
  CRITICAL: { color: "#FF0040", label: "CRITICO" },
};

const TECHNIQUES: TechniqueCard[] = [
  // WEB HACKING
  { id: 1, name: "SQL Injection", branch: "WEB_HACKING", severity: "CRITICAL", cvss: 9.8, unlocked: true, description: "Inyección de código SQL para manipular bases de datos." },
  { id: 2, name: "XSS Reflected", branch: "WEB_HACKING", severity: "HIGH", cvss: 7.4, unlocked: true, description: "Cross-site scripting reflejado en parámetros de URL." },
  { id: 3, name: "XSS Stored", branch: "WEB_HACKING", severity: "HIGH", cvss: 8.1, unlocked: true, description: "XSS almacenado persistente en base de datos." },
  { id: 4, name: "CSRF", branch: "WEB_HACKING", severity: "MEDIUM", cvss: 6.5, unlocked: true, description: "Falsificación de solicitudes entre sitios." },
  { id: 5, name: "Path Traversal", branch: "WEB_HACKING", severity: "HIGH", cvss: 7.5, unlocked: true, description: "Acceso a archivos fuera del directorio raíz." },
  { id: 6, name: "SSRF", branch: "WEB_HACKING", severity: "HIGH", cvss: 8.6, unlocked: true, description: "Solicitudes del servidor hacia recursos internos." },
  { id: 7, name: "XXE Injection", branch: "WEB_HACKING", severity: "HIGH", cvss: 7.1, unlocked: false, description: "" },
  { id: 8, name: "IDOR", branch: "WEB_HACKING", severity: "MEDIUM", cvss: 6.5, unlocked: false, description: "" },
  { id: 9, name: "JWT Forgery", branch: "WEB_HACKING", severity: "CRITICAL", cvss: 9.1, unlocked: false, description: "" },
  { id: 10, name: "Template Injection", branch: "WEB_HACKING", severity: "CRITICAL", cvss: 9.3, unlocked: false, description: "" },
  { id: 11, name: "HTTP Request Smuggling", branch: "WEB_HACKING", severity: "HIGH", cvss: 7.4, unlocked: false, description: "" },
  { id: 12, name: "OAuth Bypass", branch: "WEB_HACKING", severity: "HIGH", cvss: 8.0, unlocked: false, description: "" },

  // REDES
  { id: 13, name: "ARP Spoofing", branch: "REDES", severity: "HIGH", cvss: 7.8, unlocked: true, description: "Envenenamiento de caché ARP para MITM." },
  { id: 14, name: "DNS Poisoning", branch: "REDES", severity: "HIGH", cvss: 7.5, unlocked: true, description: "Corrupción de caché DNS para redirección de tráfico." },
  { id: 15, name: "Port Scanning", branch: "REDES", severity: "LOW", cvss: 3.1, unlocked: true, description: "Enumeración de servicios activos en un host." },
  { id: 16, name: "MITM con SSL Strip", branch: "REDES", severity: "CRITICAL", cvss: 9.0, unlocked: false, description: "" },
  { id: 17, name: "SMB Relay", branch: "REDES", severity: "CRITICAL", cvss: 9.1, unlocked: false, description: "" },
  { id: 18, name: "Wifi Deauth", branch: "REDES", severity: "MEDIUM", cvss: 6.1, unlocked: false, description: "" },
  { id: 19, name: "BGP Hijacking", branch: "REDES", severity: "CRITICAL", cvss: 9.6, unlocked: false, description: "" },
  { id: 20, name: "VLAN Hopping", branch: "REDES", severity: "HIGH", cvss: 7.8, unlocked: false, description: "" },

  // CRIPTOGRAFIA
  { id: 21, name: "Padding Oracle", branch: "CRIPTOGRAFIA", severity: "HIGH", cvss: 7.5, unlocked: true, description: "Ataque a cifrados de bloque con padding predecible." },
  { id: 22, name: "Bit Flipping", branch: "CRIPTOGRAFIA", severity: "MEDIUM", cvss: 5.9, unlocked: true, description: "Modificación de bits en texto cifrado CTR/CBC." },
  { id: 23, name: "Hash Length Extension", branch: "CRIPTOGRAFIA", severity: "HIGH", cvss: 7.2, unlocked: false, description: "" },
  { id: 24, name: "RSA Low Exponent", branch: "CRIPTOGRAFIA", severity: "HIGH", cvss: 7.4, unlocked: false, description: "" },
  { id: 25, name: "Timing Attack", branch: "CRIPTOGRAFIA", severity: "MEDIUM", cvss: 5.3, unlocked: false, description: "" },
  { id: 26, name: "CBC IV Reuse", branch: "CRIPTOGRAFIA", severity: "HIGH", cvss: 7.7, unlocked: false, description: "" },

  // FORENSE
  { id: 27, name: "Steganografía LSB", branch: "FORENSE", severity: "LOW", cvss: 2.5, unlocked: true, description: "Datos ocultos en bits menos significativos de imágenes." },
  { id: 28, name: "Análisis de Memoria", branch: "FORENSE", severity: "HIGH", cvss: 7.0, unlocked: true, description: "Extracción de artefactos de volcados de RAM." },
  { id: 29, name: "Metadata EXIF", branch: "FORENSE", severity: "MEDIUM", cvss: 5.1, unlocked: false, description: "" },
  { id: 30, name: "Recuperación de Archivos", branch: "FORENSE", severity: "MEDIUM", cvss: 5.5, unlocked: false, description: "" },
  { id: 31, name: "Log Analysis", branch: "FORENSE", severity: "LOW", cvss: 3.2, unlocked: false, description: "" },

  // SISTEMAS
  { id: 32, name: "Buffer Overflow", branch: "SISTEMAS", severity: "CRITICAL", cvss: 9.8, unlocked: true, description: "Desbordamiento de buffer para tomar control del flujo." },
  { id: 33, name: "Format String", branch: "SISTEMAS", severity: "CRITICAL", cvss: 9.2, unlocked: true, description: "Explotación de strings de formato no controlados." },
  { id: 34, name: "ROP Chains", branch: "SISTEMAS", severity: "CRITICAL", cvss: 9.5, unlocked: true, description: "Return-oriented programming para bypass de NX/DEP." },
  { id: 35, name: "Privilege Escalation", branch: "SISTEMAS", severity: "HIGH", cvss: 8.8, unlocked: true, description: "Elevación de privilegios en sistemas Linux/Windows." },
  { id: 36, name: "Heap Overflow", branch: "SISTEMAS", severity: "CRITICAL", cvss: 9.1, unlocked: false, description: "" },
  { id: 37, name: "UAF (Use-After-Free)", branch: "SISTEMAS", severity: "CRITICAL", cvss: 9.3, unlocked: false, description: "" },
  { id: 38, name: "Kernel Exploits", branch: "SISTEMAS", severity: "CRITICAL", cvss: 9.9, unlocked: false, description: "" },
];

const TOTAL_TECHNIQUES = 120;
const UNLOCKED_COUNT = TECHNIQUES.filter((t) => t.unlocked).length;

export default function PokedexPage() {
  const [activeBranch, setActiveBranch] = useState<Branch>("WEB_HACKING");
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueCard | null>(null);

  const filtered = TECHNIQUES.filter((t) => t.branch === activeBranch);
  const activeBranchConfig = BRANCHES.find((b) => b.key === activeBranch)!;

  return (
    <GameLayout username="Agente_47" rank="PENTESTER" elo={1547} eloState="STABLE" points={12480} streak={3}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-matrix-green/40 text-xs font-mono tracking-widest">
              &gt; BASE DE DATOS DE TECNICAS — CLASIFICADO
            </span>
          </div>
          <div className="flex items-center justify-between">
            <h1
              className="text-2xl font-mono font-bold text-matrix-green"
              style={{ textShadow: "0 0 8px rgba(0,255,65,0.5)" }}
            >
              POKÉDEX DE TECNICAS
            </h1>
            <div className="text-right">
              <p
                className="text-2xl font-bold font-mono text-matrix-green"
                style={{ textShadow: "0 0 8px rgba(0,255,65,0.6)" }}
              >
                {UNLOCKED_COUNT}
                <span className="text-matrix-green/30 text-lg">/{TOTAL_TECHNIQUES}</span>
              </p>
              <p className="text-matrix-green/40 text-[10px] font-mono uppercase tracking-wider">
                técnicas descubiertas
              </p>
            </div>
          </div>
        </div>

        {/* Global progress */}
        <div className="panel-classified px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-matrix-green/60 uppercase tracking-wider">
              Progreso global del Pokédex
            </span>
            <span
              className="text-xs font-mono font-bold text-matrix-green"
              style={{ textShadow: "0 0 4px rgba(0,255,65,0.5)" }}
            >
              {Math.round((UNLOCKED_COUNT / TOTAL_TECHNIQUES) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-military-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(UNLOCKED_COUNT / TOTAL_TECHNIQUES) * 100}%`,
                background: "linear-gradient(90deg, #00FF41, #00FFFF)",
                boxShadow: "0 0 8px rgba(0,255,65,0.6)",
                transition: "width 1s ease",
              }}
            />
          </div>
        </div>

        {/* Branch tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {BRANCHES.map((branch) => {
            const branchTechs = TECHNIQUES.filter((t) => t.branch === branch.key);
            const branchUnlocked = branchTechs.filter((t) => t.unlocked).length;
            const isActive = activeBranch === branch.key;
            return (
              <button
                key={branch.key}
                onClick={() => setActiveBranch(branch.key)}
                className="flex items-center gap-2 px-4 py-2.5 border font-mono text-xs uppercase tracking-wider transition-all duration-200 whitespace-nowrap shrink-0"
                style={{
                  borderColor: isActive ? branch.color : "#1a2a1a",
                  color: isActive ? branch.color : "#00FF4155",
                  backgroundColor: isActive ? `${branch.color}12` : "transparent",
                  boxShadow: isActive ? `0 0 10px ${branch.color}40` : "none",
                  textShadow: isActive ? `0 0 6px ${branch.color}` : "none",
                }}
              >
                <span>{branch.icon}</span>
                <span>{branch.label}</span>
                <span
                  className="text-[10px] opacity-70"
                  style={{ color: isActive ? branch.color : "#555" }}
                >
                  {branchUnlocked}/{branchTechs.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Techniques grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((tech) => {
            const severityCfg = SEVERITY_CONFIG[tech.severity];
            return (
              <button
                key={tech.id}
                onClick={() => tech.unlocked && setSelectedTechnique(tech)}
                className={`relative group text-left border rounded-sm transition-all duration-200 overflow-hidden ${
                  tech.unlocked
                    ? "cursor-pointer hover:scale-105"
                    : "cursor-default opacity-50"
                }`}
                style={{
                  borderColor: tech.unlocked ? activeBranchConfig.color + "40" : "#1a2a1a",
                  backgroundColor: tech.unlocked
                    ? `${activeBranchConfig.color}06`
                    : "#0d111766",
                  boxShadow: tech.unlocked
                    ? `0 0 8px ${activeBranchConfig.color}10`
                    : "none",
                }}
              >
                <div className="p-3">
                  {/* Number */}
                  <p
                    className="text-[10px] font-mono mb-1.5"
                    style={{ color: tech.unlocked ? `${activeBranchConfig.color}50` : "#333" }}
                  >
                    #{String(tech.id).padStart(3, "0")}
                  </p>

                  {/* Name or locked */}
                  {tech.unlocked ? (
                    <>
                      <p
                        className="font-mono font-bold text-xs leading-tight mb-2"
                        style={{
                          color: activeBranchConfig.color,
                          textShadow: `0 0 4px ${activeBranchConfig.color}50`,
                        }}
                      >
                        {tech.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[9px] font-mono font-bold border px-1 py-0.5 rounded-sm"
                          style={{
                            color: severityCfg.color,
                            borderColor: severityCfg.color + "60",
                            backgroundColor: severityCfg.color + "10",
                          }}
                        >
                          {severityCfg.label}
                        </span>
                        <span
                          className="text-[9px] font-mono"
                          style={{ color: `${severityCfg.color}80` }}
                        >
                          {tech.cvss}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 gap-1">
                      <p className="text-[#444] text-lg font-mono">???</p>
                      <p className="text-[#333] text-[9px] font-mono">BLOQUEADO</p>
                    </div>
                  )}
                </div>

                {/* Hover glow overlay for unlocked */}
                {tech.unlocked && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${activeBranchConfig.color}10, transparent)`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Detail modal */}
        {selectedTechnique && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(10,14,10,0.92)" }}
            onClick={() => setSelectedTechnique(null)}
          >
            <div
              className="panel-classified w-full max-w-lg"
              style={{
                boxShadow: `0 0 40px ${activeBranchConfig.color}20, 0 20px 60px rgba(0,0,0,0.8)`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-military-border">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-mono"
                    style={{ color: `${activeBranchConfig.color}60` }}
                  >
                    #{String(selectedTechnique.id).padStart(3, "0")}
                  </span>
                  <h3
                    className="font-mono font-bold text-lg"
                    style={{
                      color: activeBranchConfig.color,
                      textShadow: `0 0 8px ${activeBranchConfig.color}`,
                    }}
                  >
                    {selectedTechnique.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTechnique(null)}
                  className="text-matrix-green/40 hover:text-neon-red font-mono text-sm transition-colors"
                >
                  [X]
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Meta badges */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="text-xs font-mono font-bold border px-2 py-0.5 rounded-sm"
                    style={{
                      color: SEVERITY_CONFIG[selectedTechnique.severity].color,
                      borderColor: SEVERITY_CONFIG[selectedTechnique.severity].color + "60",
                      backgroundColor: SEVERITY_CONFIG[selectedTechnique.severity].color + "10",
                    }}
                  >
                    Severidad: {SEVERITY_CONFIG[selectedTechnique.severity].label}
                  </span>
                  <span
                    className="text-xs font-mono font-bold border px-2 py-0.5 rounded-sm"
                    style={{
                      color: activeBranchConfig.color,
                      borderColor: activeBranchConfig.color + "60",
                      backgroundColor: activeBranchConfig.color + "10",
                    }}
                  >
                    CVSS: {selectedTechnique.cvss}
                  </span>
                  <span
                    className="text-xs font-mono border px-2 py-0.5 rounded-sm"
                    style={{
                      color: activeBranchConfig.color + "80",
                      borderColor: activeBranchConfig.color + "30",
                    }}
                  >
                    {activeBranchConfig.label}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-matrix-green/40 mb-2">
                    &gt; Descripcion
                  </p>
                  <p className="text-sm font-mono text-matrix-green/70 leading-relaxed">
                    {selectedTechnique.description}
                  </p>
                </div>

                {/* Unlock notice */}
                <div className="pt-3 border-t border-military-border/50">
                  <p className="text-matrix-green/30 text-xs font-mono text-center">
                    Completa retos de {activeBranchConfig.label} para desbloquear más detalles técnicos, CVEs relacionados y contramedidas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
