export default function GameLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center font-mono">
        <div
          className="text-matrix-green text-2xl font-bold mb-3 animate-pulse"
          style={{ textShadow: '0 0 10px rgba(0,255,65,0.8)' }}
        >
          [...]
        </div>
        <p className="text-matrix-green/40 text-xs tracking-[0.3em] uppercase">
          Cargando datos clasificados
        </p>
      </div>
    </div>
  );
}
