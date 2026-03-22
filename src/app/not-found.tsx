import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-military-dark flex items-center justify-center font-mono">
      <div className="text-center max-w-lg px-6">
        <div
          className="text-8xl font-bold text-matrix-green mb-2"
          style={{ textShadow: '0 0 30px rgba(0,255,65,0.8), 0 0 60px rgba(0,255,65,0.4)' }}
        >
          404
        </div>
        <div className="text-neon-amber text-xs tracking-[0.4em] uppercase mb-8">
          // SECTOR NO ENCONTRADO //
        </div>
        <div className="border border-military-border bg-military-panel p-6 mb-8 text-left">
          <p className="text-matrix-green/50 text-xs mb-3">&gt; DIAGNÓSTICO DE RUTA</p>
          <p className="text-matrix-green text-sm mb-2">
            <span className="text-neon-red">[ERROR]</span> La dirección solicitada no existe en el sistema.
          </p>
          <p className="text-matrix-green/60 text-xs leading-relaxed">
            Es posible que el sector haya sido reclasificado, eliminado o que
            la dirección contenga un error. Verifica el acceso y vuelve a intentarlo.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/play"
            className="px-6 py-3 border border-matrix-green text-matrix-green text-xs font-bold tracking-widest uppercase hover:bg-matrix-green hover:text-military-dark transition-all duration-150"
            style={{ boxShadow: '0 0 8px rgba(0,255,65,0.3)' }}
          >
            [&gt;] VOLVER AL DASHBOARD
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-matrix-green/30 text-matrix-green/60 text-xs font-bold tracking-widest uppercase hover:border-matrix-green hover:text-matrix-green transition-all duration-150"
          >
            [~] INICIO
          </Link>
        </div>
        <p className="mt-8 text-matrix-green/15 text-[10px] tracking-widest">
          HACKQUEST // SISTEMA v2.4.1 // ACTIVO
        </p>
      </div>
    </div>
  );
}
