'use client';

import { useEffect, useRef, useState } from 'react';

interface BannerHackerProps {
  variant: 'HACKER_MATRIX' | 'HACKER_GOLD' | 'THE_ONE_RED' | 'SECURITY_BLUE' | 'SECURITY_CYAN';
  width?: number;
  height?: number;
}

const KATAKANA = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾖﾌﾚﾔ';
const BINARY = '01';

export default function BannerHacker({ variant, width = 600, height = 200 }: BannerHackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glitchActive, setGlitchActive] = useState(false);

  const colors: Record<string, { primary: string; glow: string }> = {
    HACKER_MATRIX: { primary: '#00FF41', glow: 'rgba(0, 255, 65, 0.5)' },
    HACKER_GOLD: { primary: '#FFD700', glow: 'rgba(255, 215, 0, 0.5)' },
    THE_ONE_RED: { primary: '#FF0040', glow: 'rgba(255, 0, 64, 0.5)' },
    SECURITY_BLUE: { primary: '#2196F3', glow: 'rgba(33, 150, 243, 0.5)' },
    SECURITY_CYAN: { primary: '#00FFFF', glow: 'rgba(0, 255, 255, 0.5)' },
  };

  const { primary, glow } = colors[variant] || colors.HACKER_MATRIX;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const fontSize = 12;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = Array(columns).fill(0).map(() => Math.random() * height / fontSize);
    const speeds: number[] = Array(columns).fill(0).map(() => 0.5 + Math.random() * 1.5);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < columns; i++) {
        const chars = KATAKANA + BINARY;
        const char = chars[Math.floor(Math.random() * chars.length)];

        const opacity = 0.3 + Math.random() * 0.7;
        ctx.fillStyle = primary + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        ctx.shadowColor = glow;
        ctx.shadowBlur = 3;

        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        ctx.shadowBlur = 0;

        if (drops[i] * fontSize > height && Math.random() > 0.98) {
          drops[i] = 0;
        }
        drops[i] += speeds[i] * 0.3;
      }
    };

    const interval = setInterval(draw, 50);
    return () => clearInterval(interval);
  }, [width, height, primary, glow]);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 300);
    }, 5000 + Math.random() * 3000);
    return () => clearInterval(glitchInterval);
  }, []);

  const isHacker = variant.startsWith('HACKER') || variant === 'THE_ONE_RED';
  const title = variant === 'THE_ONE_RED' ? 'THE ONE' : isHacker ? 'HACKER' : 'SECURITY';

  const codeLines = isHacker
    ? [
        '> access_granted: TRUE',
        '> clearance_level: MAXIMUM',
        '> mode: EXPERT // no_hints // no_mercy',
        '> protocol: GHOST_MODE',
      ]
    : [
        '> status: CAMPAIGN_COMPLETE',
        '> trained: TRUE',
        '> clearance: VERIFIED',
      ];

  return (
    <div className="relative overflow-hidden rounded-sm border" style={{ width, borderColor: primary + '40' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center p-6" style={{ minHeight: height }}>
        <div
          className={`text-3xl font-bold tracking-[0.3em] font-mono ${glitchActive ? 'glitch-text' : ''}`}
          style={{
            color: primary,
            textShadow: `0 0 10px ${glow}, 0 0 20px ${glow}, 0 0 40px ${glow}`,
          }}
        >
          {title}
        </div>

        <div className="mt-4 space-y-1 font-mono text-xs" style={{ color: primary + 'BB' }}>
          {codeLines.map((line, i) => (
            <div key={i} className="terminal-line">{line}</div>
          ))}
        </div>
      </div>

      {glitchActive && (
        <>
          <div
            className="absolute inset-0 z-20"
            style={{
              background: `${primary}08`,
              animation: 'glitch-clip-1 0.3s linear',
            }}
          />
          <div
            className="absolute inset-0 z-20"
            style={{
              background: `${primary}05`,
              animation: 'glitch-clip-2 0.3s linear',
            }}
          />
        </>
      )}
    </div>
  );
}
