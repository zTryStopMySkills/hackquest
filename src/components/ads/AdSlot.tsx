'use client';

import { useState, useEffect } from 'react';
import EthicalAd from './EthicalAd';
import CarbonAd from './CarbonAd';

// Carbon Ads tiene prioridad cuando esté aprobado (mayor CPM)
// Mientras tanto, EthicalAds es el activo
const HAS_CARBON  = !!process.env.NEXT_PUBLIC_CARBON_SERVE_ID;
const HAS_ETHICAL = !!process.env.NEXT_PUBLIC_ETHICALADS_PUBLISHER;
const HAS_AD      = HAS_CARBON || HAS_ETHICAL;

type AdSlotVariant = 'sidebar' | 'banner' | 'inline';

interface AdSlotProps {
  isPremium?: boolean;
  variant?: AdSlotVariant;
  className?: string;
}

export default function AdSlot({ isPremium = false, variant = 'sidebar', className }: AdSlotProps) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (isPremium || !HAS_AD) return;
    fetch('https://media.ethicalads.io/media/client/ethicalads.min.js', {
      method: 'HEAD',
      mode: 'no-cors',
    }).catch(() => setBlocked(true));
  }, [isPremium]);

  if (isPremium) return null;
  if (!HAS_AD) return <AdPlaceholder variant={variant} className={className} />;

  return (
    <div className={className}>
      <p className="text-matrix-green/20 text-[9px] font-mono tracking-[0.3em] uppercase mb-1.5 px-1">
        // SPONSOR //
      </p>

      <div
        className="rounded-sm overflow-hidden border border-military-border/60"
        style={{ backgroundColor: 'rgba(13,17,23,0.8)' }}
      >
        {HAS_CARBON ? (
          // Carbon Ads — activo cuando NEXT_PUBLIC_CARBON_SERVE_ID esté configurado
          <CarbonAd className="carbon-ad-wrapper" />
        ) : (
          // EthicalAds — activo ahora mientras esperamos aprobación de Carbon
          <EthicalAd
            type={variant === 'sidebar' ? 'text' : 'image'}
            theme="dark"
            keywords="security,hacking,ctf,cybersecurity,programming,devtools"
          />
        )}
      </div>

      {blocked && <AdBlockedNotice />}
    </div>
  );
}

function AdPlaceholder({ variant, className }: { variant: AdSlotVariant; className?: string }) {
  return (
    <div className={className}>
      <p className="text-matrix-green/20 text-[9px] font-mono tracking-[0.3em] uppercase mb-1.5 px-1">
        // SPONSOR //
      </p>
      <div
        className="border border-dashed border-military-border/40 rounded-sm flex flex-col items-center justify-center gap-1.5 text-center"
        style={{ minHeight: variant === 'sidebar' ? 80 : 100, backgroundColor: 'rgba(0,255,65,0.02)' }}
      >
        <p className="text-matrix-green/20 text-[10px] font-mono">[AD SLOT]</p>
        <p className="text-matrix-green/15 text-[9px] font-mono leading-relaxed px-3">
          EthicalAds: NEXT_PUBLIC_ETHICALADS_PUBLISHER<br />
          Carbon Ads: NEXT_PUBLIC_CARBON_SERVE_ID
        </p>
      </div>
    </div>
  );
}

function AdBlockedNotice() {
  return (
    <div
      className="mt-1 border border-military-border/40 rounded-sm px-3 py-2 text-center"
      style={{ backgroundColor: 'rgba(255,184,0,0.03)' }}
    >
      <p className="text-neon-amber/50 text-[9px] font-mono leading-relaxed">
        &gt; Apoya HackQuest con{' '}
        <a href="/premium" className="text-neon-amber/70 hover:text-neon-amber underline transition-colors">
          Premium
        </a>
      </p>
    </div>
  );
}
