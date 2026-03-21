'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface TerminalProps {
  onCommand?: (command: string) => Promise<string>;
  initialLines?: string[];
  prompt?: string;
  readOnly?: boolean;
  className?: string;
  height?: string;
}

interface TerminalLine {
  id: number;
  content: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
}

export default function Terminal({
  onCommand,
  initialLines = [],
  prompt = '$ ',
  readOnly = false,
  className = '',
  height = '400px',
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>(
    initialLines.map((content, i) => ({ id: i, content, type: 'output' }))
  );
  const [currentInput, setCurrentInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineCounter = useRef(initialLines.length);

  const addLine = useCallback((content: string, type: TerminalLine['type'] = 'output') => {
    const id = lineCounter.current++;
    setLines((prev) => [...prev, { id, content, type }]);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [lines, scrollToBottom]);

  const handleSubmit = async () => {
    if (!currentInput.trim() || isProcessing) return;

    const command = currentInput.trim();
    addLine(`${prompt}${command}`, 'input');
    setHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);
    setCurrentInput('');
    setIsProcessing(true);

    if (onCommand) {
      try {
        const result = await onCommand(command);
        if (result) {
          result.split('\n').forEach((line) => {
            if (line.startsWith('ERROR:')) {
              addLine(line, 'error');
            } else if (line.startsWith('SUCCESS:')) {
              addLine(line.replace('SUCCESS:', ''), 'success');
            } else if (line.startsWith('INFO:')) {
              addLine(line.replace('INFO:', ''), 'info');
            } else {
              addLine(line);
            }
          });
        }
      } catch {
        addLine('Error: comando no reconocido', 'error');
      }
    }

    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(history[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= history.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(history[newIndex]);
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const focusInput = () => {
    if (!readOnly) inputRef.current?.focus();
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-[#00FF41]';
      case 'error': return 'text-[#FF0040]';
      case 'success': return 'text-[#00FF41] font-bold';
      case 'info': return 'text-[#00FFFF]';
      default: return 'text-[#00FF41]/80';
    }
  };

  return (
    <div
      className={`bg-[#0a0a0a] border border-[#1a2a1a] rounded-sm font-mono text-sm overflow-hidden ${className}`}
      onClick={focusInput}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0d1117] border-b border-[#1a2a1a]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF0040]/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFB800]/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF41]/80" />
        </div>
        <span className="text-[#00FF41]/50 text-xs tracking-wider">
          HACKQUEST TERMINAL v1.0
        </span>
      </div>

      <div
        ref={containerRef}
        className="p-3 overflow-y-auto"
        style={{ height }}
      >
        {lines.map((line) => (
          <div
            key={line.id}
            className={`terminal-line whitespace-pre-wrap break-all leading-6 ${getLineColor(line.type)}`}
          >
            {line.content}
          </div>
        ))}

        {!readOnly && (
          <div className="flex items-center leading-6">
            <span className="text-[#00FF41] mr-1">{prompt}</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-[#00FF41] outline-none border-none font-mono text-sm caret-[#00FF41]"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              disabled={isProcessing}
            />
            {isProcessing && (
              <span className="text-[#FFB800] animate-pulse ml-2">procesando...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
