'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type GlowVariant = 
  | 'cyan' | 'violet' | 'pink' | 'emerald' | 'amber' | 'rose' | 'spectral'
  | 'teal' | 'blue' | 'ok' | 'warn' | 'critical' | 'crimson' | 'none';

export type AccentVariant = 
  | 'cyan' | 'violet' | 'pink' | 'emerald' | 'amber' | 'rose' | 'spectral'
  | 'teal' | 'blue' | 'ok' | 'warn' | 'critical' | 'none';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glow?: GlowVariant;
  accent?: AccentVariant;
  elevated?: boolean;
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-7',
};

const glowMap: Record<GlowVariant, string> = {
  none:     '',
  cyan:     'hover:border-cyan-400 hover:shadow-[0_0_24px_rgba(0,240,255,0.4),inset_0_0_12px_rgba(0,240,255,0.1)]',
  teal:     'hover:border-emerald-400 hover:shadow-[0_0_24px_rgba(0,230,176,0.4),inset_0_0_12px_rgba(0,230,176,0.1)]',
  blue:     'hover:border-sky-400 hover:shadow-[0_0_24px_rgba(56,189,248,0.4),inset_0_0_12px_rgba(56,189,248,0.1)]',
  violet:   'hover:border-violet-400 hover:shadow-[0_0_24px_rgba(139,92,246,0.4),inset_0_0_12px_rgba(139,92,246,0.1)]',
  pink:     'hover:border-pink-400 hover:shadow-[0_0_24px_rgba(236,72,153,0.4),inset_0_0_12px_rgba(236,72,153,0.1)]',
  spectral: 'hover:border-cyan-400 hover:shadow-[0_0_28px_rgba(0,240,255,0.35),0_0_16px_rgba(236,72,153,0.25)]',
  ok:       'hover:border-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.4),inset_0_0_12px_rgba(16,185,129,0.1)]',
  emerald:  'hover:border-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.4),inset_0_0_12px_rgba(16,185,129,0.1)]',
  warn:     'hover:border-amber-400 hover:shadow-[0_0_24px_rgba(245,158,11,0.4),inset_0_0_12px_rgba(245,158,11,0.1)]',
  amber:    'hover:border-amber-400 hover:shadow-[0_0_24px_rgba(245,158,11,0.4),inset_0_0_12px_rgba(245,158,11,0.1)]',
  critical: 'hover:border-rose-400 hover:shadow-[0_0_24px_rgba(244,63,94,0.4),inset_0_0_12px_rgba(244,63,94,0.1)]',
  crimson:  'hover:border-rose-400 hover:shadow-[0_0_24px_rgba(244,63,94,0.4),inset_0_0_12px_rgba(244,63,94,0.1)]',
  rose:     'hover:border-rose-400 hover:shadow-[0_0_24px_rgba(244,63,94,0.4),inset_0_0_12px_rgba(244,63,94,0.1)]',
};

// Continuous perimeter border wrap around all 4 rounded corners:
const accentMap: Record<AccentVariant, string> = {
  none:     '',
  cyan:     'border-cyan-500/40 shadow-[0_0_18px_rgba(0,240,255,0.15)] hover:border-cyan-400',
  teal:     'border-teal-500/40 shadow-[0_0_18px_rgba(20,184,166,0.15)] hover:border-teal-400',
  blue:     'border-sky-500/40 shadow-[0_0_18px_rgba(56,189,248,0.15)] hover:border-sky-400',
  violet:   'border-violet-500/40 shadow-[0_0_18px_rgba(139,92,246,0.15)] hover:border-violet-400',
  pink:     'border-pink-500/40 shadow-[0_0_18px_rgba(236,72,153,0.15)] hover:border-pink-400',
  spectral: 'border-cyan-400/50 shadow-[0_0_22px_rgba(0,240,255,0.2)] hover:border-cyan-400',
  ok:       'border-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.15)] hover:border-emerald-400',
  emerald:  'border-emerald-500/40 shadow-[0_0_18px_rgba(16,185,129,0.15)] hover:border-emerald-400',
  warn:     'border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.15)] hover:border-amber-400',
  amber:    'border-amber-500/40 shadow-[0_0_18px_rgba(245,158,11,0.15)] hover:border-amber-400',
  critical: 'border-rose-500/40 shadow-[0_0_18px_rgba(244,63,94,0.15)] hover:border-rose-400',
  rose:     'border-rose-500/40 shadow-[0_0_18px_rgba(244,63,94,0.15)] hover:border-rose-400',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    children,
    className,
    padding = 'md',
    hover = false,
    glow = 'cyan',
    accent = 'none',
    elevated = false,
    onClick,
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          elevated ? 'glass-panel-elevated' : 'glass-panel',
          paddingMap[padding],
          accent !== 'none' && accentMap[accent],
          hover && cn(
            'transition-all duration-150 ease-out',
            'hover:-translate-y-0.5 hover:scale-[1.012]',
            glow !== 'none' && glowMap[glow],
          ),
          onClick && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';