"use client";

import { useEffect, useRef, useState } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchInterval?: number;
}

export default function GlitchText({
  text,
  className = "",
  glitchInterval,
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function scheduleGlitch() {
      const delay =
        glitchInterval !== undefined
          ? glitchInterval
          : 5000 + Math.random() * 3000;

      timeoutRef.current = setTimeout(() => {
        setIsGlitching(true);

        setTimeout(() => {
          setIsGlitching(false);
          scheduleGlitch();
        }, 400);
      }, delay);
    }

    scheduleGlitch();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [glitchInterval]);

  return (
    <span
      className={`relative inline-block ${className}`}
      data-text={text}
      aria-label={text}
    >
      <span
        className={`relative inline-block transition-none ${
          isGlitching ? "glitch-text" : ""
        }`}
      >
        {text}
      </span>

      {isGlitching && (
        <>
          <span
            className="absolute inset-0 pointer-events-none select-none"
            aria-hidden="true"
            style={{
              color: "#FF0040",
              animation: "glitch-clip-1 0.4s steps(1) forwards",
              left: "2px",
            }}
          >
            {text}
          </span>
          <span
            className="absolute inset-0 pointer-events-none select-none"
            aria-hidden="true"
            style={{
              color: "#00FFFF",
              animation: "glitch-clip-2 0.4s steps(1) forwards",
              left: "-2px",
            }}
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
