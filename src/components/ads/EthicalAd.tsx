'use client';

import { useEffect, useRef } from 'react';

// Sign up at https://www.ethicalads.io/ to get your publisher ID
// Set NEXT_PUBLIC_ETHICALADS_PUBLISHER in .env.local
const PUBLISHER = process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER ?? '';

type AdType = 'image' | 'text' | 'text-and-image';
type AdTheme = 'dark' | 'light';

interface EthicalAdProps {
  type?: AdType;
  theme?: AdTheme;
  keywords?: string; // comma-separated, e.g. "security,hacking,ctf"
  className?: string;
}

// EthicalAds SDK augments window
declare global {
  interface Window {
    ethicalads?: {
      load: () => void;
    };
  }
}

export default function EthicalAd({
  type = 'image',
  theme = 'dark',
  keywords = 'security,hacking,ctf,cybersecurity',
  className,
}: EthicalAdProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!PUBLISHER || loadedRef.current) return;
    loadedRef.current = true;

    // If SDK already loaded, just trigger a new load
    if (window.ethicalads) {
      window.ethicalads.load();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://media.ethicalads.io/media/client/ethicalads.min.js';
    document.head.appendChild(script);
  }, []);

  if (!PUBLISHER) return null;

  return (
    <div
      ref={containerRef}
      data-ea-publisher={PUBLISHER}
      data-ea-type={type}
      data-ea-theme={theme}
      data-ea-keywords={keywords}
      className={className}
    />
  );
}
