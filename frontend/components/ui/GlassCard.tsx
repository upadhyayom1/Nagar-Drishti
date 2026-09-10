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
  padding?:    'none' | 'sm' | 'md' | 'lg';
  hover?:      boolean;
  glow?:       GlowVariant;
  accent?:     AccentVariant;
  elevated?:   boolean;
  variant?:    CardVariant;
  hero?:       boolean;
  borderGlow?: boolean;
}

const paddingMap = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
};

const glowColorRgbMap: Record<GlowVariant, string> = {
  none:     '0, 245, 155',
  brand:    '0, 245, 155',
  cyan:     '0, 245, 155',
  teal:     '13, 148, 136',
  blue:     '59, 130, 246',
  violet:   '168, 85, 247',
  pink:     '236, 72, 153',
  spectral: '0, 245, 155',
  ok:       '16, 185, 129',
  emerald:  '16, 185, 129',
  warn:     '245, 158, 11',
  amber:    '245, 158, 11',
  critical: '244, 63, 94',
  crimson:  '244, 63, 94',
  rose:     '244, 63, 94',
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
    borderGlow = true,
    onClick,
    onMouseMove,
    onMouseLeave,
    style,
    ...props
  }, ref) => {
    const resolvedVariant = hero ? 'hero' : variant;
    const resolvedGlowColor =
      glowColorRgbMap[glow] || glowColorRgbMap[accent as GlowVariant] || '0, 245, 155';

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hover || borderGlow) {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty('--glow-x', x + '%');
        el.style.setProperty('--glow-y', y + '%');
        el.style.setProperty('--glow-intensity', '1');
      }
      onMouseMove?.(e);
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
      if (hover || borderGlow) {
        const el = e.currentTarget;
        el.style.setProperty('--glow-intensity', '0');
      }
      onMouseLeave?.(e);
    };

    return (
      <div
        ref={ref}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          '--glow-color': resolvedGlowColor,
          ...style,
        } as React.CSSProperties}
        className={cn(
          elevated ? 'glass-panel-elevated' : variantClassMap[resolvedVariant],
          paddingMap[padding],
          accent !== 'none' && accentMap[accent],
          (hover || borderGlow) && 'glass-card--border-glow',
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
