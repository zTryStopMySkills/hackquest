"use client";

import { useEffect, useRef, useState } from "react";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  color?: string;
  glowColor?: string;
  height?: "xs" | "sm" | "md" | "lg";
  animated?: boolean;
}

const heightClasses = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercent = false,
  color = "#00FF41",
  glowColor,
  height = "md",
  animated = true,
}: ProgressBarProps) {
  const [displayWidth, setDisplayWidth] = useState(0);
  const hasAnimated = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const resolvedGlow = glowColor ?? color;

  useEffect(() => {
    if (!animated) {
      setDisplayWidth(percent);
      return;
    }

    if (hasAnimated.current) {
      setDisplayWidth(percent);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          requestAnimationFrame(() => {
            setDisplayWidth(percent);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [percent, animated]);

  return (
    <div ref={containerRef} className="flex flex-col gap-1 w-full">
      {(label || showPercent) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-mono uppercase tracking-wider text-matrix-green/70">
              {label}
            </span>
          )}
          {showPercent && (
            <span
              className="text-xs font-mono font-bold tabular-nums"
              style={{ color, textShadow: `0 0 4px ${resolvedGlow}` }}
            >
              {Math.round(percent)}%
            </span>
          )}
        </div>
      )}

      <div
        className={`relative w-full ${heightClasses[height]} bg-military-border rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${displayWidth}%`,
            backgroundColor: color,
            boxShadow: `0 0 8px ${resolvedGlow}, 0 0 2px ${resolvedGlow}`,
            transition: animated ? "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)" : "none",
          }}
        />

        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
