'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Car, Gauge, TrendingUp, AlertTriangle, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { BentoStatDeck } from '@/components/ui/BentoStatDeck';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { Button }      from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { EmptyState }   from '@/components/ui/EmptyState';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { analyticsService } from '@/services/analyticsService';
import { submissionService } from '@/services/submissionService';

const AreaChartWrapper = dynamic(
  () => import('@/components/charts/AreaChartWrapper').then((m) => ({ default: m.AreaChartWrapper })),
  { ssr: false, loading: () => <SkeletonCard variant="chart" height={280} /> }
);
const BarChartWrapper = dynamic(
  () => import('@/components/charts/BarChartWrapper').then((m) => ({ default: m.BarChartWrapper })),
  { ssr: false, loading: () => <SkeletonCard variant="chart" height={280} /> }
);

/** Clamp congestion index to [0, 100] for display; preserve raw for tooltip */
function clampCongestionIndex(raw: number | undefined): { display: number; raw: number } {
  const r = raw ?? 0;
  return { display: Math.min(Math.round(r), 100), raw: Math.round(r) };
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'today' | '24h' | '7d' | '30d'>('24h');
  const analyticsWindow = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    if (timeRange === 'today') from.setHours(0, 0, 0, 0);
    if (timeRange === '24h') from.setHours(from.getHours() - 24);
    if (timeRange === '7d') from.setDate(from.getDate() - 7);
    if (timeRange === '30d') from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [timeRange]);

  const { data: stats, refetch, isFetching } = useQuery({ queryKey: ['trafficStats', analyticsWindow], queryFn: () => analyticsService.getTrafficStats(analyticsWindow) });
  const { data: hourlyData = [], isLoading: hourlyLoading }     = useQuery({ queryKey: ['hourlyTraffic', analyticsWindow],  queryFn: () => analyticsService.getHourlyTraffic(analyticsWindow) });
  const { data: cameraTraffic = [], isLoading: cameraLoading }  = useQuery({ queryKey: ['cameraTraffic', analyticsWindow],  queryFn: () => analyticsService.getCameraTraffic(analyticsWindow) });
  const { data: busiestRoads = [], isLoading: roadsLoading }    = useQuery({ queryKey: ['busiestRoads', analyticsWindow],   queryFn: () => analyticsService.getBusiestRoads(analyticsWindow) });
  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({ queryKey: ['submissions'], queryFn: submissionService.getSubmissions });

  const congestion = clampCongestionIndex(stats?.congestionIndex);

  const hourlyBars = hourlyData && hourlyData.length > 0
    ? hourlyData.slice(-12).map(d => {
        const max = Math.max(...hourlyData.map(h => h.vehicles), 1);
        return Math.max(10, (d.vehicles / max) * 100);
      })
    : [];

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      timeRange,
      stats,
      hourlyTraffic: hourlyData,
      cameraTraffic,
      busiestRoads,
      citizenReports: submissions,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NagarDrishti_Traffic_Report_${timeRange}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PageWrapper className="space-y-6 font-body">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight font-display">Traffic Analytics</h1>
          <p className="text-xs font-normal text-[var(--text-secondary)] mt-0.5 font-body">
            City-wide volume curves, vehicle velocity, and real-time congestion patterns
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Range Selector */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] dark:border-white/[0.08] text-xs font-display">
            {(['today', '24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg uppercase tracking-wider text-[10px] font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                  timeRange === range
                    ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="text-xs">
            <RefreshCw size={13} className={isFetching ? 'animate-spin text-cyan-400' : ''} />
            Sync
          </Button>

          <Button variant="secondary" size="sm" onClick={handleExportReport} className="text-xs">
            <Download size={13} />
            Export Data
          </Button>
        </div>
      </div>

      {/* ── KPI Stat Bento Grid ── */}
      <BentoStatDeck
        items={[
          {
            hero: true,
            category: 'VOLUME CENSUS',
            title: `Total Volume (${timeRange.toUpperCase()})`,
            badge: { text: 'LIVE ANPR', variant: 'cyan' },
            value: stats?.totalVehiclesToday ?? 0,
            unit: 'detections',
            icon: Car,
            colorTheme: 'brand',
            bars: {
              label: 'Diurnal Density Rhythm (Hourly)',
              rightText: `${hourlyData.length || 24} Time Samples`,
              data: hourlyBars,
            },
          },
          {
            category: 'CITY VELOCITY',
            title: 'Transit velocity curve',
            value: stats?.avgSpeed ?? 0,
            unit: 'km/h',
            icon: Gauge,
            colorTheme: 'cyan',
            visual: 'segmented-bar',
            visualMeta: {
              subLabel: 'Congestion State',
              subNote: 'Nominal Flow',
            },
          },
          {
            category: 'CONGESTION INDEX',
            title: 'Network density score',
            value: congestion.display,
            unit: '/ 100',
            icon: TrendingUp,
            colorTheme: 'amber',
            visual: 'ring',
            visualMeta: {
              ringValue: congestion.display,
              ringText: `${congestion.display}`,
              subLabel: 'Grid Pressure',
              subNote: congestion.raw > 100 ? 'Normalized Peak' : 'Stable Bandwidth',
            },
          },
          {
            category: 'CITIZEN REPORTS',
            title: 'Reported Accidents & Incidents',
            value: submissions.length,
            badge: { text: 'ACTIVE', variant: 'rose' },
            icon: AlertTriangle,
            colorTheme: 'rose',
            visual: 'action-link',
            visualMeta: {
              subNote: 'User-submitted events',
              actionLabel: 'Review',
              actionHref: '/submissions',
            },
          },
        ]}
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GlassCard glow="violet">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Hourly Vehicle Distribution
            </p>
            <Badge variant="violet" size="sm">Diurnal Curve</Badge>
          </div>
          {hourlyLoading ? (
            <SkeletonCard variant="chart" height={280} />
          ) : (
            <AreaChartWrapper data={hourlyData} dataKey="vehicles" xAxisKey="hour" color="#8b5cf6" gradientId="vehiclesGrad" />
          )}
        </GlassCard>

        <GlassCard glow="cyan">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Traffic Density by Camera Station
            </p>
            <Badge variant="cyan" size="sm">{cameraTraffic.length} Sensor Nodes</Badge>
          </div>
          {cameraLoading ? (
            <SkeletonCard variant="chart" height={280} />
          ) : (
            <BarChartWrapper data={cameraTraffic} dataKey="vehicleCount" xAxisKey="cameraName" color="#00f0ff" height={320} />
          )}
        </GlassCard>
      </div>

      {/* Corridors + Anomalies Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Busiest Corridors */}
        <GlassCard glow="emerald">
          <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">
            Busiest Transit Corridors
          </p>
          {roadsLoading ? (
            <SkeletonCard variant="list" rows={5} />
          ) : busiestRoads.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No Corridor Data" subtitle="Traffic corridor data is not yet available for the selected time window." />
          ) : (
            <div className="space-y-4">
              {busiestRoads.map((road, i) => (
                <div key={road.id} className="flex items-center gap-3.5">
                  <span className="text-xs font-mono text-cyan-400 font-bold w-6 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate font-display">{road.name}</span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)] shrink-0 ml-2">
                        {road.vehicleCount.toLocaleString()} detections
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--bg-elevated-2)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.5)] transition-all duration-700"
                        style={{ width: `${(road.vehicleCount / (busiestRoads[0]?.vehicleCount || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <Badge
                    variant={road.congestionLevel === 'congested' ? 'critical' : road.congestionLevel === 'high' ? 'warn' : 'ok'}
                    size="sm"
                  >
                    {road.congestionLevel}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Citizen Reports */}
        <GlassCard glow="amber" id="reports">
          <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">
            Citizen Reported Accidents
          </p>
          {submissionsLoading ? (
            <SkeletonCard variant="list" rows={4} />
          ) : submissions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No Reports"
              subtitle="No accidents or incidents have been reported."
            />
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {submissions.map((sub, i) => (
                <div key={sub.id || i} className="flex flex-col gap-1 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold text-xs font-display">
                      <AlertTriangle size={14} className="text-amber-400" />
                      {sub.title || 'Reported Incident'}
                    </div>
                    <Badge variant={sub.priority === 'HIGH' ? 'critical' : 'amber'} size="sm">
                      {sub.priority}
                    </Badge>
                  </div>
                  {sub.description && (
                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-body mt-1">{sub.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-[var(--text-tertiary)]">
                    <span>{sub.submitterName || 'Anonymous'}</span>
                    <span>{new Date(sub.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  );
}
