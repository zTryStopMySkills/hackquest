'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

const CHAPTER_META: Record<number, { name: string; description: string; color: string }> = {
  1: { name: 'La Brecha',      description: 'Una brecha de seguridad en un hospital. Tu primera misión como agente.', color: '#00FF41' },
  2: { name: 'Dentro del Muro', description: 'Has penetrado el perímetro. Ahora debes moverte sin ser detectado.',    color: '#00FFFF' },
  3: { name: 'Escalada',        description: 'Necesitas más privilegios para alcanzar tu objetivo. Escala hasta root.', color: '#FFB800' },
  4: { name: 'Exfiltración',    description: 'Tienes los datos. Ahora sácalos sin dejar rastro.',                     color: '#FF5722' },
  5: { name: 'Ghost Protocol',  description: 'La misión final. Borra toda evidencia y desaparece como un fantasma.',  color: '#FF0040' },
};

interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  briefing: string;
  difficulty: string;
  timeLimitSeconds: number;
  basePoints: number;
  solved: boolean;
  score: number;
  perfect: boolean;
}

const DIFF_COLORS: Record<string, string> = {
  EASY: '#4CAF50',
  MEDIUM: '#FFB800',
  HARD: '#FF5722',
  INSANE: '#FF0040',
};

export default function ChapterPage({ params }: { params: Promise<{ chapterId: string }> }) {
  const { chapterId: chapterIdStr } = use(params);
  const chapterId = parseInt(chapterIdStr, 10);
  const router = useRouter();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const meta = CHAPTER_META[chapterId];

  useEffect(() => {
    fetch(`/api/game/campaign/chapter/${chapterId}`)
      .then(r => r.ok ? r.json() : { challenges: [] })
      .then(data => {
        setChallenges(data.challenges ?? []);
        setLoading(false);
      });
  }, [chapterId]);

  const solvedCount = challenges.filter(c => c.solved).length;
  const totalScore = challenges.reduce((acc, c) => acc + (c.score ?? 0), 0);
  const allSolved = challenges.length > 0 && solvedCount === challenges.length;
  const progress = challenges.length > 0 ? solvedCount / challenges.length : 0;

  async function handleCompleteChapter() {
    setSaving(true);
    try {
      const res = await fetch('/api/game/campaign', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, score: totalScore }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => router.push('/campaign'), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!meta) {
    return (
      <div className="p-6 text-center text-matrix-green/40 font-mono">
        Capítulo no encontrado.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/campaign')}
          className="text-matrix-green/40 hover:text-matrix-green text-xs font-mono mb-4 block transition-colors"
        >
          ← VOLVER A CAMPAÑA
        </button>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-matrix-green/40 text-xs font-mono tracking-widest">
            &gt; OPERACIONES ENCUBIERTAS — CAPÍTULO {chapterId}
          </span>
        </div>
        <h1
          className="text-2xl font-mono font-bold"
          style={{ color: meta.color, textShadow: `0 0 8px ${meta.color}50` }}
        >
          {meta.name}
        </h1>
        <p className="text-matrix-green/60 text-sm font-mono mt-1">{meta.description}</p>
      </div>

      {/* Progress bar */}
      <div className="panel-classified px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-matrix-green/60 uppercase tracking-wider">
            Progreso del capítulo
          </span>
          <span className="text-xs font-mono font-bold text-matrix-green">
            {loading ? '...' : `${solvedCount}/${challenges.length} retos`}
          </span>
        </div>
        <div className="h-2 bg-military-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
              boxShadow: `0 0 8px ${meta.color}60`,
            }}
          />
        </div>
      </div>

      {/* Challenges list */}
      {loading ? (
        <div className="py-16 text-center">
          <p className="text-matrix-green/30 text-xs font-mono tracking-widest animate-pulse">
            &gt; ACCEDIENDO A ARCHIVOS DE MISIÓN...
          </p>
        </div>
      ) : challenges.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="text-matrix-green/40 font-mono text-sm mb-2">
            Los retos de este capítulo aún no han sido publicados.
          </p>
          <p className="text-matrix-green/20 font-mono text-xs">
            Vuelve pronto, Agente.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {challenges.map((challenge, idx) => {
            const diffColor = DIFF_COLORS[challenge.difficulty] ?? '#00FF41';
            return (
              <button
                key={challenge.id}
                onClick={() => setSelectedChallenge(challenge)}
                className="panel p-4 w-full text-left transition-all hover:border-matrix-green/40 hover:scale-[1.005] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xs font-mono w-6 text-center"
                      style={{ color: challenge.solved ? '#00FF41' : `${meta.color}60` }}
                    >
                      {challenge.solved ? '✓' : `${idx + 1}`}
                    </span>
                    <div>
                      <p
                        className="font-mono font-bold text-sm"
                        style={{ color: challenge.solved ? '#00FF4180' : meta.color }}
                      >
                        {challenge.title}
                        {challenge.perfect && (
                          <span className="ml-2 text-[9px] text-neon-cyan border border-neon-cyan/30 px-1 py-0.5">PERFECT</span>
                        )}
                      </p>
                      <p className="text-matrix-green/40 text-xs font-mono mt-0.5 line-clamp-1">
                        {challenge.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className="text-[10px] font-mono font-bold border px-2 py-0.5"
                      style={{ color: diffColor, borderColor: `${diffColor}40` }}
                    >
                      {challenge.difficulty}
                    </span>
                    {challenge.solved ? (
                      <span className="text-xs font-mono text-matrix-green">
                        +{challenge.score} pts
                      </span>
                    ) : (
                      <span
                        className="text-xs font-mono font-bold px-3 py-1 border transition-colors"
                        style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}08` }}
                      >
                        [JUGAR] &gt;
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Complete chapter CTA */}
      {!loading && allSolved && !saved && (
        <div
          className="panel-classified p-5 text-center"
          style={{ borderColor: `${meta.color}40`, boxShadow: `0 0 20px ${meta.color}10` }}
        >
          <p className="text-sm font-mono mb-1" style={{ color: meta.color }}>
            ¡Todos los retos completados!
          </p>
          <p className="text-matrix-green/40 text-xs font-mono mb-4">
            Puntuación total: {totalScore} pts
          </p>
          <button
            onClick={handleCompleteChapter}
            disabled={saving}
            className="btn-hack px-8"
            style={{ borderColor: meta.color, color: meta.color }}
          >
            {saving ? 'GUARDANDO...' : 'COMPLETAR CAPÍTULO →'}
          </button>
        </div>
      )}

      {saved && (
        <div className="panel-classified p-5 text-center">
          <p className="text-matrix-green font-mono text-sm glow-text animate-pulse">
            ✓ PROGRESO GUARDADO — Redirigiendo...
          </p>
        </div>
      )}

      {/* Challenge detail modal */}
      {selectedChallenge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(10,14,10,0.92)' }}
          onClick={() => setSelectedChallenge(null)}
        >
          <div
            className="panel-classified w-full max-w-lg"
            style={{ boxShadow: `0 0 40px ${meta.color}20, 0 20px 60px rgba(0,0,0,0.8)` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-military-border">
              <div>
                <h3
                  className="font-mono font-bold text-lg"
                  style={{ color: meta.color, textShadow: `0 0 8px ${meta.color}` }}
                >
                  {selectedChallenge.title}
                </h3>
                <p className="text-matrix-green/40 text-xs font-mono">{selectedChallenge.difficulty}</p>
              </div>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="text-matrix-green/40 hover:text-neon-red font-mono text-sm transition-colors"
              >
                [X]
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-matrix-green/40 mb-2">
                  &gt; BRIEFING
                </p>
                <p className="text-sm font-mono text-matrix-green/70 leading-relaxed">
                  {selectedChallenge.briefing || selectedChallenge.description}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-matrix-green/50">
                <span>Tiempo: {Math.floor(selectedChallenge.timeLimitSeconds / 60)}m</span>
                <span>Base: {selectedChallenge.basePoints} pts</span>
              </div>

              {selectedChallenge.solved ? (
                <div className="p-3 border border-matrix-green/20 text-center">
                  <p className="text-matrix-green text-sm font-mono">✓ COMPLETADO — {selectedChallenge.score} pts</p>
                </div>
              ) : (
                <button
                  className="btn-hack w-full"
                  style={{ borderColor: meta.color, color: meta.color }}
                  onClick={() => {
                    setSelectedChallenge(null);
                    // Navigate to the challenge play arena when it exists
                    // router.push(`/play/challenge/${selectedChallenge.id}?campaign=${chapterId}`);
                  }}
                >
                  INICIAR RETO →
                </button>
              )}

              <p className="text-matrix-green/20 text-[10px] font-mono text-center">
                El modo arena de retos de campaña estará disponible en la próxima actualización.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
