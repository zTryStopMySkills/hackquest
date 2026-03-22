'use client';

import { useState, useEffect, use } from 'react';

const RANK_COLORS: Record<string, string> = {
  SCRIPT_KIDDIE: '#888',
  JUNIOR: '#4CAF50',
  PENTESTER: '#2196F3',
  RED_TEAM: '#FF5722',
  ELITE_HACKER: '#9C27B0',
  LEGEND: '#FFD700',
};

interface SpectateData {
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

export default function DuelSpectatePage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params);
  const [data, setData] = useState<SpectateData | null>(null);

  useEffect(() => {
    const load = () =>
      fetch(`/api/duel/${matchId}/spectate`)
        .then((r) => r.json())
        .then(setData)
        .catch(() => {});

    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, [matchId]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-matrix-green animate-pulse font-mono">Conectando al feed...</div>
      </div>
    );
  }

  const { playerA, playerB, events } = data;
  const timeline = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const eventLabel = (e: SpectateData['events'][0]) => {
    if (e.type === 'PHASE_COMPLETE') return `Fase ${(e.phase ?? 0) + 1}`;
    if (e.type === 'SABOTAGE_USED') return `☠ ${(e.sabotageType ?? '').replace(/_/g, ' ')}`;
    if (e.type === 'MATCH_END') return 'FIN';
    return e.type;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="classified-header mb-2">MODO ESPECTADOR</div>
        <h1 className="text-2xl font-mono text-matrix-green">
          {playerA.username} <span className="text-matrix-green/40">vs</span> {playerB.username}
        </h1>
        <div className={`text-sm mt-1 font-mono ${data.status === 'IN_PROGRESS' ? 'text-matrix-green animate-pulse' : 'text-matrix-green/50'}`}>
          {data.status === 'WAITING' && 'ESPERANDO JUGADORES...'}
          {data.status === 'IN_PROGRESS' && '● EN CURSO'}
          {data.status === 'FINISHED' && `FINALIZADO — Ganador: ${data.winnerId === playerA.id ? playerA.username : playerB.username}`}
        </div>
      </div>

      {/* Live progress */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[playerA, playerB].map((player) => (
          <div
            key={player.id}
            className={`panel p-4 text-center ${data.winnerId === player.id ? 'border-matrix-green' : ''}`}
          >
            <div className="font-mono mb-1" style={{ color: RANK_COLORS[player.rank] }}>
              {player.username}
              {data.winnerId === player.id && <span className="text-matrix-green ml-2">★</span>}
            </div>
            <div className="text-xs text-matrix-green/50 mb-3">
              {player.rank.replace('_', ' ')} · ELO {player.elo}
            </div>
            <div className="text-4xl font-mono text-matrix-green">{player.phasesCompleted}</div>
            <div className="text-xs text-matrix-green/40">fases completadas</div>
            {/* Phase dots */}
            <div className="flex justify-center gap-1 mt-2">
              {Array.from({ length: Math.max(player.phasesCompleted, 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: i < player.phasesCompleted ? '#00FF41' : '#1a2a1a',
                    boxShadow: i < player.phasesCompleted ? '0 0 6px rgba(0,255,65,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Event feed */}
      <div className="panel p-4">
        <div className="text-xs text-matrix-green/60 mb-4 tracking-wider">
          FEED EN TIEMPO REAL
          {data.status === 'IN_PROGRESS' && (
            <span className="text-matrix-green animate-pulse ml-2">● LIVE</span>
          )}
        </div>
        <div
          className="bg-[#0a0a0a] border border-[#1a2a1a] rounded-sm p-3 font-mono text-xs overflow-y-auto"
          style={{ height: '320px' }}
        >
          {timeline.length === 0 ? (
            <div className="text-matrix-green/30 text-center mt-8">Esperando eventos...</div>
          ) : (
            [...timeline].reverse().map((event) => {
              const isA = event.actorId === playerA.id;
              const actor = isA ? playerA : playerB;
              const isSabotage = event.type === 'SABOTAGE_USED';
              const isEnd = event.type === 'MATCH_END';

              return (
                <div
                  key={event.id}
                  className="mb-2 pb-2 border-b border-matrix-green/10"
                  style={{ color: isEnd ? '#FFD700' : isSabotage ? '#FFB800' : '#00FF41' }}
                >
                  <span className="text-matrix-green/30 mr-2">
                    {new Date(event.createdAt).toLocaleTimeString()}
                  </span>
                  <span style={{ color: RANK_COLORS[actor.rank] }}>{actor.username}</span>
                  <span className="text-matrix-green/50 mx-2">→</span>
                  {eventLabel(event)}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
