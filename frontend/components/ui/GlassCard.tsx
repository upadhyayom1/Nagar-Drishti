'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type GlowVariant =
  | 'cyan' | 'violet' | 'pink' | 'emerald' | 'amber' | 'rose' | 'spectral'
  | 'teal' | 'blue' | 'ok' | 'warn' | 'critical' | 'crimson' | 'brand' | 'none';

export type AccentVariant =
  | 'cyan' | 'violet' | 'pink' | 'emerald' | 'amber' | 'rose' | 'spectral'
  | 'teal' | 'blue' | 'ok' | 'warn' | 'critical' | 'brand' | 'none';

export type CardVariant = 'default' | 'soft' | 'textured' | 'gradient' | 'hero';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?:  'none' | 'sm' | 'md' | 'lg';
  hover?:    boolean;
  glow?:     GlowVariant;
  accent?:   AccentVariant;
  elevated?: boolean;
  variant?:  CardVariant;
  hero?:     boolean;
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

const glowMap: Record<GlowVariant, string> = {
  none:     '',
  brand:    'hover:border-neutral-500',
  cyan:     'hover:border-neutral-500',
  teal:     'hover:border-neutral-500',
  blue:     'hover:border-neutral-500',
  violet:   'hover:border-neutral-500',
  pink:     'hover:border-neutral-500',
  spectral: 'hover:border-neutral-500',
  ok:       'hover:border-emerald-600',
  emerald:  'hover:border-emerald-600',
  warn:     'hover:border-amber-600',
  amber:    'hover:border-amber-600',
  critical: 'hover:border-red-600',
  crimson:  'hover:border-red-600',
  rose:     'hover:border-red-600',
};

const accentMap: Record<AccentVariant, string> = {
  none:     '',
  brand:    'border-neutral-700 hover:border-neutral-500',
  cyan:     'border-neutral-700 hover:border-neutral-500',
  teal:     'border-neutral-700 hover:border-neutral-500',
  blue:     'border-neutral-700 hover:border-neutral-500',
  violet:   'border-neutral-700 hover:border-neutral-500',
  pink:     'border-neutral-700 hover:border-neutral-500',
  spectral: 'border-neutral-700 hover:border-neutral-500',
  ok:       'border-emerald-600/40 hover:border-emerald-500/60',
  emerald:  'border-emerald-600/40 hover:border-emerald-500/60',
  warn:     'border-amber-600/40 hover:border-amber-500/60',
  amber:    'border-amber-600/40 hover:border-amber-500/60',
  critical: 'border-red-600/40 hover:border-red-500/60',
  rose:     'border-red-600/40 hover:border-red-500/60',
};

const variantClassMap: Record<CardVariant, string> = {
  default:  'glass-panel rounded-3xl',
  soft:     'glass-panel-soft rounded-3xl',
  textured: 'glass-panel-textured rounded-3xl',
  gradient: 'glass-panel-gradient rounded-3xl',
  hero:     'glass-panel-hero rounded-3xl',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    children,
    className,
    padding = 'md',
    hover = false,
    glow = 'none',
    accent = 'none',
    elevated = false,
    variant = 'default',
    hero = false,
    onClick,
    ...props
  }, ref) => {
    const resolvedVariant = hero ? 'hero' : variant;
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          elevated ? 'glass-panel-elevated' : variantClassMap[resolvedVariant],
          paddingMap[padding],
          accent !== 'none' && accentMap[accent],
          hover && cn(
            'transition-colors duration-150',
            'hover:bg-[var(--bg-elevated-2)]',
            glow !== 'none' && glowMap[glow],
          ),
          onClick && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--brand-teal)] focus-visible:ring-offset-2 outline-none',
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