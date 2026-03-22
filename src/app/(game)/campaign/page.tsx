'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type CampaignDifficulty = 'HARD' | 'MEDIUM' | 'EXPERT';

const DIFFICULTIES = [
  {
    id: 'HARD' as CampaignDifficulty,
    name: 'DIFÍCIL',
    subtitle: 'Aprende a tu ritmo',
    description: 'Ayudas visuales activas. Tips ilimitados a partir del intento 3. Sin tiempo límite.',
    color: '#4CAF50',
    features: ['Ayudas visuales', 'Tips ilimitados', 'Sin tiempo', 'Detección de bloqueo'],
  },
  {
    id: 'MEDIUM' as CampaignDifficulty,
    name: 'MEDIO',
    subtitle: 'Demuestra',
    description: 'Sin ayudas visuales. Solo 3 consejos por fase. Ayuda sutil si llevas +5 intentos.',
    color: '#00FFFF',
    features: ['Sin ayudas visuales', '3 consejos máx.', 'Sin tiempo', 'Ayuda mínima'],
  },
  {
    id: 'EXPERT' as CampaignDifficulty,
    name: 'EXPERTO',
    subtitle: 'Sobrevive',
    description: 'Sin ayudas. Sin consejos. Sin piedad. CON tiempo límite. Logro exclusivo: HACKER.',
    color: '#FF0040',
    features: ['Sin ayudas', 'Sin consejos', 'Con tiempo', '🏆 Logro HACKER'],
  },
];

interface ChapterData {
  id: number;
  name: string;
  challenges: number;
  status: 'completed' | 'unlocked' | 'locked';
  score?: number;
  description: string;
}

export default function CampaignPage() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<CampaignDifficulty | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<ChapterData | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/game/campaign')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setChapters(data.chapters);
          if (data.currentDifficulty) setSelectedDifficulty(data.currentDifficulty);
        }
        setLoading(false);
      });
  }, []);

  async function handleDifficultySelect(diff: CampaignDifficulty) {
    await fetch('/api/game/campaign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: diff }),
    });
    setSelectedDifficulty(diff);
  }

  const CHAPTERS_DATA = chapters;

  if (!selectedDifficulty) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="classified-header mb-2">OPERACIONES ENCUBIERTAS</div>
        <h1 className="text-3xl text-matrix-green glow-text font-display mb-2">Campaña</h1>
        <p className="text-matrix-green/60 text-sm mb-8">
          Selecciona tu nivel de dificultad. Esto afecta las ayudas disponibles durante la campaña.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.id}
              onClick={() => handleDifficultySelect(diff.id)}
              className="panel p-6 text-left transition-all hover:scale-[1.02] cursor-pointer"
              style={{ borderColor: `${diff.color}30` }}
            >
              <h3 className="text-xl font-display tracking-wider mb-1" style={{ color: diff.color }}>
                {diff.name}
              </h3>
              <p className="text-matrix-green/40 text-xs italic mb-3">{diff.subtitle}</p>
              <p className="text-matrix-green/60 text-sm mb-4 leading-relaxed">{diff.description}</p>
              <div className="space-y-1">
                {diff.features.map((f, i) => (
                  <div key={i} className="text-xs text-matrix-green/50">
                    {'>'} {f}
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const currentDiff = DIFFICULTIES.find((d) => d.id === selectedDifficulty)!;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="classified-header mb-1">OPERACIONES ENCUBIERTAS</div>
          <h1 className="text-2xl text-matrix-green glow-text font-display">Campaña</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 border rounded-sm" style={{ color: currentDiff.color, borderColor: `${currentDiff.color}40` }}>
            {currentDiff.name}
          </span>
          <button onClick={() => setSelectedDifficulty(null)} className="text-matrix-green/40 hover:text-matrix-green text-xs">
            [cambiar]
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-military-border" />

        <div className="space-y-6">
          {CHAPTERS_DATA.map((chapter, idx) => (
            <div key={chapter.id} className="relative pl-14">
              <div
                className="absolute left-4 w-4 h-4 rounded-full border-2 top-6"
                style={{
                  borderColor: chapter.status === 'completed' ? '#00FF41' : chapter.status === 'unlocked' ? currentDiff.color : '#333',
                  backgroundColor: chapter.status === 'completed' ? '#00FF41' : 'transparent',
                  boxShadow: chapter.status === 'completed' ? '0 0 8px rgba(0,255,65,0.5)' : chapter.status === 'unlocked' ? `0 0 8px ${currentDiff.color}50` : 'none',
                }}
              />

              <button
                onClick={() => chapter.status !== 'locked' && setSelectedChapter(chapter)}
                disabled={chapter.status === 'locked'}
                className={`panel p-5 w-full text-left transition-all ${
                  chapter.status === 'locked'
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:border-matrix-green/40 cursor-pointer hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-matrix-green/40 text-xs">CAP. {chapter.id}</span>
                    <h3 className={`text-lg ${chapter.status === 'completed' ? 'text-matrix-green/60' : 'text-matrix-green glow-text'}`}>
                      {chapter.status === 'locked' ? '█████████' : chapter.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {chapter.status === 'completed' && (
                      <span className="text-matrix-green text-xs">✅ {chapter.score} pts</span>
                    )}
                    {chapter.status === 'unlocked' && (
                      <span className="text-xs" style={{ color: currentDiff.color }}>▶ DISPONIBLE</span>
                    )}
                    {chapter.status === 'locked' && (
                      <span className="text-matrix-green/30 text-xs">🔒</span>
                    )}
                  </div>
                </div>

                <p className="text-matrix-green/50 text-sm">
                  {chapter.status === 'locked' ? '████████ ██████ ████████ ██████████' : chapter.description}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs text-matrix-green/40">{chapter.challenges} retos</span>
                  {chapter.status !== 'locked' && (
                    <div className="flex gap-1">
                      {Array.from({ length: chapter.challenges }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: chapter.status === 'completed' ? '#00FF41' : i === 0 ? currentDiff.color : '#333',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {selectedChapter && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setSelectedChapter(null)}>
          <div className="panel-classified p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="classified-header mb-3">BRIEFING DE CAPÍTULO</div>
            <h2 className="text-xl text-matrix-green glow-text mb-2">
              Capítulo {selectedChapter.id}: {selectedChapter.name}
            </h2>
            <p className="text-matrix-green/70 text-sm mb-4">{selectedChapter.description}</p>
            <div className="text-xs text-matrix-green/50 mb-4">
              {selectedChapter.challenges} retos encadenados | Dificultad: {currentDiff.name}
            </div>
            <div className="flex gap-3">
              <button
                className="btn-hack flex-1"
                onClick={() => router.push(`/campaign/${selectedChapter.id}`)}
              >
                {selectedChapter.status === 'completed' ? 'REJUGAR' : 'COMENZAR MISIÓN'}
              </button>
              <button onClick={() => setSelectedChapter(null)} className="btn-danger px-4">
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
