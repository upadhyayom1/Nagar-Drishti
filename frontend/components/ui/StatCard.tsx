import { cn } from '@/lib/utils';
import { GlassCard, GlowVariant, AccentVariant } from './GlassCard';
import type { LucideIcon } from 'lucide-react';

export type StatCardColorTheme = 
  | 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'pink' | 'blue' | 'teal' | 'ok' | 'warn' | 'critical';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  accentColor?: string;
  colorTheme?: StatCardColorTheme;
  isLoading?: boolean;
  className?: string;
}

const themeStyles: Record<StatCardColorTheme, {
  glow: GlowVariant;
  accent: AccentVariant;
  iconBg: string;
  trendPositive: string;
  trendNegative: string;
  barColor: string;
  glowBar: string;
}> = {
  cyan: {
    glow: 'cyan',
    accent: 'cyan',
    iconBg: 'bg-cyan-500/15 border-cyan-500/35 text-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(0,240,255,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(0,240,255,0.8)]',
  },
  blue: {
    glow: 'blue',
    accent: 'blue',
    iconBg: 'bg-sky-500/15 border-sky-500/35 text-sky-400 shadow-[0_0_18px_rgba(56,189,248,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-sky-400 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(56,189,248,0.8)]',
  },
  teal: {
    glow: 'teal',
    accent: 'teal',
    iconBg: 'bg-teal-500/15 border-teal-500/35 text-teal-400 shadow-[0_0_18px_rgba(20,184,166,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-teal-400 to-cyan-500 shadow-[0_0_12px_rgba(20,184,166,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(20,184,166,0.8)]',
  },
  violet: {
    glow: 'violet',
    accent: 'violet',
    iconBg: 'bg-violet-500/15 border-violet-500/35 text-violet-400 shadow-[0_0_18px_rgba(139,92,246,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-violet-400 to-fuchsia-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(139,92,246,0.8)]',
  },
  pink: {
    glow: 'pink',
    accent: 'pink',
    iconBg: 'bg-pink-500/15 border-pink-500/35 text-pink-400 shadow-[0_0_18px_rgba(236,72,153,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-pink-400 to-rose-500 shadow-[0_0_12px_rgba(236,72,153,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(236,72,153,0.8)]',
  },
  emerald: {
    glow: 'emerald',
    accent: 'emerald',
    iconBg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(16,185,129,0.8)]',
  },
  ok: {
    glow: 'ok',
    accent: 'ok',
    iconBg: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(16,185,129,0.8)]',
  },
  amber: {
    glow: 'amber',
    accent: 'amber',
    iconBg: 'bg-amber-500/15 border-amber-500/35 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(245,158,11,0.8)]',
  },
  warn: {
    glow: 'warn',
    accent: 'warn',
    iconBg: 'bg-amber-500/15 border-amber-500/35 text-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(245,158,11,0.8)]',
  },
  rose: {
    glow: 'rose',
    accent: 'rose',
    iconBg: 'bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-rose-400 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(244,63,94,0.8)]',
  },
  critical: {
    glow: 'critical',
    accent: 'critical',
    iconBg: 'bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-[0_0_18px_rgba(244,63,94,0.3)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    trendNegative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    barColor: 'bg-gradient-to-r from-rose-400 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    glowBar: 'group-hover:shadow-[0_0_16px_rgba(244,63,94,0.8)]',
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
  isLoading = false,
  className,
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

  return (
    <GlassCard
      hover
      glow={theme.glow}
      accent={theme.accent}
      className={cn('group flex flex-col justify-between p-5 relative overflow-hidden transition-all duration-300', className)}
    >
      <div className="flex items-start justify-between gap-3 pt-1">
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Section Category Label */}
          <p className="text-[11px] font-display font-semibold text-[var(--text-secondary)] uppercase tracking-wider truncate">
            {label}
          </p>

          {/* Primary Metric Numeral */}
          {isLoading ? (
            <div className="h-8 w-24 bg-white/10 rounded-md animate-pulse mt-1" />
          ) : (
            <div className="text-2xl sm:text-3xl font-bold font-data tabular-nums text-[var(--text-primary)] tracking-tight leading-none mt-1 transition-colors duration-150 truncate flex items-baseline gap-1.5">
              <span>{value}</span>
            </div>
          )}

          {/* Real-time Trends */}
          {trend && !isLoading && (
            <div className="flex items-center gap-2 mt-2.5">
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] font-data tabular-nums font-semibold px-2 py-0.5 rounded-md border',
                trend.isPositive ? theme.trendPositive : theme.trendNegative
              )}>
                {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
              <span className="text-[var(--text-tertiary)] text-[10px] font-body uppercase tracking-wider font-medium">vs prev cycle</span>
            </div>
          )}

          {subtitle && (
            isLoading ? (
              <div className="h-3 w-32 bg-white/10 rounded mt-2 animate-pulse" />
            ) : (
              <p className="text-xs text-[var(--text-secondary)] font-body mt-2 font-normal leading-relaxed truncate">{subtitle}</p>
            )
          )}
        </div>

        {/* Halo Glow Icon Capsule */}
        <div
          className={cn('p-2.5 rounded-xl border backdrop-blur-md shrink-0 transition-transform duration-300 group-hover:scale-110', theme.iconBg)}
        >
          <Icon size={19} />
        </div>
      </div>

      {/* Luminous Colored Accent Bar on bottom of each Stat Box */}
      <div className="mt-3.5 pt-2 border-t border-[var(--glass-border)] flex items-center gap-2">
        <div className={cn(
          'h-1.5 flex-1 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 transition-all duration-300',
          theme.glowBar
        )}>
          <div className={cn('h-full w-full rounded-full transition-all duration-300 group-hover:brightness-125', theme.barColor)} />
        </div>
      </div>
    </GlassCard>
  );
}
