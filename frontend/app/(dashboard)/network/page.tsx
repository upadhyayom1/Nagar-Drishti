'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightLeft, Route, Activity, Zap, TrendingUp, Radio } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { StatCard } from '@/components/ui/StatCard';
import { analyticsService } from '@/services/analyticsService';

const formatDuration = (seconds: number) => seconds ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : 'No observations';

export default function MovementNetworkPage() {
  const analyticsWindow = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);
  const { data: network, isLoading } = useQuery({ queryKey: ['network', analyticsWindow], queryFn: () => analyticsService.getNetwork(analyticsWindow), refetchInterval: 30_000 });
  const routes = network?.corridors ?? [];
  const summary = network?.summary;
  const totalFlow = routes.reduce((total, route) => total + route.volume, 0);
  const peak = routes[0];

  return (
    <PageWrapper className="space-y-6 font-body">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Movement Network</h1>
        <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5 uppercase tracking-wider">Observed camera-to-camera vehicle transitions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Observed Corridors" value={(summary?.corridorCount ?? 0)} isLoading={isLoading} icon={Route} colorTheme="cyan" />
        <StatCard label="Avg Transit Time" value={formatDuration(summary?.averageTravelSeconds ?? 0)} isLoading={isLoading} icon={Activity} colorTheme="violet" />
        <StatCard label="Peak Corridor Volume" value={(summary?.peakVolume ?? 0)} subtitle={(peak ? `${peak.origin.code} → ${peak.destination.code}` : 'No active corridors')} isLoading={isLoading} icon={Zap} colorTheme="amber" />
        <StatCard label="Recorded Flow" value={(totalFlow || 0)} subtitle="Stored transitions" isLoading={isLoading} icon={TrendingUp} colorTheme="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard padding="none" className="lg:col-span-2 flex flex-col">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Route size={15} className="text-cyan-500 dark:text-cyan-400" /> Major Transit Corridors
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
                <div key={`${route.origin.id}-${route.destination.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-[var(--glass-border)] hover:border-cyan-400/40 transition-all gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs text-cyan-500 dark:text-cyan-400 font-bold">{route.origin.code} ({route.origin.name})</span>
                    <ArrowRightLeft size={13} className="text-[var(--text-tertiary)] shrink-0" />
                    <span className="font-mono text-xs text-violet-500 dark:text-violet-400 font-bold">{route.destination.code} ({route.destination.name})</span>
                  </div>
                  <div className="flex items-center gap-5 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-[var(--text-primary)]">{route.volume.toLocaleString()} transitions · {route.uniqueVehicleCount.toLocaleString()} vehicles</div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-mono">Avg: {route.averageTravelSeconds != null ? formatDuration(route.averageTravelSeconds) : 'Travel time unavailable'} · {route.averageSpeed != null ? `${route.averageSpeed} km/h` : 'Speed unavailable'}</div>
                    </div>
                    <Badge variant="ok" size="sm" dot>Observed</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard padding="md" className="flex flex-col">
          <h2 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">Origin-Destination Flow</h2>
          <p className="text-[10px] font-mono text-[var(--text-secondary)] mb-4">Transitions grouped by source and target camera</p>
          <div className="flex-1 min-h-[240px] rounded-xl bg-white/[0.03] border border-[var(--glass-border)] flex flex-col items-center justify-center p-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-3 text-cyan-500 dark:text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <Route size={24} />
            </div>
            <p className="text-xs font-bold text-[var(--text-primary)] mb-1 font-display">{routes.length ? 'Observed Network Ready' : 'Awaiting Transitions'}</p>
            <p className="text-[10px] font-mono text-[var(--text-secondary)]">
              {routes.length ? `${totalFlow.toLocaleString()} transitions available for spatial analysis.` : 'Network ingestion stream active.'}
            </p>
            <div className="mt-3.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio size={11} className="animate-pulse" /> Live Network Stream
            </div>
          </div>
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
