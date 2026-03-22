'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[HackQuest] Error no controlado:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-military-dark flex items-center justify-center font-mono">
      <div className="text-center max-w-lg px-6">
        <div
          className="text-6xl font-bold text-neon-red mb-2"
          style={{ textShadow: '0 0 20px rgba(255,0,64,0.8)' }}
        >
          [CRÍTICO]
        </div>
        <div className="text-neon-amber text-xs tracking-[0.4em] uppercase mb-8">
          // FALLO DEL SISTEMA //
        </div>
        <div className="border border-neon-red/30 bg-military-panel p-6 mb-8 text-left">
          <p className="text-neon-red/70 text-xs mb-3">&gt; INFORME DE ERROR</p>
          <p className="text-matrix-green text-sm mb-2">
            <span className="text-neon-red">[EXCEPTION]</span> Se produjo un error inesperado en el sistema.
          </p>
          <p className="text-matrix-green/60 text-xs leading-relaxed">
            El equipo de operaciones ha sido notificado. Puedes intentar reiniciar el módulo
            o volver al dashboard principal.
          </p>
          {error.digest && (
            <p className="mt-3 text-matrix-green/30 text-[10px]">
              REF: {error.digest}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 border border-matrix-green text-matrix-green text-xs font-bold tracking-widest uppercase hover:bg-matrix-green hover:text-military-dark transition-all duration-150"
            style={{ boxShadow: '0 0 8px rgba(0,255,65,0.3)' }}
          >
            [↺] REINTENTAR
          </button>
          <a
            href="/play"
            className="px-6 py-3 border border-matrix-green/30 text-matrix-green/60 text-xs font-bold tracking-widest uppercase hover:border-matrix-green hover:text-matrix-green transition-all duration-150"
          >
            [&gt;] DASHBOARD
          </a>
        </div>
      </div>
    </div>
  );
}
