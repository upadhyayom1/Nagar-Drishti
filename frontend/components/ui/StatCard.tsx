'use client';

import { cn } from '@/lib/utils';
import { GlassCard, GlowVariant, AccentVariant } from './GlassCard';
import { StatCounter } from './StatCounter';
import type { LucideIcon } from 'lucide-react';

export type StatCardColorTheme =
  | 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'pink' | 'blue' | 'teal' | 'ok' | 'warn' | 'critical' | 'brand';

export interface StatCardProps {
  label:       string;
  value:       string | number;
  icon:        LucideIcon;
  trend?:      { value: number; isPositive: boolean };
  subtitle?:   string;
  accentColor?: string;
  colorTheme?: StatCardColorTheme;
  className?:  string;
  /** Hero variant — larger treatment, watermark icon, brand gradient tint */
  hero?:       boolean;
}

const themeStyles: Record<StatCardColorTheme, {
  glow: GlowVariant;
  accent: AccentVariant;
  iconBg: string;
  trendPositive: string;
  trendNegative: string;
  barColor: string;
  glowBar: string;
  valueColor: string;
  watermarkColor: string;
}> = {
  brand: {
    glow: 'none',
    accent: 'brand',
    iconBg: 'bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)]',
    trendPositive: 'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30',
    trendNegative: 'bg-red-500/15 text-[var(--status-critical)] border border-red-500/30',
    barColor: 'bg-[var(--brand-teal)]',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-[var(--text-primary)]/[0.04]',
  },
  cyan: {
    glow: 'none',
    accent: 'cyan',
    iconBg: 'bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)]',
    trendPositive: 'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30',
    trendNegative: 'bg-red-500/15 text-[var(--status-critical)] border border-red-500/30',
    barColor: 'bg-[var(--brand-teal)]',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-[var(--text-primary)]/[0.04]',
  },
  blue: {
    glow: 'none',
    accent: 'blue',
    iconBg: 'bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)]',
    trendPositive: 'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30',
    trendNegative: 'bg-red-500/15 text-[var(--status-critical)] border border-red-500/30',
    barColor: 'bg-[var(--brand-teal)]',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-[var(--text-primary)]/[0.04]',
  },
  teal: {
    glow: 'none',
    accent: 'teal',
    iconBg: 'bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)]',
    trendPositive: 'bg-[var(--brand-teal)]/15 text-[var(--status-ok)] border border-[var(--brand-teal)]/30',
    trendNegative: 'bg-red-500/15 text-[var(--status-critical)] border border-red-500/30',
    barColor: 'bg-[var(--brand-teal)]',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-[var(--text-primary)]/[0.04]',
  },
  violet: {
    glow: 'none',
    accent: 'violet',
    iconBg: 'bg-neutral-800 border border-neutral-700 text-[var(--text-secondary)]',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-[#10a37f]',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
  pink: {
    glow: 'none',
    accent: 'pink',
    iconBg: 'bg-neutral-800 border border-neutral-700 text-[var(--text-secondary)]',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-[#10a37f]',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
  emerald: {
    glow: 'none',
    accent: 'emerald',
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-emerald-500',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
  ok: {
    glow: 'none',
    accent: 'ok',
    iconBg: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-emerald-500',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
  amber: {
    glow: 'none',
    accent: 'amber',
    iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-amber-500',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
  warn: {
    glow: 'none',
    accent: 'warn',
    iconBg: 'bg-amber-500/10 border border-amber-500/20 text-amber-400',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-amber-500',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
  rose: {
    glow: 'none',
    accent: 'rose',
    iconBg: 'bg-red-500/10 border border-red-500/20 text-red-400',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-red-500',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
  critical: {
    glow: 'none',
    accent: 'critical',
    iconBg: 'bg-red-500/10 border border-red-500/20 text-red-400',
    trendPositive: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    trendNegative: 'bg-red-500/10 text-red-400 border border-red-500/20',
    barColor: 'bg-red-500',
    glowBar: '',
    valueColor: 'text-[var(--text-primary)]',
    watermarkColor: 'text-white/[0.03]',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  subtitle,
  accentColor,
  colorTheme = 'cyan',
  className,
  hero = false,
}: StatCardProps) {
  let themeKey: StatCardColorTheme = colorTheme;
  if (accentColor) {
    if (accentColor.includes('10b981') || accentColor.includes('emerald') || accentColor.includes('ok')) themeKey = 'emerald';
    else if (accentColor.includes('f59e0b') || accentColor.includes('amber') || accentColor.includes('warn')) themeKey = 'amber';
    else if (accentColor.includes('f43f5e') || accentColor.includes('rose') || accentColor.includes('critical')) themeKey = 'rose';
    else if (accentColor.includes('8b5cf6') || accentColor.includes('violet')) themeKey = 'violet';
    else if (accentColor.includes('ec4899') || accentColor.includes('pink')) themeKey = 'pink';
    else if (accentColor.includes('06b6d4') || accentColor.includes('cyan')) themeKey = 'cyan';
  }

  const theme = themeStyles[themeKey] || themeStyles.cyan;
  const numericValue = typeof value === 'number' ? value : null;
  const stringValue  = typeof value === 'string' ? value : null;

  if (hero) {
    return (
      <GlassCard
        hover
        hero
        glow={theme.glow}
        className={cn(
          'group flex flex-col justify-between relative overflow-hidden transition-all duration-150',
          'p-7',
          className,
        )}
      >
        {/* Watermark icon */}
        <Icon
          size={90}
          className={cn(
            'absolute -bottom-4 -right-4 pointer-events-none select-none',
            theme.watermarkColor,
            'transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3',
          )}
        />
        <div className="relative z-10 space-y-2">
          <p className="text-[11px] font-body font-medium text-[var(--text-secondary)] uppercase tracking-widest">
            {label}
          </p>
          <div className="text-4xl sm:text-5xl font-bold font-data tabular-nums tracking-tight leading-none text-[var(--text-primary)]">
            {numericValue !== null ? (
              <StatCounter value={numericValue} duration={1100} />
            ) : (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{stringValue}</span>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] font-data tabular-nums font-semibold px-2 py-0.5 rounded-md border',
                trend.isPositive ? theme.trendPositive : theme.trendNegative,
              )}>
                {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
              <span className="text-[var(--text-tertiary)] text-[10px] font-body uppercase tracking-wider font-medium">vs prev cycle</span>
            </div>
          )}
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] font-body mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {/* Gradient accent bar */}
        <div className="relative z-10 mt-5 h-1 rounded-full overflow-hidden bg-[var(--bg-elevated-2)]">
          <div className={cn('h-full w-4/5 rounded-full transition-all duration-500 group-hover:w-full', theme.barColor)} />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      hover
      glow={theme.glow}
      accent={theme.accent}
      className={cn('group flex flex-col justify-between p-5 relative overflow-hidden transition-all duration-150', className)}
    >
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Label */}
          <p className="text-[11px] font-body font-medium text-[var(--text-secondary)] uppercase tracking-widest truncate">
            {label}
          </p>

          {/* Value */}
          <div className="text-2xl sm:text-3xl font-bold font-data tabular-nums tracking-tight leading-none mt-1 truncate flex items-baseline gap-1.5 text-[var(--text-primary)]">
            {numericValue !== null ? (
              <StatCounter value={numericValue} duration={900} />
            ) : (
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{stringValue}</span>
            )}
          </div>

          {/* Trend */}
          {trend && (
            <div className="flex items-center gap-2 mt-2.5">
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] font-data tabular-nums font-semibold px-2.5 py-0.5 rounded-full border shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
                trend.isPositive ? theme.trendPositive : theme.trendNegative,
              )}>
                {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
              <span className="text-[var(--text-tertiary)] text-[10px] font-body uppercase tracking-wider font-medium">vs prev cycle</span>
            </div>
          )}

          {subtitle && (
            <p className="text-xs text-[var(--text-secondary)] font-body mt-2 font-normal leading-relaxed truncate">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        <div className={cn('p-2.5 rounded-2xl border backdrop-blur-md shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]', theme.iconBg)}>
          <Icon size={19} />
        </div>
      </div>

      {/* Accent Bar */}
      <div className="mt-4 pt-2 border-t border-white/10 flex items-center gap-2">
        <div className={cn(
          'h-1.5 flex-1 rounded-full overflow-hidden bg-neutral-800 transition-all duration-300',
          theme.glowBar,
        )}>
          <div className={cn('h-full w-full rounded-full transition-all duration-300 group-hover:brightness-125', theme.barColor)} />
        </div>
      </div>
    </GlassCard>
  );
}
