'use client';

import { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { LucideIcon, ArrowUpRight } from 'lucide-react';
import { StatCounter } from '@/components/ui/StatCounter';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export interface BentoStatItem {
  hero?: boolean;
  category: string;
  title: string;
  badge?: { text: string; variant?: 'ok' | 'warn' | 'critical' | 'cyan' | 'violet' | 'emerald' | 'rose' | 'amber' };
  value: number | string;
  unit?: string;
  trend?: { text: string; isPositive?: boolean };
  note?: string;
  icon: LucideIcon;
  colorTheme?: 'brand' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
  watermarkIcon?: LucideIcon;
  bars?: { label: string; rightText?: string; data?: number[] };
  visual?: 'bars' | 'ring' | 'segmented-bar' | 'action-link' | 'none';
  visualMeta?: {
    ringValue?: number; // 0 to 100
    ringText?: string;
    subLabel?: string;
    subNote?: string;
    actionHref?: string;
    actionLabel?: string;
    segments?: { color: string; width: string }[];
  };
}

interface BentoStatDeckProps {
  items: BentoStatItem[];
  className?: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 360, damping: 26 },
  },
};

const themeColorMap = {
  brand: {
    border: 'border-[var(--glass-border)]',
    iconBg: 'bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl',
    watermark: 'text-[var(--text-primary)]/[0.03]',
    barFill: 'bg-[var(--brand-teal)]/50 hover:bg-[var(--brand-teal)]',
    ringStroke: 'var(--brand-teal)',
  },
  cyan: {
    border: 'border-[var(--glass-border)]',
    iconBg: 'bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl',
    watermark: 'text-[var(--text-primary)]/[0.03]',
    barFill: 'bg-[var(--brand-teal)]/50 hover:bg-[var(--brand-teal)]',
    ringStroke: 'var(--brand-teal)',
  },
  emerald: {
    border: 'border-[var(--glass-border)]',
    iconBg: 'bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 text-[var(--brand-teal)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl',
    watermark: 'text-[var(--text-primary)]/[0.03]',
    barFill: 'bg-[var(--brand-teal)]/50 hover:bg-[var(--brand-teal)]',
    ringStroke: 'var(--brand-teal)',
  },
  amber: {
    border: 'border-[var(--glass-border)]',
    iconBg: 'bg-amber-500/15 border border-amber-500/30 text-[var(--status-warn)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl',
    watermark: 'text-[var(--text-primary)]/[0.03]',
    barFill: 'bg-amber-500/50 hover:bg-amber-500',
    ringStroke: 'var(--status-warn)',
  },
  rose: {
    border: 'border-[var(--glass-border)]',
    iconBg: 'bg-red-500/15 border border-red-500/30 text-[var(--status-critical)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl',
    watermark: 'text-[var(--text-primary)]/[0.03]',
    barFill: 'bg-red-500/50 hover:bg-red-500',
    ringStroke: 'var(--status-critical)',
  },
  violet: {
    border: 'border-[var(--glass-border)]',
    iconBg: 'bg-[var(--bg-elevated-2)] border border-[var(--glass-border)] text-[var(--text-primary)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] rounded-2xl',
    watermark: 'text-[var(--text-primary)]/[0.03]',
    barFill: 'bg-[var(--brand-teal)]/50 hover:bg-[var(--brand-teal)]',
    ringStroke: 'var(--brand-teal)',
  },
};

const defaultBars = [32, 45, 60, 78, 92, 85, 64, 70, 88, 95, 82, 68];

