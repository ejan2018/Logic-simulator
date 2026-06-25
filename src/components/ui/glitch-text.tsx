'use client';
import { useEffect, useState } from 'react';

export function GlitchText({ text, className = '', alwaysOn = true }: { text: string; className?: string; alwaysOn?: boolean }) {
  const [glitching, setGlitching] = useState(true);
  useEffect(() => {
    if (!alwaysOn) return;
    const interval = setInterval(() => { setGlitching(true); setTimeout(() => setGlitching(false), 80 + Math.random() * 120); }, 1800 + Math.random() * 1500);
    return () => clearInterval(interval);
  }, [alwaysOn]);
  return (
    <span className={`relative inline-block font-bold ${className}`} style={{ fontFamily: 'ui-monospace, "SF Mono", "Cascadia Mono", Menlo, monospace', letterSpacing: '0.05em' }} data-text={text}>
      <span className="relative z-10">{text}</span>
      <span aria-hidden className="absolute inset-0 z-20 pointer-events-none" style={{ color:'#00f2fe', textShadow:'0 0 8px rgba(0,242,254,0.7)', transform: glitching ? 'translate(-2px,0)' : 'translate(0,0)', clipPath: glitching ? 'polygon(0 0,100% 0,100% 33%,0 33%,0 50%,100% 50%,100% 75%,0 75%,0 100%,100% 100%,100% 100%)' : 'none', opacity: glitching ? 1 : 0.4, transition:'opacity 0.1s ease, transform 0.1s ease', mixBlendMode:'screen' }}>{text}</span>
      <span aria-hidden className="absolute inset-0 z-30 pointer-events-none" style={{ color:'#ff0844', textShadow:'0 0 8px rgba(255,8,68,0.7)', transform: glitching ? 'translate(2px,0)' : 'translate(0,0)', clipPath: glitching ? 'polygon(0 25%,100% 25%,100% 30%,0 30%,0 60%,100% 60%,100% 65%,0 65%)' : 'none', opacity: glitching ? 1 : 0.4, transition:'opacity 0.1s ease, transform 0.1s ease', mixBlendMode:'screen' }}>{text}</span>
    </span>
  );
}
