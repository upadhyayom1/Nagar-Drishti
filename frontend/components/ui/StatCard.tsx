import { cn } from '@/lib/utils';
import { GlassCard } from './GlassCard';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  accentColor?: string;
  colorTheme?: 'emerald' | 'violet' | 'cyan' | 'amber' | 'rose';
  className?: string;
}

const themeStyles = {
  emerald: {
    glow: 'emerald' as const,
    accent: 'emerald' as const,
    iconBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    trendNegative: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    hoverText: 'group-hover:text-emerald-400',
  },
  violet: {
    glow: 'violet' as const,
    accent: 'violet' as const,
    iconBg: 'bg-violet-500/15 border-violet-500/30 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.25)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    trendNegative: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    hoverText: 'group-hover:text-violet-400',
  },
  cyan: {
    glow: 'cyan' as const,
    accent: 'cyan' as const,
    iconBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    trendNegative: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    hoverText: 'group-hover:text-cyan-400',
  },
  amber: {
    glow: 'amber' as const,
    accent: 'amber' as const,
    iconBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    trendNegative: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    hoverText: 'group-hover:text-amber-400',
  },
  rose: {
    glow: 'crimson' as const,
    accent: 'rose' as const,
    iconBg: 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    trendPositive: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    trendNegative: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]',
    hoverText: 'group-hover:text-rose-400',
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
}: StatCardProps) {
  // Infer color theme if accentColor was passed
  let themeKey: keyof typeof themeStyles = colorTheme;
  if (accentColor) {
    if (accentColor.includes('emerald') || accentColor.includes('10b981') || accentColor.includes('ok') || accentColor.includes('34d399') || accentColor.includes('Nodes')) themeKey = 'emerald';
    else if (accentColor.includes('violet') || accentColor.includes('8b5cf6') || accentColor.includes('cobalt') || accentColor.includes('6366f1') || accentColor.includes('Vehicles')) themeKey = 'violet';
    else if (accentColor.includes('cyan') || accentColor.includes('06b6d4') || accentColor.includes('azure') || accentColor.includes('38bdf8') || accentColor.includes('Velocity')) themeKey = 'cyan';
    else if (accentColor.includes('amber') || accentColor.includes('f59e0b') || accentColor.includes('warn')) themeKey = 'amber';
    else if (accentColor.includes('critical') || accentColor.includes('rose') || accentColor.includes('f43f5e') || accentColor.includes('Flags')) themeKey = 'rose';
  }

  const theme = themeStyles[themeKey];

  return (
    <GlassCard 
      hover 
      glow={theme.glow}
      accent={theme.accent}
      className={cn('group flex flex-col justify-between p-5 relative overflow-hidden', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          {/* Section Category Label */}
          <p className="text-[11px] font-display font-bold text-slate-400 uppercase tracking-wider truncate">
            {label}
          </p>

          {/* Primary Metric Numeral */}
          <div className={cn('text-2xl sm:text-3xl font-extrabold font-data text-white tracking-tight leading-none mt-1 transition-colors duration-200 truncate flex items-baseline gap-1.5', theme.hoverText)}>
            <span>{value}</span>
          </div>

          {/* Real-time Trends */}
          {trend && (
            <div className="flex items-center gap-2 mt-2.5">
              <span className={cn(
                'inline-flex items-center gap-1 text-[11px] font-data font-bold px-2 py-0.5 rounded-lg border',
                trend.isPositive ? theme.trendPositive : theme.trendNegative
              )}>
                {trend.isPositive ? '▲' : '▼'} {Math.abs(trend.value)}%
              </span>
              <span className="text-slate-500 text-[10px] font-body uppercase tracking-wider font-semibold">vs prev cycle</span>
            </div>
          )}

          {subtitle && (
            <p className="text-xs text-slate-400 font-body mt-2.5 font-normal leading-relaxed truncate">{subtitle}</p>
          )}
        </div>

        {/* Distinct Floating Multi-Color Icon Capsule */}
        <div
          className={cn('p-3 rounded-2xl transition-all duration-300 group-hover:scale-105 shrink-0 border backdrop-blur-md', theme.iconBg)}
        >
          <Icon
            size={20}
            className="transition-all duration-300 group-hover:drop-shadow-[0_0_10px_currentColor]"
          />
        </div>
      </div>
    </GlassCard>
  );
}