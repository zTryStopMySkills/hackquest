'use client';

import { useState, useEffect } from 'react';

type ReportType = 'BUG' | 'FEEDBACK' | 'IMPROVEMENT' | 'CONTENT_ERROR' | 'OTHER';
type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

interface PastReport {
  id: string;
  type: ReportType;
  title: string;
  status: ReportStatus;
  createdAt: string;
  adminNote: string | null;
}

const TYPE_OPTIONS: { value: ReportType; icon: string; label: string; desc: string; color: string }[] = [
  { value: 'BUG',           icon: '●', label: 'Bug',           desc: 'Algo no funciona correctamente',  color: '#FF3333' },
  { value: 'IMPROVEMENT',   icon: '◈', label: 'Mejora',        desc: 'Sugerencia de funcionalidad',     color: '#2196F3' },
  { value: 'CONTENT_ERROR', icon: '◉', label: 'Error de reto', desc: 'Flag incorrecta, fase rota, etc.', color: '#FFB800' },
  { value: 'FEEDBACK',      icon: '◎', label: 'Feedback',      desc: 'Comentario general sobre el juego', color: '#00FF41' },
  { value: 'OTHER',         icon: '▣', label: 'Otro',          desc: 'Cualquier otra cosa',              color: '#888' },
];

const STATUS_COLORS: Record<ReportStatus, string> = {
  OPEN:       '#FFB800',
  IN_REVIEW:  '#2196F3',
  RESOLVED:   '#00FF41',
  DISMISSED:  '#555',
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN:       'PENDIENTE',
  IN_REVIEW:  'EN REVISIÓN',
  RESOLVED:   'RESUELTO',
  DISMISSED:  'CERRADO',
};

export default function ReportPage() {
  const [type, setType]         = useState<ReportType>('BUG');
  const [title, setTitle]       = useState('');
  const [description, setDesc]  = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [pastReports, setPast]  = useState<PastReport[]>([]);

  useEffect(() => {
    fetch('/api/reports').then(r => r.json()).then(d => setPast(d.reports ?? []));
  }, [success]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, title, description }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Error enviando reporte');
    } else {
      setSuccess(data.reportId);
      setTitle('');
      setDesc('');
    }
    setLoading(false);
  }

  const selectedType = TYPE_OPTIONS.find(t => t.value === type)!;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="classified-header mb-2">CANAL DE REPORTES</div>
        <h1 className="text-2xl font-mono text-matrix-green glow-text">
          Centro de Feedback
        </h1>
        <p className="text-matrix-green/50 text-sm mt-1">
          Reporta bugs, sugiere mejoras o da tu opinión. Cada reporte es revisado por el equipo.
        </p>
      </div>

      {success ? (
        /* Success state */
        <div className="panel p-8 text-center">
          <div className="text-4xl mb-4 glow-text">✓</div>
          <div className="text-xl text-matrix-green font-mono mb-2">REPORTE ENVIADO</div>
          <div className="text-matrix-green/60 text-sm mb-4">
            ID: <span className="font-mono text-matrix-green">{success.slice(0, 12)}...</span>
          </div>
          <p className="text-matrix-green/50 text-sm mb-6">
            El equipo revisará tu reporte. Recibirás una notificación cuando sea procesado.
          </p>
          <button
            onClick={() => setSuccess('')}
            className="px-6 py-2 border border-matrix-green text-matrix-green font-mono text-sm hover:bg-matrix-green/10 rounded-sm"
          >
            ENVIAR OTRO REPORTE
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type selector */}
          <div className="panel p-4">
            <div className="text-xs text-matrix-green/60 mb-3 tracking-wider">CATEGORÍA</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className="text-left p-3 border rounded-sm transition-all"
                  style={{
                    borderColor: type === opt.value ? opt.color : '#1a2a1a',
                    backgroundColor: type === opt.value ? `${opt.color}10` : 'transparent',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span style={{ color: opt.color }} className="text-sm font-bold">{opt.icon}</span>
                    <span
                      className="text-xs font-mono font-bold"
                      style={{ color: type === opt.value ? opt.color : '#888' }}
                    >
                      {opt.label}
                    </span>
                  </div>
                  <div className="text-xs text-matrix-green/40">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-matrix-green/60 mb-2 tracking-wider">
              TÍTULO <span className="text-matrix-green/30">({title.length}/120)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
              required
              placeholder={`Ej: ${type === 'BUG' ? 'El terminal no acepta el comando nmap' : type === 'IMPROVEMENT' ? 'Añadir modo oscuro al editor' : 'Describe brevemente...'}`}
              className="w-full bg-[#0a0a0a] border border-matrix-green/30 text-matrix-green font-mono text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-matrix-green placeholder-matrix-green/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-matrix-green/60 mb-2 tracking-wider">
              DESCRIPCIÓN <span className="text-matrix-green/30">({description.length}/2000)</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDesc(e.target.value)}
              maxLength={2000}
              required
              rows={7}
              placeholder={
                type === 'BUG'
                  ? 'Pasos para reproducir el bug:\n1. ...\n2. ...\n\nComportamiento esperado: ...\nComportamiento actual: ...'
                  : type === 'IMPROVEMENT'
                  ? 'Descripción de la mejora:\n\n¿Por qué sería útil?\n\n¿Cómo debería funcionar?'
                  : 'Describe con el máximo detalle posible...'
              }
              className="w-full bg-[#0a0a0a] border border-matrix-green/30 text-matrix-green font-mono text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-matrix-green placeholder-matrix-green/20 resize-y"
            />
            {description.length < 20 && description.length > 0 && (
              <p className="text-neon-red text-xs mt-1">Mínimo 20 caracteres ({20 - description.length} restantes)</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="border border-neon-red/40 bg-neon-red/5 rounded-sm px-3 py-2 text-neon-red text-sm font-mono">
              ⚠ {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || title.trim().length < 5 || description.trim().length < 20}
            className="w-full py-3 font-mono text-sm tracking-wider rounded-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: `${selectedType.color}15`,
              border: `1px solid ${selectedType.color}`,
              color: selectedType.color,
            }}
          >
            {loading ? 'ENVIANDO...' : `ENVIAR ${selectedType.label.toUpperCase()} ▶`}
          </button>
        </form>
      )}

      {/* Past reports */}
      {pastReports.length > 0 && (
        <div className="mt-10">
          <div className="text-xs text-matrix-green/40 mb-3 tracking-wider">TUS REPORTES RECIENTES</div>
          <div className="space-y-2">
            {pastReports.slice(0, 5).map(r => (
              <div
                key={r.id}
                className="border border-matrix-green/10 rounded-sm px-3 py-2.5 flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-mono"
                      style={{ color: TYPE_OPTIONS.find(t => t.value === r.type)?.color ?? '#888' }}
                    >
                      {r.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-matrix-green text-sm font-mono truncate">{r.title}</div>
                  {r.adminNote && (
                    <div className="text-matrix-green/50 text-xs mt-1">Admin: {r.adminNote}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 border rounded-sm font-mono"
                    style={{
                      color: STATUS_COLORS[r.status],
                      borderColor: `${STATUS_COLORS[r.status]}40`,
                    }}
                  >
                    {STATUS_LABELS[r.status]}
                  </span>
                  <span className="text-matrix-green/30 text-xs">
                    {new Date(r.createdAt).toLocaleDateString('es-ES')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
