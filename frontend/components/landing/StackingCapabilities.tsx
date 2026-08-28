'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, BarChart3, Shield, ArrowRight, Layers, CheckCircle2, ChevronRight, Activity, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface CapabilityCard {
  id: string;
  title: string;
  category: string;
  accent: 'violet' | 'cyan' | 'rose';
  icon: any;
  href: string;
  summary: string;
  highlights: string[];
  liveMetric: { label: string; val: string };
}

const capabilities: CapabilityCard[] = [
  {
    id: 'cap-1',
    title: 'Vehicle Intelligence & Trajectory Timeline',
    category: 'ANPR SPATIOTEMPORAL INTELLIGENCE',
    accent: 'violet',
    icon: Car,
    href: '/vehicles',
    summary: 'Search any license plate across the city matrix to inspect complete chronological detection sightings, camera transition vectors, and interactive trajectory playback.',
    highlights: [
      'Universal License Plate Search with fuzzy matching',
      'Multi-node journey waypoint reconstruction',
      'Historical velocity curve & dwell-time analytics',
    ],
    liveMetric: { label: 'Active Monitored Plates', val: '2,847 Today' },
  },
  {
    id: 'cap-2',
    title: 'City Traffic Volume & Diurnal Analytics',
    category: 'MUNICIPAL FLOW OPTIMIZATION',
    accent: 'cyan',
    icon: BarChart3,
    href: '/analytics',
    summary: 'Analyze city-wide vehicle density across 24-hour diurnal curves, identify congestion corridors, and detect abnormal traffic volume surges.',
    highlights: [
      'Diurnal hourly volume area distribution',
      'Busiest corridor ranking & congestion scoring',
      'Real-time anomaly spike warnings',
    ],
    liveMetric: { label: 'Average Transit Velocity', val: '38.5 km/h' },
  },
  {
    id: 'cap-3',
    title: 'Automated Sentinel Threat & Blacklist Alerting',
    category: 'PUBLIC SAFETY & SECURITY SENTINEL',
    accent: 'rose',
    icon: Shield,
    href: '/alerts',
    summary: 'Instant automated sentinel monitoring against blacklisted vehicles, route anomalies, and network dropouts with immediate field dispatcher triage.',
    highlights: [
      'Sub-second blacklist plate matching',
      'Automated route deviation alarms',
      'One-click field dispatcher coordination',
    ],
    liveMetric: { label: 'Active Threat Queue', val: '4 Sentinel Flags' },
  },
];

export function StackingCapabilities() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      {/* ── Left Navigation Selector Cards ─────────────────────────────── */}
      <div className="lg:col-span-5 space-y-3">
        {capabilities.map((cap, i) => {
          const isSelected = activeIdx === i;
          const Icon = cap.icon;

          return (
            <motion.div
              key={cap.id}
              whileHover={{ x: 6 }}
              onClick={() => setActiveIdx(i)}
              className="cursor-pointer"
            >
              <GlassCard
                hover
                glow={cap.accent}
                accent={isSelected ? cap.accent : 'none'}
                className={`p-4.5 transition-all duration-300 flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-cyan-400 shadow-[0_0_24px_rgba(0,240,255,0.25)] bg-white/[0.06] dark:bg-slate-900/80'
                    : 'border-[var(--glass-border)] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      cap.accent === 'violet'
                        ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                        : cap.accent === 'cyan'
                        ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                      {cap.category}
                    </p>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] font-display truncate">
                      {cap.title}
                    </h4>
                  </div>
                </div>

                <ChevronRight
                  size={16}
                  className={`shrink-0 transition-transform ${
                    isSelected ? 'text-cyan-400 translate-x-1' : 'text-[var(--text-tertiary)]'
                  }`}
                />
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* ── Right 3D Book/Deck Stacking Showcase ────────────────────────── */}
      <div className="lg:col-span-7 relative min-h-[380px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, scale: 0.94, rotateY: 10, x: 20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.94, rotateY: -10, x: -20 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            <GlassCard
              padding="lg"
              glow={capabilities[activeIdx].accent}
              accent={capabilities[activeIdx].accent}
              className="p-8 sm:p-9 border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden"
            >
              {/* Background ambient refraction */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Badge variant={capabilities[activeIdx].accent} size="sm">
                  {capabilities[activeIdx].category}
                </Badge>
                <div className="px-3 py-1 rounded-full bg-white/[0.04] border border-[var(--glass-border)] text-xs font-mono font-semibold text-cyan-400">
                  {capabilities[activeIdx].liveMetric.label}: {capabilities[activeIdx].liveMetric.val}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold font-display text-[var(--text-primary)] mb-2.5">
                  {capabilities[activeIdx].title}
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-body">
                  {capabilities[activeIdx].summary}
                </p>
              </div>

              {/* Feature Bullet Points */}
              <div className="space-y-2 pt-2 border-t border-[var(--glass-border)]">
                {capabilities[activeIdx].highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] font-body">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Link href={capabilities[activeIdx].href}>
                  <Button variant="primary" size="md">
                    Launch {capabilities[activeIdx].title.split(' ')[0]} Module <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
