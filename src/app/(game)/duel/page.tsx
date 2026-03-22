'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const RANK_COLORS: Record<string, string> = {
  SCRIPT_KIDDIE: '#888',
  JUNIOR: '#4CAF50',
  PENTESTER: '#2196F3',
  RED_TEAM: '#FF5722',
  ELITE_HACKER: '#9C27B0',
  LEGEND: '#FFD700',
};

type DuelState = 'idle' | 'searching' | 'matched' | 'error';

interface MatchResult {
  matchId: string;
  scenario: { title: string; description: string; targetType: string; briefing: string };
  opponentName: string | null;
  opponentRank: string | null;
  opponentElo: number | null;
  started: boolean;
  waiting: boolean;
}

export default function DuelLobbyPage() {
  const router = useRouter();
  const [state, setState] = useState<DuelState>('idle');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState('');

  async function findOpponent() {
    setState('searching');
    setError('');

    try {
      const res = await fetch('/api/duel/create', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Error buscando oponente');
        setState('error');
        return;
      }

      setResult(data);

      if (data.started) {
        setState('matched');
        setTimeout(() => router.push(`/duel/${data.matchId}`), 1500);
      } else {
        setState('searching');
        // Poll until opponent joins
        pollForOpponent(data.matchId);
      }
    } catch {
      setError('Error de red');
      setState('error');
    }
  }

  function pollForOpponent(matchId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/duel/${matchId}`);
        if (!res.ok) { clearInterval(interval); return; }
        const data = await res.json();
        if (data.status === 'IN_PROGRESS') {
          clearInterval(interval);
          setResult((prev) => prev ? { ...prev, started: true } : prev);
          setState('matched');
          setTimeout(() => router.push(`/duel/${matchId}`), 1500);
        }
      } catch {
        clearInterval(interval);
      }
    }, 2000);

    // Timeout after 3 minutes
    setTimeout(() => clearInterval(interval), 180000);
  }

  const targetTypeIcon: Record<string, string> = {
    web: '◈',
    ip: '◎',
    base: '▣',
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="text-center mb-10">
        <div className="classified-header mb-2">MODO DUELO</div>
        <h1 className="text-3xl font-mono text-neon-red glow-text mb-2">
          HACKER vs HACKER
        </h1>
        <p className="text-matrix-green/60 text-sm">
          Dos agentes. Dos objetivos. El primero en comprometer su objetivo gana.
        </p>
      </div>

      <div className="panel p-6 mb-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: '◈', label: 'Objetivos asimétricos', desc: 'Cada jugador ataca un objetivo diferente' },
            { icon: '⚡', label: 'Sistema de sabotaje', desc: '2 cargas por partida — úsalas con sabiduría' },
            { icon: '📡', label: 'Intel en tiempo real', desc: 'Intercepta el progreso enemigo como narrativa' },
          ].map((feat) => (
            <div key={feat.label} className="text-center p-3 border border-matrix-green/20 rounded-sm">
              <div className="text-2xl mb-2 glow-text">{feat.icon}</div>
              <div className="text-xs text-matrix-green font-mono mb-1">{feat.label}</div>
              <div className="text-xs text-matrix-green/50">{feat.desc}</div>
            </div>
          ))}
        </div>

        <div className="border border-matrix-green/20 rounded-sm p-4 mb-6">
          <div className="text-xs text-matrix-green/60 mb-3 tracking-wider">SABOTAJES DISPONIBLES</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: 'NOISE_INJECTION', desc: 'Bloquea el terminal enemigo 8 segundos', color: '#FFB800' },
              { type: 'HONEYPOT_TRIGGER', desc: 'Invalida el próximo intento de flag', color: '#FF5722' },
              { type: 'IDS_ALERT', desc: 'Añade una fase extra de verificación', color: '#9C27B0' },
              { type: 'INTEL_BLACKOUT', desc: 'Oculta el feed de intel 30 segundos', color: '#2196F3' },
            ].map((s) => (
              <div key={s.type} className="flex items-start gap-2">
                <span className="w-2 h-2 mt-1 rounded-full flex-shrink-0" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                <div>
                  <div className="text-xs font-mono" style={{ color: s.color }}>{s.type.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-matrix-green/40">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {state === 'idle' && (
          <button
            onClick={findOpponent}
            className="w-full py-3 bg-neon-red/10 border border-neon-red text-neon-red font-mono tracking-wider hover:bg-neon-red/20 transition-all duration-200 rounded-sm"
          >
            BUSCAR OPONENTE
          </button>
        )}

        {state === 'searching' && !result?.started && (
          <div className="text-center py-6">
            <div className="text-matrix-green animate-pulse text-lg font-mono mb-2">
              ⟳ ESCANEANDO RED...
            </div>
            <p className="text-matrix-green/50 text-sm">Buscando agente hostil compatible...</p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-matrix-green animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {state === 'matched' && result && (
          <div className="text-center py-4">
            <div className="text-matrix-green glow-text text-lg font-mono mb-3">
              ✓ OPONENTE DETECTADO
            </div>
            {result.opponentName && (
              <div className="mb-3">
                <span className="text-matrix-green/60 text-sm">Enfrentando a: </span>
                <span
                  className="font-mono text-sm"
                  style={{ color: RANK_COLORS[result.opponentRank ?? 'JUNIOR'] }}
                >
                  {result.opponentName}
                </span>
                {result.opponentElo && (
                  <span className="text-matrix-green/40 text-xs ml-2">ELO {result.opponentElo}</span>
                )}
              </div>
            )}
            <div className="border border-matrix-green/30 rounded-sm p-3 mb-3 text-left">
              <div className="text-xs text-matrix-green/60 mb-1">TU OBJETIVO</div>
              <div className="text-matrix-green font-mono text-sm">
                {targetTypeIcon[result.scenario?.targetType ?? 'web']} {result.scenario?.title}
              </div>
              <div className="text-matrix-green/50 text-xs mt-1">{result.scenario?.description}</div>
            </div>
            <div className="text-matrix-green/60 text-sm animate-pulse">Iniciando duelo...</div>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center py-4">
            <div className="text-neon-red font-mono mb-3">{error}</div>
            <button
              onClick={() => setState('idle')}
              className="px-6 py-2 border border-matrix-green text-matrix-green font-mono text-sm hover:bg-matrix-green/10 transition-all rounded-sm"
            >
              REINTENTAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
