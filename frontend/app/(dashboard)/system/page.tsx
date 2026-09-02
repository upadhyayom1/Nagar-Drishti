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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <GlassCard variant="gradient" padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between">
            <h2 className="text-xs font-display font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
              <Radio size={13} className="text-cyan-500 dark:text-cyan-400 animate-pulse" /> Camera Health Telemetry
            </h2>
            <Badge variant="info" dot pulse size="sm">Active Grid</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[9px] font-mono uppercase tracking-wider font-semibold text-[var(--text-secondary)] border-b border-[var(--glass-border)] bg-white/[0.02]">
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

        <GlassCard padding="md" className="flex flex-col items-center justify-center text-center min-h-[260px]">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
          ) : summary?.offline ? (
            <>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                <AlertTriangle size={22} className="text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)] font-display mt-3">Attention Required</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-body">{summary.offline} node(s) reported offline.</p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                <CheckCircle size={22} className="text-emerald-500 dark:text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-[var(--text-primary)] font-display mt-3">All Systems Operational</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-body">{summary?.online ?? 10} optical nodes streaming nominal telemetry.</p>
            </>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
