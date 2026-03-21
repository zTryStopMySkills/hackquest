'use client';

import { useState, useEffect } from 'react';

interface MatchmakingProps {
  onMatchFound: (match: { id: string; players: unknown[]; challenge: unknown }) => void;
  onCancel: () => void;
  mode: 'RACE' | 'TURNS' | 'RED_VS_BLUE';
}

export default function Matchmaking({ onMatchFound, onCancel, mode }: MatchmakingProps) {
  const [status, setStatus] = useState<'searching' | 'found' | 'error'>('searching');
  const [searchTime, setSearchTime] = useState(0);
  const [dots, setDots] = useState('');
  const [playersFound, setPlayersFound] = useState(1);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime((t) => t + 1);
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const searchMessages = [
      { time: 2, msg: '> Conectando con el servidor de matchmaking...' },
      { time: 4, msg: '> Analizando rango y ELO del agente...' },
      { time: 6, msg: '> Buscando oponentes en rango similar...' },
      { time: 10, msg: '> Ampliando rango de búsqueda...' },
      { time: 15, msg: '> Escaneando servidores regionales...' },
      { time: 20, msg: '> Expandiendo búsqueda global...' },
    ];

    const msg = searchMessages.find((m) => m.time === searchTime);
    if (msg) {
      setMessages((prev) => [...prev, msg.msg]);
    }

    if (searchTime === 8) setPlayersFound(2);
    if (searchTime === 12) setPlayersFound(3);

    if (searchTime >= 5 && Math.random() > 0.7) {
      setStatus('found');
      fetch('/api/matchmaking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            onMatchFound(data.match);
          }
        })
        .catch(() => setStatus('error'));
    }
  }, [searchTime, mode, onMatchFound]);

  const modeNames: Record<string, string> = {
    RACE: 'CARRERA',
    TURNS: 'POR TURNOS',
    RED_VS_BLUE: 'RED vs BLUE',
  };

  return (
    <div className="panel-classified p-8 max-w-lg mx-auto text-center">
      <div className="classified-header mb-6">MATCHMAKING</div>

      <div className="text-matrix-green text-xl glow-text mb-2">
        Buscando oponentes{dots}
      </div>

      <div className="text-matrix-green/60 text-sm mb-6">
        Modo: {modeNames[mode]} | Tiempo: {searchTime}s
      </div>

      <div className="relative w-32 h-32 mx-auto mb-6">
        <div className="absolute inset-0 border-2 border-matrix-green/30 rounded-full" />
        <div
          className="absolute inset-0 border-2 border-t-matrix-green border-r-transparent border-b-transparent border-l-transparent rounded-full"
          style={{
            animation: 'spin 1.5s linear infinite',
          }}
        />
        <div
          className="absolute inset-2 border-2 border-t-transparent border-r-neon-cyan border-b-transparent border-l-transparent rounded-full"
          style={{
            animation: 'spin 2s linear infinite reverse',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl text-matrix-green glow-text">{playersFound}/5</span>
        </div>
      </div>

      <div className="text-left mb-6 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="text-matrix-green/60 terminal-line">{msg}</div>
        ))}
      </div>

      <button
        onClick={onCancel}
        className="btn-danger"
      >
        CANCELAR BÚSQUEDA
      </button>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
