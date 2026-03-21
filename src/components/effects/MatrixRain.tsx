"use client";

import { useEffect, useRef } from "react";

interface MatrixRainProps {
  speed?: number;
  density?: number;
  opacity?: number;
  className?: string;
}

const CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
  "0123456789ABCDEF<>[]{}|\\!@#$%^&*()-_=+";

export default function MatrixRain({
  speed = 50,
  density = 0.975,
  opacity = 0.85,
  className = "",
}: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fontSize = 14;
    let animFrameId: number;
    let columns: number[] = [];
    let brightnessMap: number[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const cols = Math.floor(canvas.width / fontSize);
      columns = Array.from({ length: cols }, () =>
        Math.floor((Math.random() * canvas.height) / fontSize)
      );
      brightnessMap = Array.from({ length: cols }, () => Math.random());
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let lastTime = 0;

    function draw(timestamp: number) {
      if (!canvas || !ctx) return;

      if (timestamp - lastTime < speed) {
        animFrameId = requestAnimationFrame(draw);
        return;
      }
      lastTime = timestamp;

      ctx.fillStyle = `rgba(10, 14, 10, ${1 - opacity * 0.15})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < columns.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = columns[i] * fontSize;

        const brightness = brightnessMap[i];
        if (brightness > 0.97) {
          ctx.fillStyle = `rgba(200, 255, 200, 0.95)`;
        } else if (brightness > 0.85) {
          ctx.fillStyle = `rgba(0, 255, 65, 0.9)`;
        } else if (brightness > 0.5) {
          ctx.fillStyle = `rgba(0, 200, 40, 0.7)`;
        } else {
          ctx.fillStyle = `rgba(0, 120, 20, 0.4)`;
        }

        ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
        ctx.fillText(char, x, y);

        if (y > canvas.height && Math.random() > density) {
          columns[i] = 0;
          brightnessMap[i] = Math.random();
        } else {
          columns[i]++;
        }

        if (Math.random() > 0.99) {
          brightnessMap[i] = Math.random();
        }
      }

      animFrameId = requestAnimationFrame(draw);
    }

    animFrameId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
    };
  }, [speed, density, opacity]);

  return (
    <canvas
      ref={canvasRef}
      className={`block w-full h-full ${className}`}
      aria-hidden="true"
    />
  );
}
