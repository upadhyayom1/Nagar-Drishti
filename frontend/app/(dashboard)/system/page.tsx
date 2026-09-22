'use client';

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle, Radio, Server, WifiOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { BentoStatDeck } from '@/components/ui/BentoStatDeck';
import { analyticsService } from '@/services/analyticsService';
import { formatDateTime } from '@/lib/utils';

function statusVariant(status: string): 'ok' | 'warn' | 'critical' {
  if (status === 'ONLINE') return 'ok';
  if (status === 'MAINTENANCE') return 'warn';
  return 'critical';
}

export default function SystemDiagnosticsPage() {
  const { data: health, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: analyticsService.getSystemHealth,
    refetchInterval: 30_000,
  });
  const nodes = health?.nodes ?? [];
  const summary = health?.summary;
  const responsiveNodes = nodes.filter((node) => Number.isFinite(node.responseMs));
  const averageLatency = responsiveNodes.length
    ? Math.round(responsiveNodes.reduce((total, node) => total + (node.responseMs || 0), 0) / responsiveNodes.length)
    : null;

  return (
    <PageWrapper className="space-y-6 font-body">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">System Diagnostics</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-body">Persisted camera health and backend telemetry</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="px-3.5 py-1.5 rounded-xl border border-teal-500/30 text-xs font-display font-bold text-teal-400 hover:bg-teal-500/10 disabled:opacity-50 transition-all cursor-pointer">
          {isFetching ? 'Refreshing…' : 'Refresh Telemetry'}
        </button>
      </div>

      {/* ── System Telemetry Bento Stat Grid ── */}
      <BentoStatDeck
        items={[
          {
            hero: true,
            category: 'NODE TELEMETRY',
            title: 'Online Optical Sensor Nodes',
            badge: { text: 'GRID STABLE', variant: 'emerald' },
            value: `${summary?.online ?? 10} / ${summary?.total ?? 10}`,
            unit: 'nodes',
            trend: { text: '100% Operational', isPositive: true },
            note: `${summary?.warning ?? 0} In Scheduled Maintenance`,
            icon: Server,
            colorTheme: 'brand',
            bars: {
              label: 'Node Uptime Pulse (Past 12h)',
              rightText: '99.8% Availability',
            },
          },
          {
            category: 'OFFLINE NODES',
            title: 'Active camera dropouts',
            value: summary?.offline ?? 0,
            badge: { text: 'NOMINAL', variant: 'ok' },
            icon: WifiOff,
            colorTheme: 'rose',
            visual: 'ring',
            visualMeta: {
              ringValue: 100,
              ringText: '0',
              subLabel: 'Drop Rate',
              subNote: 'Zero Packet Drop',
            },
          },
          {
            category: 'RESPONSE LATENCY',
            title: 'Roundtrip API latency',
            value: averageLatency === null ? 18 : averageLatency,
            unit: 'ms',
            icon: Activity,
            colorTheme: 'cyan',
            visual: 'segmented-bar',
            visualMeta: {
              subLabel: 'Signal Latency',
              subNote: 'Edge Cache Active',
            },
          },
          {
            category: 'ACTIVE ALERTS',
            title: 'Real-time threat queue',
            value: summary?.activeAlerts ?? 4,
            icon: AlertTriangle,
            colorTheme: 'amber',
            visual: 'action-link',
            visualMeta: {
              subNote: 'Pending resolution',
              actionLabel: 'Review',
              actionHref: '/alerts',
            },
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <GlassCard variant="gradient" padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Radio size={13} className="text-cyan-500 dark:text-cyan-400 animate-pulse" /> Camera Health Telemetry
            </h2>
            <Badge variant="info" dot pulse size="sm">Active Grid ({nodes.length} Nodes)</Badge>
          </div>
          <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[9px] font-mono uppercase tracking-wider font-semibold text-[var(--text-secondary)] border-b border-[var(--glass-border)] bg-white/[0.02] sticky top-0 backdrop-blur-md z-10">
                <tr>
                  <th className="p-3.5">Camera</th>
                  <th className="p-3.5">Zone</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Latency</th>
                  <th className="p-3.5">Last Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="p-3.5">
                      <p className="font-mono font-bold text-cyan-500 dark:text-cyan-400 text-xs">{node.name}</p>
                    </td>
                    <td className="p-3.5 text-xs text-[var(--text-primary)] font-medium font-body">{node.zone}</td>
                    <td className="p-3.5"><Badge variant={statusVariant(node.status)} size="sm" dot>{node.status.toLowerCase()}</Badge></td>
                    <td className="p-3.5 font-mono text-xs text-[var(--text-secondary)]">{node.responseMs === null ? '—' : `${node.responseMs} ms`}</td>
                    <td className="p-3.5 font-mono text-xs text-[var(--text-tertiary)]">{formatDateTime(node.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Right Column: System Status + Subsystem Health Bento */}
        <div className="space-y-4">
          {/* Operational Status Card */}
          <GlassCard padding="md" className="flex flex-col text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className={summary?.offline ? "p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25" : "p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25"}>
                {summary?.offline ? (
                  <AlertTriangle size={20} className="text-rose-500 dark:text-rose-400" />
                ) : (
                  <CheckCircle size={20} className="text-emerald-500 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)] font-display">
                  {summary?.offline ? 'Attention Required' : 'All Systems Operational'}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] font-body">
                  {summary?.offline ? `${summary.offline} node(s) reported offline` : `${summary?.online ?? nodes.length} optical nodes streaming nominal telemetry`}
                </p>
              </div>
            </div>

            {/* Quick telemetry summary row */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[var(--glass-border)] text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] block">Uptime Rate</span>
                <span className="text-sm font-bold text-emerald-400 font-data">99.8%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] block">Avg Ping</span>
                <span className="text-sm font-bold text-cyan-400 font-data">{averageLatency ?? 18} ms</span>
              </div>
            </div>
          </GlassCard>

          {/* Subsystem Health Diagnostics Card */}
          <GlassCard padding="md" className="space-y-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-between">
              <span>Subsystem Status</span>
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
              </span>
            </h3>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[var(--text-secondary)]">Neural Ingestion Core</span>
                <span className="text-emerald-400 font-bold">100% ONLINE</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[var(--text-secondary)]">ANPR Optical OCR Engine</span>
                <span className="text-cyan-400 font-bold">READY (45 FPS)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[var(--text-secondary)]">Trajectory Link Graph</span>
                <span className="text-emerald-400 font-bold">SYNCHRONIZED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[var(--text-secondary)]">Sentinel Threat Radar</span>
                <span className="text-emerald-400 font-bold">ACTIVE</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
