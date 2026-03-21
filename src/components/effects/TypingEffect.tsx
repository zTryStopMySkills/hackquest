"use client";

import { useEffect, useRef, useState } from "react";

interface TypingEffectProps {
  lines: string[];
  speed?: number;
  loop?: boolean;
  pauseBetweenLines?: number;
  className?: string;
}

interface DisplayedLine {
  text: string;
  complete: boolean;
}

export default function TypingEffect({
  lines,
  speed = 60,
  loop = false,
  pauseBetweenLines = 800,
  className = "",
}: TypingEffectProps) {
  const [displayedLines, setDisplayedLines] = useState<DisplayedLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayedLines([]);
    setCurrentLineIndex(0);
    setCurrentCharIndex(0);
    setIsWaiting(false);
    setIsDone(false);
  }, [lines]);

  useEffect(() => {
    if (isDone && !loop) return;

    if (isDone && loop) {
      timerRef.current = setTimeout(() => {
        setDisplayedLines([]);
        setCurrentLineIndex(0);
        setCurrentCharIndex(0);
        setIsWaiting(false);
        setIsDone(false);
      }, 2000);
      return;
    }

    if (currentLineIndex >= lines.length) {
      setIsDone(true);
      return;
    }

    if (isWaiting) return;

    const currentLine = lines[currentLineIndex];

    if (currentCharIndex === 0) {
      setDisplayedLines((prev) => [
        ...prev,
        { text: "", complete: false },
      ]);
    }

    if (currentCharIndex < currentLine.length) {
      timerRef.current = setTimeout(() => {
        setDisplayedLines((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            text: currentLine.slice(0, currentCharIndex + 1),
            complete: false,
          };
          return updated;
        });
        setCurrentCharIndex((c) => c + 1);
      }, speed + Math.random() * 30);
    } else {
      setDisplayedLines((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: currentLine,
          complete: true,
        };
        return updated;
      });

      setIsWaiting(true);
      timerRef.current = setTimeout(() => {
        setCurrentLineIndex((i) => i + 1);
        setCurrentCharIndex(0);
        setIsWaiting(false);
      }, pauseBetweenLines);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    currentLineIndex,
    currentCharIndex,
    isWaiting,
    isDone,
    lines,
    speed,
    loop,
    pauseBetweenLines,
  ]);

  const isCurrentlyTyping =
    !isDone &&
    !isWaiting &&
    currentLineIndex < lines.length &&
    currentCharIndex < lines[currentLineIndex]?.length;

  return (
    <div className={`font-mono text-sm ${className}`} aria-live="polite">
      {displayedLines.map((line, index) => (
        <div key={index} className="terminal-line flex items-start gap-2 leading-6">
          <span className="text-matrix-green/60 select-none shrink-0">$</span>
          <span className="text-matrix-green break-all">{line.text}</span>
          {index === displayedLines.length - 1 && isCurrentlyTyping && (
            <span className="typing-cursor text-matrix-green" aria-hidden="true" />
          )}
        </div>
      ))}
      {(isDone || (!isCurrentlyTyping && !isWaiting && displayedLines.length > 0)) &&
        !loop && (
          <div className="flex items-start gap-2 leading-6">
            <span className="text-matrix-green/60 select-none shrink-0">$</span>
            <span className="typing-cursor text-matrix-green" aria-hidden="true" />
          </div>
        )}
    </div>
  );
}
