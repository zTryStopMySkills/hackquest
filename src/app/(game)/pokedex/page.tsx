"use client";

import { useState, useEffect } from "react";
import Panel from "@/components/ui/Panel";
import type { Severity } from "@/types/game";

type Branch = "WEB_HACKING" | "NETWORKS" | "CRYPTOGRAPHY" | "FORENSICS" | "SYSTEMS";

interface TechniqueCard {
  id: number;
  slug: string;
  name: string;
  branch: Branch;
  severity: Severity;
  cvss: number;
  unlocked: boolean;
  description: string;
}

const BRANCHES: { key: Branch; label: string; color: string; icon: string }[] = [
  { key: "WEB_HACKING",  label: "Web Hacking",  color: "#00FF41", icon: "[W]" },
  { key: "NETWORKS",     label: "Redes",        color: "#00FFFF", icon: "[N]" },
  { key: "CRYPTOGRAPHY", label: "Criptografía", color: "#FFB800", icon: "[C]" },
  { key: "FORENSICS",    label: "Forense",      color: "#9C27B0", icon: "[F]" },
  { key: "SYSTEMS",      label: "Sistemas",     color: "#FF5722", icon: "[S]" },
];

const SEVERITY_CONFIG: Record<Severity, { color: string; label: string }> = {
  LOW:      { color: "#4CAF50", label: "BAJO" },
  MEDIUM:   { color: "#FFB800", label: "MEDIO" },
  HIGH:     { color: "#FF5722", label: "ALTO" },
  CRITICAL: { color: "#FF0040", label: "CRÍTICO" },
};

export default function PokedexPage() {
  const [activeBranch, setActiveBranch] = useState<Branch>("WEB_HACKING");
  const [selectedTechnique, setSelectedTechnique] = useState<TechniqueCard | null>(null);
  const [techniques, setTechniques] = useState<TechniqueCard[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [total, setTotal] = useState(120);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/game/pokedex')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setTechniques(data.techniques);
          setUnlockedCount(data.unlockedCount);
          setTotal(data.total);
        }
        setLoading(false);
      });
  }, []);

  const filtered = techniques.filter(t => t.branch === activeBranch);
  const activeBranchConfig = BRANCHES.find(b => b.key === activeBranch)!;

  return (
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
            {loading ? (
              <p className="text-matrix-green/30 text-xs font-mono animate-pulse">CARGANDO...</p>
            ) : (
              <>
                <p className="text-2xl font-bold font-mono text-matrix-green" style={{ textShadow: "0 0 8px rgba(0,255,65,0.6)" }}>
                  {unlockedCount}
                  <span className="text-matrix-green/30 text-lg">/{total}</span>
                </p>
                <p className="text-matrix-green/40 text-[10px] font-mono uppercase tracking-wider">
                  técnicas descubiertas
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Global progress */}
      <div className="panel-classified px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-matrix-green/60 uppercase tracking-wider">
            Progreso global del Pokédex
          </span>
          <span className="text-xs font-mono font-bold text-matrix-green" style={{ textShadow: "0 0 4px rgba(0,255,65,0.5)" }}>
            {loading ? '…' : `${Math.round((unlockedCount / total) * 100)}%`}
          </span>
        </div>
        <div className="h-2 bg-military-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: loading ? '0%' : `${(unlockedCount / total) * 100}%`,
              background: "linear-gradient(90deg, #00FF41, #00FFFF)",
              boxShadow: "0 0 8px rgba(0,255,65,0.6)",
            }}
          />
        </div>
      </div>

      {/* Branch tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {BRANCHES.map(branch => {
          const branchTechs = techniques.filter(t => t.branch === branch.key);
          const branchUnlocked = branchTechs.filter(t => t.unlocked).length;
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
              <span className="text-[10px] opacity-70" style={{ color: isActive ? branch.color : "#555" }}>
                {loading ? '…' : `${branchUnlocked}/${branchTechs.length}`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Techniques grid */}
      {loading ? (
        <div className="py-16 text-center">
          <p className="text-matrix-green/30 text-xs font-mono tracking-widest animate-pulse">&gt; ACCEDIENDO A BASE DE DATOS...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(tech => {
            const severityCfg = SEVERITY_CONFIG[tech.severity];
            return (
              <button
                key={tech.id}
                onClick={() => tech.unlocked && setSelectedTechnique(tech)}
                className={`relative group text-left border rounded-sm transition-all duration-200 overflow-hidden ${
                  tech.unlocked ? "cursor-pointer hover:scale-105" : "cursor-default opacity-50"
                }`}
                style={{
                  borderColor: tech.unlocked ? activeBranchConfig.color + "40" : "#1a2a1a",
                  backgroundColor: tech.unlocked ? `${activeBranchConfig.color}06` : "#0d111766",
                  boxShadow: tech.unlocked ? `0 0 8px ${activeBranchConfig.color}10` : "none",
                }}
              >
                <div className="p-3">
                  <p className="text-[10px] font-mono mb-1.5" style={{ color: tech.unlocked ? `${activeBranchConfig.color}50` : "#333" }}>
                    #{String(tech.id).padStart(3, "0")}
                  </p>
                  {tech.unlocked ? (
                    <>
                      <p
                        className="font-mono font-bold text-xs leading-tight mb-2"
                        style={{ color: activeBranchConfig.color, textShadow: `0 0 4px ${activeBranchConfig.color}50` }}
                      >
                        {tech.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[9px] font-mono font-bold border px-1 py-0.5 rounded-sm"
                          style={{ color: severityCfg.color, borderColor: severityCfg.color + "60", backgroundColor: severityCfg.color + "10" }}
                        >
                          {severityCfg.label}
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: `${severityCfg.color}80` }}>
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
                {tech.unlocked && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{ background: `linear-gradient(135deg, ${activeBranchConfig.color}10, transparent)` }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selectedTechnique && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(10,14,10,0.92)" }}
          onClick={() => setSelectedTechnique(null)}
        >
          <div
            className="panel-classified w-full max-w-lg"
            style={{ boxShadow: `0 0 40px ${activeBranchConfig.color}20, 0 20px 60px rgba(0,0,0,0.8)` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-military-border">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono" style={{ color: `${activeBranchConfig.color}60` }}>
                  #{String(selectedTechnique.id).padStart(3, "0")}
                </span>
                <h3
                  className="font-mono font-bold text-lg"
                  style={{ color: activeBranchConfig.color, textShadow: `0 0 8px ${activeBranchConfig.color}` }}
                >
                  {selectedTechnique.name}
                </h3>
              </div>
              <button onClick={() => setSelectedTechnique(null)} className="text-matrix-green/40 hover:text-neon-red font-mono text-sm transition-colors">
                [X]
              </button>
            </div>

            <div className="p-5 space-y-4">
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
                  style={{ color: activeBranchConfig.color, borderColor: activeBranchConfig.color + "60", backgroundColor: activeBranchConfig.color + "10" }}
                >
                  CVSS: {selectedTechnique.cvss}
                </span>
                <span
                  className="text-xs font-mono border px-2 py-0.5 rounded-sm"
                  style={{ color: activeBranchConfig.color + "80", borderColor: activeBranchConfig.color + "30" }}
                >
                  {activeBranchConfig.label}
                </span>
              </div>

              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-matrix-green/40 mb-2">&gt; Descripcion</p>
                <p className="text-sm font-mono text-matrix-green/70 leading-relaxed">
                  {selectedTechnique.description}
                </p>
              </div>

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
  );
}
