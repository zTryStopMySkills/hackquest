'use client';

import { useState, useEffect, useCallback, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Terminal from '@/components/terminal/Terminal';
import { io, Socket } from 'socket.io-client';

interface Phase {
  id: number;
  title: string;
  description: string;
  expectedCommands?: string[];
  validationFn?: string;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  targetType: string;
  phases: Phase[];
  flag: string;
  briefing: string;
  hints: string[];
}

interface IntelEntry {
  id: string;
  actorId: string;
  type: string;
  phase?: number;
  message?: string;
  timestamp?: number;
  createdAt?: string;
}

interface DuelState {
  matchId: string;
  status: string;
  scenario: Scenario | null;
  myPhasesCompleted: number[];
  opponentPhasesCount: number;
  sabotageCharges: number;
  playerA: { id: string; username: string; rank: string; elo: number };
  playerB: { id: string; username: string; rank: string; elo: number };
  winnerId: string | null;
  eloChange: number;
}

type SabotageEffect = {
  type: string;
  active: boolean;
  expiresAt?: number;
};

const SABOTAGE_LABELS: Record<string, { label: string; color: string; desc: string }> = {
  NOISE_INJECTION: { label: 'NOISE', color: '#FFB800', desc: 'Bloquea terminal enemiga 8s' },
  HONEYPOT_TRIGGER: { label: 'HONEYPOT', color: '#FF5722', desc: 'Invalida próxima flag enemiga' },
  IDS_ALERT: { label: 'IDS ALERT', color: '#9C27B0', desc: 'Añade fase extra al enemigo' },
  INTEL_BLACKOUT: { label: 'BLACKOUT', color: '#2196F3', desc: 'Oculta intel enemigo 30s' },
};

const RANK_COLORS: Record<string, string> = {
  SCRIPT_KIDDIE: '#888',
  JUNIOR: '#4CAF50',
  PENTESTER: '#2196F3',
  RED_TEAM: '#FF5722',
  ELITE_HACKER: '#9C27B0',
  LEGEND: '#FFD700',
};

export default function DuelMatchPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const router = useRouter();

  const [duel, setDuel] = useState<DuelState | null>(null);
  const [myId, setMyId] = useState('');
  const [currentPhase, setCurrentPhase] = useState(0);
  const [flagInput, setFlagInput] = useState('');
  const [flagResult, setFlagResult] = useState<{ correct?: boolean; message?: string } | null>(null);
  const [intelFeed, setIntelFeed] = useState<IntelEntry[]>([]);
  const [intelBlackout, setIntelBlackout] = useState(false);
  const [terminalLocked, setTerminalLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [activeSabotage, setActiveSabotage] = useState<SabotageEffect | null>(null);
  const [honeypotActive, setHoneypotActive] = useState(false);
  const [commandLog, setCommandLog] = useState<string[]>([]);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'terminal' | 'intel'>('terminal');
  const socketRef = useRef<Socket | null>(null);

  // Fetch duel state
  const fetchDuel = useCallback(async () => {
    try {
      const res = await fetch(`/api/duel/${matchId}`);
      if (!res.ok) return;
      const data = await res.json();
      setDuel(data);
    } catch {}
  }, [matchId]);

  // Get current user + connect socket
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d.id) setMyId(d.id);
    });

    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!SOCKET_URL) return;

    // Get short-lived token for socket auth
    fetch('/api/auth/socket-token').then(r => r.json()).then(({ token }) => {
      if (!token) return;
      const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.emit('duel:join', { matchId });

      socket.on('duel:intel', (entry: IntelEntry) => {
        setIntelFeed(prev => [entry, ...prev].slice(0, 50));
      });

      socket.on('duel:opponent_progress', () => {
        fetchDuel();
      });

      socket.on('duel:sabotage_incoming', ({ type, duration }: { type: string; duration: number }) => {
        setActiveSabotage({ type, active: true, expiresAt: Date.now() + duration });
        if (type === 'NOISE_INJECTION') {
          setTerminalLocked(true);
          setLockCountdown(Math.ceil(duration / 1000));
          const t = setInterval(() => {
            setLockCountdown(c => {
              if (c <= 1) { clearInterval(t); setTerminalLocked(false); return 0; }
              return c - 1;
            });
          }, 1000);
        }
        if (type === 'INTEL_BLACKOUT') {
          setIntelBlackout(true);
          setTimeout(() => setIntelBlackout(false), duration);
        }
        if (type === 'HONEYPOT_TRIGGER') {
          setHoneypotActive(true);
        }
      });

      return () => {
        socket.emit('duel:leave', { matchId });
        socket.disconnect();
      };
    });
  }, [matchId, fetchDuel]);

  useEffect(() => {
    fetchDuel();
    const interval = setInterval(fetchDuel, 5000);
    return () => clearInterval(interval);
  }, [fetchDuel]);

  // Redirect when finished
  useEffect(() => {
    if (duel?.status === 'FINISHED') {
      setTimeout(() => router.push(`/duel/${matchId}/debrief`), 2000);
    }
  }, [duel?.status, matchId, router]);

  const phase = duel?.scenario?.phases[currentPhase];
  const totalPhases = duel?.scenario?.phases.length ?? 1;

  const handleCommand = async (cmd: string): Promise<string> => {
    if (terminalLocked) return 'ERROR: Terminal bloqueado por interferencia enemiga.';

    setCommandLog((prev) => [...prev, cmd]);

    const lower = cmd.toLowerCase().trim();

    // Phase validation (simplified — check expected commands)
    if (phase && phase.expectedCommands) {
      const matched = phase.expectedCommands.some((ec) =>
        lower.includes(ec.toLowerCase())
      );

      if (matched && !duel?.myPhasesCompleted.includes(currentPhase)) {
        // Complete phase
        await fetch(`/api/duel/${matchId}/phase`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phase: currentPhase, commandLog }),
        });

        if (currentPhase + 1 < totalPhases) {
          setCurrentPhase((p) => p + 1);
          await fetchDuel();
          return `SUCCESS: Fase ${currentPhase + 1} completada. Avanzando al siguiente vector...`;
        } else {
          return `SUCCESS: Todas las fases completadas. Introduce la flag para ganar.`;
        }
      }
    }

    if (lower === 'help') {
      return [
        'Comandos disponibles:',
        '  nmap -sV <target>     — escanear servicios',
        '  gobuster dir -u <url> — enumerar directorios',
        '  sqlmap -u <url>       — detectar SQLi',
        '  exploit <service>     — explotar servicio vulnerable',
        '  flag <value>          — enviar flag',
        '  hints                 — ver pistas disponibles',
      ].join('\n');
    }

    if (lower.startsWith('flag ')) {
      const f = cmd.slice(5).trim();
      setFlagInput(f);
      return 'INFO: Enviando flag al servidor...';
    }

    if (lower === 'hints') {
      const hints = duel?.scenario?.hints ?? [];
      if (hints.length === 0) return 'INFO: No hay pistas disponibles.';
      return hints.map((h, i) => `[PISTA ${i + 1}] ${h}`).join('\n');
    }

    // Generic responses for realism
    const responses: Record<string, string> = {
      'nmap': 'Starting Nmap 7.94 ... Host is up (0.051s latency).\nPORT   STATE SERVICE VERSION\n80/tcp open  http    Apache 2.4.52',
      'gobuster': 'Gobuster v3.6 — encontrando directorios...\n/admin (Status: 302)\n/backup (Status: 403)\n/.git (Status: 200)',
      'sqlmap': 'sqlmap identified 1 injectable parameter.\n[INFO] Parameter: id (GET) is vulnerable to SQL injection.',
      'exploit': 'INFO: Ejecutando exploit... acceso obtenido al sistema objetivo.',
      'ls': 'bin  etc  home  tmp  usr  var  flag.txt',
      'cat flag.txt': 'INFO: Archivo encontrado — analiza su contenido con cuidado.',
      'whoami': 'www-data',
      'id': 'uid=33(www-data) gid=33(www-data) groups=33(www-data)',
      'uname -a': 'Linux target 5.15.0-1035-aws #39-Ubuntu SMP',
    };

    for (const [key, val] of Object.entries(responses)) {
      if (lower.startsWith(key)) return val;
    }

    return `[${cmd}]: Comando ejecutado.`;
  };

  async function submitFlag() {
    if (!flagInput.trim()) return;
    if (honeypotActive) {
      setFlagResult({ correct: false, message: '⚠️ HONEYPOT ACTIVADO — Flag bloqueada por el enemigo.' });
      setHoneypotActive(false);
      return;
    }

    const res = await fetch(`/api/duel/${matchId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flag: flagInput }),
    });
    const data = await res.json();
    setFlagResult(data);
    if (data.correct) {
      await fetchDuel();
    }
  }

  async function useSabotage(type: string) {
    if (!duel || duel.sabotageCharges <= 0) return;

    await fetch(`/api/duel/${matchId}/sabotage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });

    await fetchDuel();
    setIntelFeed((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        actorId: myId,
        type: 'SABOTAGE_USED',
        message: `[WARFARE] Lanzaste ${type.replace(/_/g, ' ')} contra el objetivo enemigo.`,
        timestamp: Date.now(),
      },
    ]);
  }

  if (!duel) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-matrix-green animate-pulse font-mono">Cargando duelo...</div>
      </div>
    );
  }

  const isA = duel.playerA?.id === myId;
  const me = isA ? duel.playerA : duel.playerB;
  const opponent = isA ? duel.playerB : duel.playerA;

  return (
    <div className="max-w-7xl mx-auto py-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="classified-header text-neon-red">DUELO ACTIVO</span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-matrix-green font-mono text-sm">
              {me?.username ?? '...'}
            </span>
            <span className="text-matrix-green/40">vs</span>
            <span className="font-mono text-sm" style={{ color: RANK_COLORS[opponent?.rank ?? 'JUNIOR'] }}>
              {opponent?.username ?? 'Esperando...'}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-matrix-green/40 mb-1">OBJETIVO</div>
          <div className="text-matrix-green font-mono text-sm">
            {duel.scenario?.title ?? '—'}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="panel p-3 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-matrix-green/60 mb-1">TU PROGRESO</div>
            <div className="flex gap-1">
              {Array.from({ length: totalPhases }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    backgroundColor: duel.myPhasesCompleted.includes(i) ? '#00FF41' : '#1a2a1a',
                    boxShadow: duel.myPhasesCompleted.includes(i) ? '0 0 6px rgba(0,255,65,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
            <div className="text-xs text-matrix-green/50 mt-1">
              {duel.myPhasesCompleted.length}/{totalPhases} fases
            </div>
          </div>
          <div>
            <div className="text-xs text-matrix-green/60 mb-1">PROGRESO ENEMIGO (INTERCEPTADO)</div>
            <div className="flex gap-1">
              {Array.from({ length: totalPhases }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-2 rounded-full"
                  style={{
                    backgroundColor: i < duel.opponentPhasesCount ? '#FF5722' : '#1a2a1a',
                    boxShadow: i < duel.opponentPhasesCount ? '0 0 6px rgba(255,87,34,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
            <div className="text-xs text-neon-red/50 mt-1">
              {duel.opponentPhasesCount}/{totalPhases} fases
            </div>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="lg:hidden mb-3 flex gap-2">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex-1 py-2 text-xs font-mono border rounded-sm ${activeTab === 'terminal' ? 'border-matrix-green text-matrix-green' : 'border-matrix-green/30 text-matrix-green/50'}`}
        >
          TERMINAL
        </button>
        <button
          onClick={() => setActiveTab('intel')}
          className={`flex-1 py-2 text-xs font-mono border rounded-sm ${activeTab === 'intel' ? 'border-neon-red text-neon-red' : 'border-neon-red/30 text-neon-red/50'}`}
        >
          INTEL FEED
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Left panel: Terminal */}
        <div className={`${activeTab !== 'terminal' ? 'hidden lg:block' : ''}`}>
          {/* Phase info */}
          {phase && (
            <div className="panel p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-matrix-green/60 tracking-wider">
                  FASE {currentPhase + 1} / {totalPhases}
                </span>
                <span className="text-xs text-matrix-green/40">{phase.title}</span>
              </div>
              <p className="text-matrix-green/80 text-sm">{phase.description}</p>
              {phase.expectedCommands && (
                <div className="mt-2 text-xs text-matrix-green/40">
                  Comandos clave: {phase.expectedCommands.join(', ')}
                </div>
              )}
            </div>
          )}

          {/* Briefing accordion */}
          <div className="border border-matrix-green/20 rounded-sm mb-3">
            <button
              onClick={() => setBriefingOpen((o) => !o)}
              className="w-full px-3 py-2 text-left text-xs text-matrix-green/60 font-mono flex items-center justify-between hover:bg-matrix-green/5"
            >
              BRIEFING DEL OBJETIVO
              <span>{briefingOpen ? '▲' : '▼'}</span>
            </button>
            {briefingOpen && (
              <div className="px-3 pb-3 text-matrix-green/70 text-xs leading-relaxed">
                {duel.scenario?.briefing}
              </div>
            )}
          </div>

          {terminalLocked && (
            <div className="text-center text-neon-red text-sm font-mono animate-pulse mb-2">
              ⚠ TERMINAL BLOQUEADO — INTERFERENCIA DETECTADA ({lockCountdown}s)
            </div>
          )}

          <Terminal
            onCommand={handleCommand}
            initialLines={[
              `HackQuest Terminal v1.0 — Duelo ${matchId.slice(0, 8)}`,
              `Objetivo: ${duel.scenario?.title ?? 'Desconocido'}`,
              `Tipo: ${duel.scenario?.targetType ?? '—'} | Fases: ${totalPhases}`,
              '---',
              'Escribe "help" para ver comandos disponibles.',
            ]}
            height="320px"
            readOnly={terminalLocked}
          />

          {/* Flag submission */}
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={flagInput}
              onChange={(e) => setFlagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitFlag()}
              placeholder="HACKQUEST{...}"
              className="flex-1 bg-[#0a0a0a] border border-matrix-green/40 text-matrix-green font-mono text-sm px-3 py-2 rounded-sm focus:outline-none focus:border-matrix-green"
            />
            <button
              onClick={submitFlag}
              className="px-4 py-2 bg-matrix-green/10 border border-matrix-green text-matrix-green font-mono text-sm hover:bg-matrix-green/20 rounded-sm"
            >
              FLAG
            </button>
          </div>
          {flagResult && (
            <div className={`mt-2 text-sm font-mono ${flagResult.correct ? 'text-matrix-green glow-text' : 'text-neon-red'}`}>
              {flagResult.correct ? '✓ FLAG CORRECTA — ¡Victoria!' : `✗ ${flagResult.message ?? 'Flag incorrecta'}`}
            </div>
          )}
        </div>

        {/* Right panel: Intel + Sabotage */}
        <div className={`${activeTab !== 'intel' ? 'hidden lg:block' : ''}`}>
          {/* Sabotage panel */}
          <div className="panel p-3 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-matrix-green/60 tracking-wider">SISTEMA DE SABOTAJE</span>
              <span className="text-xs font-mono" style={{ color: duel.sabotageCharges > 0 ? '#00FF41' : '#FF0040' }}>
                {duel.sabotageCharges} CARGAS
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(SABOTAGE_LABELS).map(([type, { label, color, desc }]) => (
                <button
                  key={type}
                  onClick={() => useSabotage(type)}
                  disabled={duel.sabotageCharges <= 0}
                  className="text-left p-2 border rounded-sm transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ borderColor: `${color}40`, backgroundColor: `${color}08` }}
                >
                  <div className="text-xs font-mono mb-0.5" style={{ color }}>{label}</div>
                  <div className="text-xs text-matrix-green/40">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active effects */}
          {(activeSabotage?.active || honeypotActive) && (
            <div className="border border-neon-red/40 rounded-sm p-2 mb-3 text-xs">
              <div className="text-neon-red font-mono mb-1">⚠ EFECTOS ACTIVOS</div>
              {honeypotActive && <div className="text-neon-red/70">HONEYPOT — próxima flag bloqueada</div>}
              {activeSabotage?.active && (
                <div className="text-neon-amber/70">{activeSabotage.type.replace(/_/g, ' ')} activo</div>
              )}
            </div>
          )}

          {/* Intel feed */}
          <div className="panel p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-matrix-green/60 tracking-wider">FEED DE INTELIGENCIA</span>
              {intelBlackout && (
                <span className="text-xs text-[#2196F3] animate-pulse">BLACKOUT ACTIVO</span>
              )}
            </div>
            <div
              className="bg-[#0a0a0a] border border-[#1a2a1a] rounded-sm p-3 font-mono text-xs overflow-y-auto"
              style={{ height: '420px' }}
            >
              {intelBlackout ? (
                <div className="text-[#2196F3]/50 text-center mt-8">
                  [SEÑAL BLOQUEADA]<br />Intel feed temporalmente inactivo
                </div>
              ) : intelFeed.length === 0 ? (
                <div className="text-matrix-green/30 text-center mt-8">
                  Esperando señales enemigas...
                </div>
              ) : (
                [...intelFeed].reverse().map((entry) => (
                  <div
                    key={entry.id}
                    className={`mb-2 pb-2 border-b border-matrix-green/10 ${
                      entry.type === 'SABOTAGE_USED' ? 'text-[#FFB800]/80' : 'text-matrix-green/70'
                    }`}
                  >
                    <span className="text-matrix-green/30 mr-2">
                      {entry.createdAt
                        ? new Date(entry.createdAt).toLocaleTimeString()
                        : entry.timestamp
                        ? new Date(entry.timestamp).toLocaleTimeString()
                        : '—'}
                    </span>
                    {entry.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Winner overlay */}
      {duel.status === 'FINISHED' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="panel p-8 text-center max-w-md">
            {duel.winnerId === myId ? (
              <>
                <div className="text-4xl mb-4 glow-text">⚡</div>
                <div className="text-2xl text-matrix-green font-mono glow-text mb-2">VICTORIA</div>
                <div className="text-matrix-green/60 mb-4">Objetivo comprometido. Misión completada.</div>
                <div className="text-matrix-green font-mono">ELO {duel.eloChange > 0 ? '+' : ''}{duel.eloChange}</div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">💀</div>
                <div className="text-2xl text-neon-red font-mono mb-2">DERROTA</div>
                <div className="text-matrix-green/60 mb-4">El enemigo fue más rápido. Aprende y vuelve.</div>
                <div className="text-neon-red font-mono">ELO {duel.eloChange}</div>
              </>
            )}
            <div className="text-matrix-green/40 text-sm mt-4 animate-pulse">Cargando debrief...</div>
          </div>
        </div>
      )}
    </div>
  );
}
