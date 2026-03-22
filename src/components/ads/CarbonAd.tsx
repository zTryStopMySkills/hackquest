'use client';

import { useEffect, useRef } from 'react';

// Sign up at https://www.carbonads.net/ to get your CARBON_SERVE_ID
// Set NEXT_PUBLIC_CARBON_SERVE_ID in .env.local
const SERVE_ID = process.env.NEXT_PUBLIC_CARBON_SERVE_ID ?? '';
const PLACEMENT = process.env.NEXT_PUBLIC_CARBON_PLACEMENT ?? 'hackquest';

interface CarbonAdProps {
  className?: string;
}

export default function CarbonAd({ className }: CarbonAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!SERVE_ID || loadedRef.current || !containerRef.current) return;
    loadedRef.current = true;

    // Remove any previous Carbon script to avoid duplicates on HMR
    const existing = document.getElementById('_carbonads_js');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = '_carbonads_js';
    script.async = true;
    script.src = `//cdn.carbonads.com/carbon.js?serve=${SERVE_ID}&placement=${PLACEMENT}`;
    script.type = 'text/javascript';
    containerRef.current.appendChild(script);
  }, []);

  if (!SERVE_ID) return null;

  return (
    <div ref={containerRef} className={className} />
  );
}
