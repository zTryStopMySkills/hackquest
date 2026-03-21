'use client';

import { useState, useEffect } from 'react';

interface Player {
  id: string;
  username: string;
  rank: string;
  elo: number;
  progress: number;
  solved: boolean;
  score: number;
}

interface MatchViewProps {
  matchId: string;
  players: Player[];
  mode: 'RACE' | 'TURNS' | 'RED_VS_BLUE';
  timeLimit: number;
  currentUserId: string;
  challengeTitle: string;
  children?: React.ReactNode;
}

export default function MatchView({
  players,
  mode,
  timeLimit,
  currentUserId,
  challengeTitle,
  children,
}: MatchViewProps) {
  const [timeElapsed, setTimeElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timeRemaining = timeLimit - timeElapsed;
  const timePercent = (timeElapsed / timeLimit) * 100;

  const rankColors: Record<string, string> = {
    SCRIPT_KIDDIE: '#888',
    JUNIOR: '#4CAF50',
    PENTESTER: '#2196F3',
    RED_TEAM: '#FF5722',
    ELITE_HACKER: '#9C27B0',
    LEGEND: '#FFD700',
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="classified-header">{mode === 'RACE' ? 'MODO CARRERA' : mode === 'TURNS' ? 'MODO POR TURNOS' : 'RED vs BLUE'}</span>
          <h2 className="text-xl text-matrix-green glow-text">{challengeTitle}</h2>
        </div>
        <div className={`text-2xl font-mono ${timePercent > 80 ? 'text-neon-red animate-pulse' : 'text-matrix-green'}`}>
          ⏱ {formatTime(timeRemaining > 0 ? timeRemaining : 0)}
        </div>
      </div>

      <div className="w-full h-1.5 bg-military-border mb-6 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${timePercent > 80 ? 'bg-neon-red' : timePercent > 50 ? 'bg-neon-amber' : 'bg-matrix-green'}`}
          style={{ width: `${Math.min(100, timePercent)}%` }}
        />
      </div>

      <div className="panel p-4 mb-4">
        <div className="text-xs text-matrix-green/60 mb-3 tracking-wider">JUGADORES</div>
        <div className="space-y-3">
          {players
            .sort((a, b) => b.progress - a.progress)
            .map((player, idx) => (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2 rounded-sm ${
                  player.id === currentUserId
                    ? 'bg-matrix-green/10 border border-matrix-green/20'
                    : ''
                } ${player.solved ? 'opacity-100' : 'opacity-80'}`}
              >
                <span className="text-matrix-green/50 text-sm w-5">#{idx + 1}</span>

                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: player.solved ? '#00FF41' : '#FFB800',
                    boxShadow: `0 0 6px ${player.solved ? '#00FF41' : '#FFB800'}`,
                  }}
                />

                <span className="text-matrix-green font-mono text-sm flex-shrink-0 w-32">
                  {player.username}
                  {player.id === currentUserId && <span className="text-matrix-green/40 ml-1">(tú)</span>}
                </span>

                <span
                  className="text-xs px-2 py-0.5 border rounded-sm flex-shrink-0"
                  style={{
                    color: rankColors[player.rank] || '#888',
                    borderColor: `${rankColors[player.rank] || '#888'}50`,
                  }}
                >
                  {player.rank.replace('_', ' ')}
                </span>

                <span className="text-matrix-green/50 text-xs flex-shrink-0">
                  ELO: {player.elo}
                </span>

                <div className="flex-1 h-2 bg-military-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-matrix-green transition-all duration-500 rounded-full"
                    style={{
                      width: `${player.progress}%`,
                      boxShadow: '0 0 6px rgba(0, 255, 65, 0.5)',
                    }}
                  />
                </div>

                <span className="text-matrix-green/60 text-xs w-12 text-right">
                  {Math.round(player.progress)}%
                </span>

                {player.solved && (
                  <span className="text-matrix-green text-xs glow-text">✅ {player.score}pts</span>
                )}
              </div>
            ))}
        </div>
      </div>

      {children}
    </div>
  );
}
