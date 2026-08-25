'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: 'cyan' | 'azure' | 'cobalt' | 'violet' | 'emerald' | 'amber' | 'crimson' | 'spectral' | 'none';
  accent?: 'emerald' | 'violet' | 'cyan' | 'amber' | 'rose' | 'spectral' | 'none';
  elevated?: boolean;
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-7',
};

const glowMap = {
  none:     '',
  spectral: 'hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.22),_0_16px_40px_rgba(0,0,0,0.6)]',
  cyan:     'hover:border-cyan-400/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.25),_0_16px_40px_rgba(0,0,0,0.6)]',
  azure:    'hover:border-sky-400/60 hover:shadow-[0_0_30px_rgba(56,189,248,0.25),_0_16px_40px_rgba(0,0,0,0.6)]',
  cobalt:   'hover:border-indigo-400/60 hover:shadow-[0_0_30px_rgba(99,102,241,0.25),_0_16px_40px_rgba(0,0,0,0.6)]',
  violet:   'hover:border-violet-400/60 hover:shadow-[0_0_30px_rgba(139,92,246,0.25),_0_16px_40px_rgba(0,0,0,0.6)]',
  emerald:  'hover:border-emerald-400/60 hover:shadow-[0_0_30px_rgba(16,185,129,0.25),_0_16px_40px_rgba(0,0,0,0.6)]',
  amber:    'hover:border-amber-400/60 hover:shadow-[0_0_30px_rgba(245,158,11,0.25),_0_16px_40px_rgba(0,0,0,0.6)]',
  crimson:  'hover:border-rose-400/60 hover:shadow-[0_0_30px_rgba(244,63,94,0.28),_0_16px_40px_rgba(0,0,0,0.6)]',
};

const topAccentMap = {
  none:     '',
  spectral: 'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2.5px] before:bg-gradient-to-r before:from-indigo-500 before:via-cyan-400 before:to-pink-500 before:z-10 before:shadow-[0_0_12px_rgba(6,182,212,0.8)]',
  emerald:  'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2.5px] before:bg-gradient-to-r before:from-emerald-400 before:to-cyan-400 before:z-10 before:shadow-[0_0_12px_rgba(16,185,129,0.8)]',
  violet:   'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2.5px] before:bg-gradient-to-r before:from-violet-500 before:to-indigo-500 before:z-10 before:shadow-[0_0_12px_rgba(139,92,246,0.8)]',
  cyan:     'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2.5px] before:bg-gradient-to-r before:from-cyan-400 before:to-sky-400 before:z-10 before:shadow-[0_0_12px_rgba(6,182,212,0.8)]',
  amber:    'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2.5px] before:bg-gradient-to-r before:from-amber-400 before:to-orange-500 before:z-10 before:shadow-[0_0_12px_rgba(245,158,11,0.8)]',
  rose:     'before:absolute before:top-0 before:left-0 before:right-0 before:h-[2.5px] before:bg-gradient-to-r before:from-rose-500 before:to-pink-500 before:z-10 before:shadow-[0_0_12px_rgba(244,63,94,0.8)]',
};

export function GlassCard({
  children,
  className,
  padding = 'md',
  hover = false,
  glow = 'spectral',
  accent = 'none',
  elevated = false,
  onClick,
  ...props
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [shine, setShine] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hover || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setShine({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    if (!hover) return;
    setShine((s) => ({ ...s, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={cn(
        elevated ? 'glass-panel-elevated' : 'glass-panel',
        'relative overflow-hidden',
        topAccentMap[accent],
        paddingMap[padding],
        hover && cn(
          'cursor-pointer transition-all duration-300 ease-out',
          'hover:-translate-y-0.5 hover:bg-[var(--glass-surface-hover)]',
          glow !== 'none' ? glowMap[glow] : '',
        ),
        onClick && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {/* Specular Light Sheen on Hover */}
      {hover && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-0"
          style={{
            opacity: shine.opacity * 0.45,
            background: `radial-gradient(circle 320px at ${shine.x}% ${shine.y}%, rgba(255, 255, 255, 0.09), rgba(99, 102, 241, 0.04) 50%, transparent 80%)`,
          }}
        />
      )}
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
}