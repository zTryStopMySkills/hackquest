'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

const RANK_COLORS: Record<string, string> = {
  SCRIPT_KIDDIE: '#888',
  JUNIOR: '#4CAF50',
  PENTESTER: '#2196F3',
  RED_TEAM: '#FF5722',
  ELITE_HACKER: '#9C27B0',
  LEGEND: '#FFD700',
};

interface DuelData {
  matchId: string;
  status: string;
  winnerId: string | null;
  playerA: { id: string; username: string; rank: string; elo: number; phasesCompleted: number };
  playerB: { id: string; username: string; rank: string; elo: number; phasesCompleted: number };
  events: Array<{
    id: string;
    actorId: string;
    type: string;
    phase?: number;
    sabotageType?: string;
    createdAt: string;
  }>;
}

export default function DuelDebriefPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<DuelData | null>(null);
  const [myId, setMyId] = useState('');

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.id) setMyId(d.id); });
    fetch(`/api/duel/${matchId}/spectate`).then(r => r.json()).then(setData);
  }, [matchId]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-matrix-green animate-pulse font-mono">Cargando debrief...</div>
      </div>
    );
  }

  const iWon = data.winnerId === myId;
  const playerA = data.playerA;
  const playerB = data.playerB;

  // Build dual timeline
  const timeline = data.events.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const eventLabel = (e: DuelData['events'][0]) => {
    if (e.type === 'PHASE_COMPLETE') return `Fase ${(e.phase ?? 0) + 1} completada`;
    if (e.type === 'SABOTAGE_USED') return `Sabotaje: ${(e.sabotageType ?? '').replace(/_/g, ' ')}`;
    if (e.type === 'MATCH_END') return 'FIN DEL DUELO';
    return e.type;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="classified-header mb-2">POST-MORTEM DUEL</div>
        {data.winnerId ? (
          <>
            <div className={`text-3xl font-mono mb-2 ${iWon ? 'text-matrix-green glow-text' : 'text-neon-red'}`}>
              {iWon ? '⚡ VICTORIA' : '💀 DERROTA'}
            </div>
            <div className="text-matrix-green/60 text-sm">
              Ganador:{' '}
              <span style={{ color: RANK_COLORS[data.winnerId === playerA.id ? playerA.rank : playerB.rank] }}>
                {data.winnerId === playerA.id ? playerA.username : playerB.username}
              </span>
            </div>
          </>
        ) : (
          <div className="text-matrix-green font-mono">Duelo en progreso o sin ganador registrado</div>
        )}
      </div>

      {/* Player comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[playerA, playerB].map((player) => (
          <div
            key={player.id}
            className={`panel p-4 text-center ${data.winnerId === player.id ? 'border-matrix-green' : 'border-military-border'}`}
          >
            <div className="text-xs text-matrix-green/40 mb-2">
              {data.winnerId === player.id ? '★ GANADOR' : 'PERDEDOR'}
            </div>
            <div
              className="text-lg font-mono mb-1"
              style={{ color: RANK_COLORS[player.rank] }}
            >
              {player.username}
            </div>
            <div className="text-xs text-matrix-green/60 mb-3">
              {player.rank.replace('_', ' ')} · ELO {player.elo}
            </div>
            <div className="text-3xl font-mono text-matrix-green">
              {player.phasesCompleted}
            </div>
            <div className="text-xs text-matrix-green/40">fases completadas</div>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="panel p-4 mb-6">
        <div className="text-xs text-matrix-green/60 mb-4 tracking-wider">LÍNEA DE TIEMPO DEL DUELO</div>
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-matrix-green/20" />

          <div className="space-y-4">
            {timeline.map((event) => {
              const isActorA = event.actorId === playerA.id;
              const label = eventLabel(event);
              const isEnd = event.type === 'MATCH_END';

              if (isEnd) {
                return (
                  <div key={event.id} className="text-center relative z-10">
                    <span className="bg-[#0d1117] px-4 py-1 border border-matrix-green/40 text-matrix-green text-xs font-mono rounded-sm">
                      {label} · {new Date(event.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                );
              }

              return (
                <div key={event.id} className={`flex items-center gap-4 ${isActorA ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-1 ${isActorA ? 'text-right' : 'text-left'}`}>
                    <div
                      className="inline-block px-3 py-2 border rounded-sm text-xs font-mono"
                      style={{
                        borderColor: event.type === 'SABOTAGE_USED' ? '#FFB80040' : '#00FF4130',
                        color: event.type === 'SABOTAGE_USED' ? '#FFB800' : '#00FF41',
                        backgroundColor: event.type === 'SABOTAGE_USED' ? '#FFB80008' : '#00FF4108',
                      }}
                    >
                      {label}
                      <div className="text-matrix-green/30 text-xs mt-0.5">
                        {new Date(event.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  {/* Center dot */}
                  <div className="relative z-10 w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: event.type === 'SABOTAGE_USED' ? '#FFB800' : '#00FF41',
                      boxShadow: `0 0 6px ${event.type === 'SABOTAGE_USED' ? '#FFB800' : '#00FF41'}`,
                    }}
                  />
                  <div className="flex-1" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.push('/duel')}
          className="px-6 py-3 bg-neon-red/10 border border-neon-red text-neon-red font-mono text-sm hover:bg-neon-red/20 rounded-sm"
        >
          NUEVA PARTIDA
        </button>
        <button
          onClick={() => router.push(`/duel/${matchId}/spectate`)}
          className="px-6 py-3 border border-matrix-green/40 text-matrix-green/60 font-mono text-sm hover:bg-matrix-green/5 rounded-sm"
        >
          VER REPETICIÓN
        </button>
        <button
          onClick={() => router.push('/play')}
          className="px-6 py-3 border border-matrix-green/40 text-matrix-green/60 font-mono text-sm hover:bg-matrix-green/5 rounded-sm"
        >
          VOLVER AL JUEGO
        </button>
      </div>
    </div>
  );
}
