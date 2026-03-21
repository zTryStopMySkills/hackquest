'use client';

import { useState, useEffect, useCallback } from 'react';
import Terminal from '@/components/terminal/Terminal';

interface ChallengePhase {
  name: string;
  description: string;
  expectedCommands: string[];
  hints: string[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  briefing: string;
  debriefing: string;
  branch: string;
  difficulty: string;
  timeLimitSeconds: number;
  basePoints: number;
  phases: ChallengePhase[];
  hints: { level1: string; level2: string; level3: string };
  flag: string;
}

interface ChallengeViewProps {
  challenge: Challenge;
  onComplete: (result: {
    solved: boolean;
    timeSpent: number;
    hintsUsed: number;
    commandLog: string[];
    isPerfect: boolean;
  }) => void;
  difficulty?: 'HARD' | 'MEDIUM' | 'EXPERT';
}

export default function ChallengeView({
  challenge,
  onComplete,
  difficulty = 'MEDIUM',
}: ChallengeViewProps) {
  const [phase, setPhase] = useState<'briefing' | 'playing' | 'debriefing'>('briefing');
  const [currentPhaseIdx, setCurrentPhaseIdx] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [commandLog, setCommandLog] = useState<string[]>([]);
  const [showHint, setShowHint] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    if (phase !== 'playing') return;
    const timer = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (difficulty === 'EXPERT' && timeElapsed >= challenge.timeLimitSeconds && phase === 'playing') {
      onComplete({
        solved: false,
        timeSpent: timeElapsed,
        hintsUsed,
        commandLog,
        isPerfect: false,
      });
    }
  }, [timeElapsed, difficulty, challenge.timeLimitSeconds, phase, onComplete, hintsUsed, commandLog]);

  const checkStuck = useCallback(() => {
    if (difficulty === 'EXPERT') return;

    const recentCommands = commandLog.slice(-5);
    const uniqueCommands = new Set(recentCommands);
    const isRepeating = recentCommands.length >= 3 && uniqueCommands.size <= 2;

    if (attempts >= 5 || isRepeating) {
      setIsStuck(true);
    }
  }, [commandLog, attempts, difficulty]);

  const handleCommand = async (command: string): Promise<string> => {
    setCommandLog((prev) => [...prev, command]);

    const currentPhase = challenge.phases[currentPhaseIdx];

    if (command.toLowerCase().includes('flag{') || command.toLowerCase().includes('submit')) {
      const flagMatch = command.match(/flag\{[^}]+\}/i) || command.match(/submit\s+(.+)/i);
      const submittedFlag = flagMatch ? (flagMatch[0] || flagMatch[1]) : command;

      if (submittedFlag === challenge.flag) {
        setSolved(true);
        setPhase('debriefing');
        onComplete({
          solved: true,
          timeSpent: timeElapsed,
          hintsUsed,
          commandLog: [...commandLog, command],
          isPerfect: hintsUsed === 0,
        });
        return `SUCCESS: ¡Flag correcta! Misión completada.\n\n> Tiempo: ${formatTime(timeElapsed)}\n> Pistas usadas: ${hintsUsed}\n> ${hintsUsed === 0 ? '⚡ ¡RESOLUCIÓN PERFECTA!' : ''}`;
      } else {
        setAttempts((a) => a + 1);
        checkStuck();
        return 'ERROR: Flag incorrecta. Acceso denegado.';
      }
    }

    if (!currentPhase) {
      return 'INFO: Todas las fases completadas. Envía la flag con: submit FLAG{...}';
    }

    const isExpected = currentPhase.expectedCommands.some((pattern) => {
      const regex = new RegExp(pattern, 'i');
      return regex.test(command);
    });

    if (isExpected) {
      const nextPhase = currentPhaseIdx + 1;
      if (nextPhase < challenge.phases.length) {
        setCurrentPhaseIdx(nextPhase);
        return `SUCCESS: Fase "${currentPhase.name}" completada.\n\nINFO: Siguiente fase: ${challenge.phases[nextPhase].name}\n${challenge.phases[nextPhase].description}`;
      } else {
        return `SUCCESS: ¡Todas las fases completadas!\n\nINFO: Ahora encuentra y envía la flag.`;
      }
    }

    if (command === 'help') {
      return `Comandos disponibles:\n  help        - Muestra esta ayuda\n  status      - Estado de la misión\n  phases      - Fases de la misión\n  hint        - Solicitar pista (coste en puntos)\n  submit FLAG - Enviar flag\n\nFase actual: ${currentPhase.name}\n${currentPhase.description}`;
    }

    if (command === 'status') {
      return `Misión: ${challenge.title}\nFase: ${currentPhaseIdx + 1}/${challenge.phases.length} - ${currentPhase.name}\nTiempo: ${formatTime(timeElapsed)} / ${formatTime(challenge.timeLimitSeconds)}\nPistas usadas: ${hintsUsed}/3\nIntentos: ${attempts}`;
    }

    if (command === 'phases') {
      return challenge.phases.map((p, i) => {
        const status = i < currentPhaseIdx ? '✅' : i === currentPhaseIdx ? '🔄' : '🔒';
        return `${status} Fase ${i + 1}: ${p.name}`;
      }).join('\n');
    }

    if (command === 'hint') {
      if (difficulty === 'EXPERT') {
        return 'ERROR: Las pistas no están disponibles en modo Experto.';
      }
      if (hintsUsed >= 3 && difficulty !== 'HARD') {
        return 'ERROR: Has agotado todas las pistas disponibles.';
      }
      const nextHint = hintsUsed + 1;
      const hintKey = `level${nextHint}` as keyof typeof challenge.hints;
      const hint = challenge.hints[hintKey];
      if (hint) {
        setHintsUsed(nextHint);
        const costs = { 1: '10%', 2: '25%', 3: '38%' };
        return `INFO: 💡 Pista ${nextHint} (coste: -${costs[nextHint as 1 | 2 | 3]} puntos)\n\n${hint}`;
      }
      return 'ERROR: No hay más pistas disponibles.';
    }

    setAttempts((a) => a + 1);
    checkStuck();

    return simulateCommand(command);
  };

  const requestTip = () => {
    if (difficulty === 'EXPERT') return;
    const currentPhase = challenge.phases[currentPhaseIdx];
    if (currentPhase && tipIndex < currentPhase.hints.length) {
      setShowHint(currentPhase.hints[tipIndex]);
      setTipIndex((i) => i + 1);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timePercent = (timeElapsed / challenge.timeLimitSeconds) * 100;

  if (phase === 'briefing') {
    return (
      <div className="panel-classified p-6 max-w-4xl mx-auto">
        <div className="classified-header mb-4">BRIEFING CLASIFICADO</div>
        <h2 className="text-2xl font-display text-matrix-green glow-text mb-2">
          {challenge.title}
        </h2>
        <div className="text-neon-amber text-xs tracking-wider mb-4">
          Nivel de amenaza: {challenge.difficulty} | Rama: {challenge.branch} | Tiempo: {formatTime(challenge.timeLimitSeconds)}
        </div>
        <div className="border border-military-border p-4 mb-6 text-matrix-green/80 leading-relaxed whitespace-pre-line">
          {challenge.briefing}
        </div>
        <div className="mb-4">
          <span className="text-matrix-green/60 text-sm">Fases requeridas:</span>
          <div className="flex gap-3 mt-2">
            {challenge.phases.map((p, i) => (
              <span key={i} className="border border-military-border px-3 py-1 text-xs text-matrix-green/70">
                [{i + 1}] {p.name}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setPhase('playing')}
          className="btn-hack text-lg px-8 py-3"
        >
          [ ACEPTAR MISIÓN ]
        </button>
      </div>
    );
  }

  if (phase === 'debriefing' && solved) {
    return (
      <div className="panel-classified p-6 max-w-4xl mx-auto">
        <div className="classified-header mb-4">DEBRIEFING — MISIÓN COMPLETADA</div>
        <h2 className="text-2xl font-display text-matrix-green glow-text mb-2">
          ✅ {challenge.title}
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="panel p-3 text-center">
            <div className="text-matrix-green/60 text-xs">Tiempo</div>
            <div className="text-lg glow-text">{formatTime(timeElapsed)}</div>
          </div>
          <div className="panel p-3 text-center">
            <div className="text-matrix-green/60 text-xs">Pistas</div>
            <div className="text-lg glow-text">{hintsUsed}/3</div>
          </div>
          <div className="panel p-3 text-center">
            <div className="text-matrix-green/60 text-xs">Estado</div>
            <div className="text-lg glow-text">{hintsUsed === 0 ? '⚡ PERFECTO' : '✅ COMPLETADO'}</div>
          </div>
        </div>
        <div className="border border-military-border p-4 mb-6 text-matrix-green/80 leading-relaxed whitespace-pre-line">
          {challenge.debriefing}
        </div>
        <div className="text-neon-cyan text-sm mb-4">
          📄 Nueva técnica desbloqueada en tu Pokédex
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <span className="classified-header">MISIÓN EN CURSO</span>
          <h3 className="text-lg text-matrix-green">{challenge.title}</h3>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-matrix-green/60">
            Fase {currentPhaseIdx + 1}/{challenge.phases.length}
          </span>
          <span className={`text-sm font-mono ${timePercent > 80 ? 'text-neon-red animate-pulse' : 'text-matrix-green'}`}>
            ⏱ {formatTime(challenge.timeLimitSeconds - timeElapsed)}
          </span>
        </div>
      </div>

      <div className="w-full h-1 bg-military-border mb-4 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${timePercent > 80 ? 'bg-neon-red' : timePercent > 50 ? 'bg-neon-amber' : 'bg-matrix-green'}`}
          style={{ width: `${Math.min(100, timePercent)}%` }}
        />
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3">
          <Terminal
            onCommand={handleCommand}
            initialLines={[
              `[HACKQUEST] Misión: ${challenge.title}`,
              `[HACKQUEST] Fase 1: ${challenge.phases[0]?.name || 'Inicio'}`,
              `[HACKQUEST] ${challenge.phases[0]?.description || ''}`,
              `[HACKQUEST] Escribe 'help' para ver los comandos disponibles.`,
              '',
            ]}
            height="500px"
          />
        </div>

        <div className="space-y-3">
          <div className="panel p-3">
            <div className="text-xs text-matrix-green/60 mb-2">FASES</div>
            {challenge.phases.map((p, i) => (
              <div key={i} className={`text-xs py-1 ${i === currentPhaseIdx ? 'text-matrix-green glow-text' : i < currentPhaseIdx ? 'text-matrix-green/40' : 'text-matrix-green/20'}`}>
                {i < currentPhaseIdx ? '✅' : i === currentPhaseIdx ? '▶' : '○'} {p.name}
              </div>
            ))}
          </div>

          <div className="panel p-3">
            <div className="text-xs text-matrix-green/60 mb-2">STATS</div>
            <div className="text-xs space-y-1">
              <div>Tiempo: {formatTime(timeElapsed)}</div>
              <div>Pistas: {hintsUsed}/3</div>
              <div>Intentos: {attempts}</div>
              <div>Comandos: {commandLog.length}</div>
            </div>
          </div>

          {difficulty !== 'EXPERT' && (
            <button
              onClick={requestTip}
              className="btn-hack w-full text-xs py-2"
              disabled={difficulty === 'MEDIUM' && hintsUsed >= 3}
            >
              💡 PEDIR PISTA
            </button>
          )}

          {isStuck && difficulty !== 'EXPERT' && (
            <div className="panel p-3 border-neon-amber/50">
              <div className="text-neon-amber text-xs mb-1">⚠ AYUDA</div>
              <div className="text-xs text-matrix-green/70">
                {showHint || 'Parece que estás atascado. Usa el botón de pista o escribe "hint" en la terminal.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function simulateCommand(command: string): string {
  const cmd = command.toLowerCase().trim();

  if (cmd.startsWith('nmap')) {
    return `Starting Nmap scan...\n\nPORT     STATE  SERVICE     VERSION\n22/tcp   open   ssh         OpenSSH 8.2\n80/tcp   open   http        Apache 2.4.41\n3306/tcp open   mysql       MySQL 5.7.30\n8080/tcp open   http-proxy  Nginx\n\nNmap done: 1 IP address (1 host up)`;
  }

  if (cmd.startsWith('curl') || cmd.startsWith('wget')) {
    return `HTTP/1.1 200 OK\nContent-Type: text/html\nServer: Apache/2.4.41\n\n<!DOCTYPE html>\n<html>\n<head><title>Panel de Control</title></head>\n<body>\n  <form action="/search" method="GET">\n    <input name="q" placeholder="Buscar...">\n  </form>\n</body>\n</html>`;
  }

  if (cmd.startsWith('sqlmap')) {
    return `[INFO] testing connection to target URL\n[INFO] target URL appears to be vulnerable\n[INFO] parameter 'q' is vulnerable to SQL injection\n[INFO] the back-end DBMS is MySQL\n[INFO] fetching database names\navailable databases:\n[*] information_schema\n[*] hackquest_db\n[*] users_data`;
  }

  if (cmd.startsWith('gobuster') || cmd.startsWith('dirb')) {
    return `/admin          (Status: 403)\n/api            (Status: 200)\n/api/users      (Status: 200)\n/api/search     (Status: 200)\n/backup         (Status: 200)\n/login          (Status: 200)\n/uploads        (Status: 301)`;
  }

  if (cmd === 'whoami') return 'www-data';
  if (cmd === 'id') return 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
  if (cmd === 'pwd') return '/var/www/html';
  if (cmd === 'uname -a') return 'Linux target 5.4.0-42-generic #46-Ubuntu SMP x86_64 GNU/Linux';

  if (cmd.startsWith('cat ')) {
    return `# Archivo de configuración\nDB_HOST=localhost\nDB_USER=admin\nDB_PASS=hackquest123\nDB_NAME=hackquest_db`;
  }

  if (cmd === 'ls' || cmd === 'ls -la') {
    return `total 48\ndrwxr-xr-x  5 www-data www-data 4096 Mar 21 10:00 .\n-rw-r--r--  1 www-data www-data  892 Mar 21 10:00 index.php\n-rw-r--r--  1 www-data www-data  456 Mar 21 10:00 config.php\ndrwxr-xr-x  2 www-data www-data 4096 Mar 21 10:00 api/\ndrwxr-xr-x  2 www-data www-data 4096 Mar 21 10:00 uploads/\n-rw-r--r--  1 root     root     1234 Mar 21 10:00 .htaccess`;
  }

  if (cmd.startsWith('hydra') || cmd.startsWith('john')) {
    return `[INFO] Probando credenciales...\n[ATTEMPT] target 10.0.0.5 - login "admin" - pass "admin" - 1 of 100\n[ATTEMPT] target 10.0.0.5 - login "admin" - pass "password" - 2 of 100\n[80][http-post-form] host: 10.0.0.5   login: admin   password: admin123\n[STATUS] attack completed, 1 valid password found`;
  }

  if (cmd.startsWith('netcat') || cmd.startsWith('nc ')) {
    return `Connection established.\nListening on port 4444...`;
  }

  return `bash: ${cmd.split(' ')[0]}: resultado de simulación.\nEscribe 'help' para ver los comandos disponibles.`;
}
