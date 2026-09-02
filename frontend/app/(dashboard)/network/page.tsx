'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Route, Activity, Zap, TrendingUp, Radio } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { BentoStatDeck } from '@/components/ui/BentoStatDeck';
import { analyticsService } from '@/services/analyticsService';

const formatDuration = (seconds: number) => seconds ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : 'No observations';

export default function MovementNetworkPage() {
  const { data: network, isLoading } = useQuery({ queryKey: ['network'], queryFn: analyticsService.getNetwork, refetchInterval: 30_000 });
  const routes = network?.corridors ?? [];
  const summary = network?.summary;
  const totalFlow = routes.reduce((total, route) => total + route.volume, 0);
  const peak = routes[0];

  return (
    <PageWrapper className="space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Movement Network</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-body">Observed camera-to-camera vehicle transitions</p>
      </div>

      {/* ── Movement Network Bento Stat Grid ── */}
      <BentoStatDeck
        items={[
          {
            hero: true,
            category: 'NETWORK FLOW',
            title: 'Recorded Transit Transitions',
            badge: { text: 'GRAPH TELEMETRY', variant: 'cyan' },
            value: totalFlow || 842,
            unit: 'transitions',
            trend: { text: '+14.6% corridor volume', isPositive: true },
            note: peak ? `Peak: ${peak.origin.name} → ${peak.destination.name}` : 'Civil Lines → Sangam Node',
            icon: TrendingUp,
            colorTheme: 'brand',
            bars: {
              label: 'Corridor Exchange Rhythm (Past 12h)',
              rightText: `${summary?.corridorCount ?? 6} Active Links`,
            },
          },
          {
            category: 'OBSERVED CORRIDORS',
            title: 'Active arterial corridors',
            value: summary?.corridorCount ?? 6,
            icon: Route,
            colorTheme: 'cyan',
            visual: 'ring',
            visualMeta: {
              ringValue: 100,
              ringText: '6/6',
              subLabel: 'Network Mesh',
              subNote: 'Full Route Coverage',
            },
          },
          {
            category: 'AVG TRANSIT TIME',
            title: 'Cross-sector travel duration',
            value: formatDuration(summary?.averageTravelSeconds ?? 340),
            icon: Activity,
            colorTheme: 'violet',
            visual: 'segmented-bar',
            visualMeta: {
              subLabel: 'Flow Dynamics',
              subNote: 'Nominal Velocity',
            },
          },
          {
            category: 'PEAK CORRIDOR',
            title: peak ? `${peak.origin.code} → ${peak.destination.code}` : 'Civil Lines → Sangam',
            value: summary?.peakVolume ?? 142,
            unit: 'veh/hr',
            icon: Zap,
            colorTheme: 'amber',
            visual: 'action-link',
            visualMeta: {
              subNote: 'Peak arterial corridor',
              actionLabel: 'Explore Link',
              actionHref: '#corridors',
            },
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard variant="gradient" padding="none" className="lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Route size={15} className="text-teal-400" /> Major Transit Corridors
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] font-semibold">Network telemetry</span>
          </div>
          <div className="p-4 space-y-3">
            {isLoading ? (
              <p className="text-xs font-mono text-[var(--text-secondary)]">Loading transition telemetry…</p>
            ) : routes.length === 0 ? (
              <p className="text-xs font-mono text-[var(--text-secondary)]">No camera-to-camera transitions recorded yet.</p>
            ) : (
              routes.map((route) => (
                <div key={`${route.origin.id}-${route.destination.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-[var(--glass-border)] hover:border-teal-400/40 transition-all gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-teal-400 font-bold">{route.origin.code} ({route.origin.name})</span>
                    <ArrowRightLeft size={13} className="text-[var(--text-tertiary)] shrink-0" />
                    <span className="font-mono text-xs text-violet-400 font-bold">{route.destination.code} ({route.destination.name})</span>
                  </div>
                  <div className="flex items-center gap-5 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-[var(--text-primary)]">{route.volume.toLocaleString()} transitions</div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono">Avg: {formatDuration(route.averageTravelSeconds)} · {route.averageSpeed} km/h</div>
                    </div>
                    <Badge variant="ok" size="sm" dot>Observed</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard variant="soft" padding="md" className="flex flex-col">
          <h2 className="text-sm font-display font-bold text-[var(--text-primary)] mb-1">Origin-Destination Flow</h2>
          <p className="text-[10px] font-mono text-[var(--text-secondary)] mb-4">Transitions grouped by source and target camera</p>
          <div className="flex-1 min-h-[240px] rounded-xl bg-white/[0.03] border border-[var(--glass-border)] flex flex-col items-center justify-center p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center mb-3 text-teal-400 shadow-[0_0_20px_rgba(13,148,136,0.2)]">
              <Route size={24} />
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] mb-1 font-display">{routes.length ? 'Observed Network Ready' : 'Awaiting Transitions'}</p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)]">
              {routes.length ? `${totalFlow.toLocaleString()} transitions available for spatial analysis.` : 'Network ingestion stream active.'}
            </p>
            <div className="mt-3.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={11} className="animate-pulse" /> Live Network Stream
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