export function BentoStatDeck({ items, className }: BentoStatDeckProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-body select-none', className)}
    >
      {items.map((item, idx) => {
        const isHero = item.hero ?? idx === 0;
        const theme = themeColorMap[item.colorTheme || (isHero ? 'brand' : 'cyan')];
        const Icon = item.icon;
        const Watermark = item.watermarkIcon || item.icon;
        const isNumeric = typeof item.value === 'number';
        const barsData = item.bars?.data || defaultBars;

        if (isHero) {
          return (
            <motion.div
              key={item.category + idx}
              variants={itemVariants}
              className="sm:col-span-2 lg:col-span-2 flex flex-col"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <GlassCard
                hover
                glow={item.colorTheme || 'brand'}
                className={cn(
                  'flex-1 p-6 relative overflow-hidden flex flex-col justify-between group border bg-[var(--bg-elevated)] border-[var(--card-soft-border)] shadow-[var(--glass-shadow)]',
                  theme.border
                )}
              >
                {/* Watermark icon with floating rotate effect */}
                <Watermark
                  size={110}
                  className={cn(
                    'absolute -bottom-6 -right-6 pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-6',
                    theme.watermark
                  )}
                />

                <div>
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-2.5 rounded-xl border group-hover:scale-105 transition-transform', theme.iconBg)}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] block">
                          {item.category}
                        </span>
                        <span className="text-xs font-display font-semibold text-[var(--text-primary)]">
                          {item.title}
                        </span>
                      </div>
                    </div>

                    {item.badge && (
                      <Badge variant={item.badge.variant || 'cyan'} size="sm" dot pulse>
                        {item.badge.text}
                      </Badge>
                    )}
                  </div>

                  {/* Main value display */}
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-display font-extrabold tracking-tight text-[var(--text-primary)]">
                      {isNumeric ? <StatCounter value={item.value as number} duration={1100} /> : item.value}
                    </span>
                    {item.unit && (
                      <span className="text-xs font-mono text-teal-400 font-semibold uppercase tracking-wider">
                        {item.unit}
                      </span>
                    )}
                  </div>

                  {/* Trend & metrics */}
                  {(item.trend || item.note) && (
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {item.trend && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--status-ok)] bg-[var(--brand-teal)]/15 border border-[var(--brand-teal)]/30 px-2 py-0.5 rounded-lg shadow-sm">
                          <ArrowUpRight size={13} /> {item.trend.text}
                        </span>
                      )}
                      {item.note && (
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                          {item.note}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Diurnal Volume Rhythm Micro-Bars Visual */}
                <div className="mt-6 pt-3 border-t border-[var(--glass-border)]">
                  <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-tertiary)] mb-2">
                    <span>{item.bars?.label || 'Diurnal Volume Rhythm (Past 12h)'}</span>
                    <span className="text-[var(--brand-teal)] font-bold">{item.bars?.rightText || '98.4% ANPR Accuracy'}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-1.5 h-9 items-end">
                    {barsData.map((height, i) => (
                      <div
                        key={i}
                        className="h-full flex items-end justify-center group/bar relative"
                        title={`Hour ${i + 1}: ${Math.round((height / 100) * 340)} veh/hr`}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ duration: 0.8, delay: 0.1 + i * 0.04, ease: 'easeOut' }}
                          className="w-full rounded-t bg-[var(--brand-teal)]/50 hover:bg-[var(--brand-teal)] transition-all duration-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        }

        // Accompanying 1-Col Card
        return (
          <motion.div
            key={item.category + idx}
            variants={itemVariants}
            className="flex flex-col"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <GlassCard
              hover
              glow={item.colorTheme || 'cyan'}
              className={cn(
                'flex-1 p-5 relative overflow-hidden flex flex-col justify-between group border',
                theme.border
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    {item.category}
                  </span>
                  <div className={cn('p-2 rounded-xl border group-hover:scale-110 transition-transform', theme.iconBg)}>
                    <Icon size={16} />
                  </div>
                </div>

                <div className="text-3xl sm:text-4xl font-display font-extrabold text-[var(--text-primary)] flex items-baseline gap-1.5 flex-wrap">
                  {isNumeric ? (
                    <StatCounter value={item.value as number} duration={900} />
                  ) : (
                    <span>{item.value}</span>
                  )}
                  {item.unit && (
                    <span className="text-xs font-mono text-[var(--text-secondary)] font-normal">
                      {item.unit}
                    </span>
                  )}
                  {item.badge && (
                    <Badge variant={item.badge.variant || 'cyan'} size="sm" dot pulse={item.badge.variant === 'critical'}>
                      {item.badge.text}
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] font-body text-[var(--text-secondary)] mt-1">
                  {item.title}
                </p>
              </div>

              {/* Bottom Visual / Metadata Deck */}
              <div className="mt-4 pt-3 border-t border-[var(--glass-border)]">
                {item.visual === 'ring' ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-0.5 text-[10px] font-mono text-[var(--text-secondary)]">
                      <p className="text-[var(--text-primary)] font-semibold">{item.visualMeta?.subLabel || 'All Nodes Online'}</p>
                      <p className="text-[9px] text-[var(--text-tertiary)]">{item.visualMeta?.subNote || 'Zero Packet Drop'}</p>
                    </div>

                    <div className="relative w-8 h-8 shrink-0">
                      <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="14" fill="none" className="stroke-[var(--bg-elevated-2)]" strokeWidth="3" />
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke={theme.ringStroke}
                          strokeWidth="3"
                          strokeDasharray="88"
                          strokeDashoffset={88 - (88 * (item.visualMeta?.ringValue ?? 100)) / 100}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-bold text-[var(--brand-teal)]">
                        {item.visualMeta?.ringText || `${item.visualMeta?.ringValue ?? 100}%`}
                      </span>
                    </div>
                  </div>
                ) : item.visual === 'segmented-bar' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-tertiary)]">
                      <span>{item.visualMeta?.subLabel || 'State'}</span>
                      <span className="text-[var(--brand-teal)] font-semibold">{item.visualMeta?.subNote || 'Nominal'}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[var(--bg-elevated-2)] flex p-0.5 gap-0.5">
                      {item.visualMeta?.segments ? (
                        item.visualMeta.segments.map((seg, sIdx) => (
                          <div key={sIdx} className={cn('h-full rounded-full', seg.color)} style={{ width: seg.width }} />
                        ))
                      ) : (
                        <>
                          <div className="h-full rounded-full bg-[var(--brand-teal)] w-3/5" />
                          <div className="h-full rounded-full bg-amber-400/40 w-1/4" />
                          <div className="h-full rounded-full bg-rose-500/20 w-1/6" />
                        </>
                      )}
                    </div>
                  </div>
                ) : item.visual === 'action-link' ? (
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[var(--text-tertiary)]">{item.visualMeta?.subNote || 'Live surveillance queue'}</span>
                    {item.visualMeta?.actionHref ? (
                      <Link
                        href={item.visualMeta.actionHref}
                        className="text-rose-400 font-semibold hover:underline flex items-center gap-0.5"
                      >
                        {item.visualMeta.actionLabel || 'Review'} <ArrowUpRight size={11} />
                      </Link>
                    ) : (
                      <span className="text-teal-400 font-semibold">{item.visualMeta?.actionLabel || 'Monitoring'}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                    <span>{item.visualMeta?.subLabel || 'Sector Status'}</span>
                    <span className="text-teal-400 font-semibold">{item.visualMeta?.subNote || 'Operational'}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
