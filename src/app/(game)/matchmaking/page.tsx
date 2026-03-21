'use client';

import { useState } from 'react';
import Matchmaking from '@/components/game/Matchmaking';

export default function MatchmakingPage() {
  const [mode, setMode] = useState<'RACE' | 'TURNS' | 'RED_VS_BLUE'>('RACE');
  const [isSearching, setIsSearching] = useState(true);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {isSearching ? (
        <Matchmaking
          mode={mode}
          onMatchFound={(match) => {
            console.log('Match:', match);
            setIsSearching(false);
          }}
          onCancel={() => setIsSearching(false)}
        />
      ) : (
        <div className="panel-classified p-8 text-center">
          <div className="text-matrix-green text-xl mb-4">Búsqueda cancelada</div>
          <div className="flex gap-3 justify-center">
            {(['RACE', 'TURNS', 'RED_VS_BLUE'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setIsSearching(true); }}
                className="btn-hack text-xs"
              >
                {m === 'RACE' ? 'CARRERA' : m === 'TURNS' ? 'TURNOS' : 'RED vs BLUE'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
