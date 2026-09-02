'use client';

import { use, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Clock, Route, Camera, BrainCircuit, Scan } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { GlassCard }    from '@/components/ui/GlassCard';
import { Badge }        from '@/components/ui/Badge';
import { Button }       from '@/components/ui/Button';
import { BentoStatDeck } from '@/components/ui/BentoStatDeck';
import { EmptyState }   from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { PageWrapper }  from '@/components/layout/PageWrapper';
import { vehicleService } from '@/services/vehicleService';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { Detection } from '@/types';

export default function VehicleProfilePage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = use(params);
  const decodedPlate = decodeURIComponent(plate).toUpperCase();

  const { data: vehicle, isLoading: vehicleLoading }   = useQuery({ queryKey: ['vehicle', decodedPlate],           queryFn: () => vehicleService.getVehicleByPlate(decodedPlate) });
  const {
    data: detectionsData,
    isLoading: detectionsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['vehicleDetections', decodedPlate],
    queryFn: ({ pageParam }) => vehicleService.getVehicleDetections(decodedPlate, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const { data: journey }                              = useQuery({ queryKey: ['vehicleJourney', decodedPlate],    queryFn: () => vehicleService.getVehicleJourney(decodedPlate) });
  const { data: intelligence, refetch: fetchIntelligence, isFetching: isAnalyzing } = useQuery({
    queryKey: ['vehicleIntelligence', decodedPlate],
    queryFn: () => vehicleService.getVehicleIntelligence(decodedPlate),
    enabled: false,
  });

  if (vehicleLoading) return (
    <PageWrapper className="flex items-center justify-center min-h-[450px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-widest">Querying Profile Records...</span>
      </div>
    </PageWrapper>
  );

  if (!vehicle) return (
    <PageWrapper className="flex items-center justify-center min-h-[450px]">
      <EmptyState icon={Scan} title="Vehicle Not Found" subtitle={`No profile found for plate ${decodedPlate}.`} />
    </PageWrapper>
  );

  const statusVariant = vehicle.status === 'blacklist' ? 'danger' : vehicle.status === 'watchlist' ? 'warning' : 'success';
  const detectionsItems = detectionsData?.pages.flatMap((page) => page.items) || [];

  const activityDays = Array.from({ length: 28 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (27 - index));
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    return detectionsItems.filter((detection) => {
      const timestamp = new Date(detection.timestamp);
      return timestamp >= day && timestamp < nextDay;
    }).length || 0;
  });
  const maxActivity = Math.max(...activityDays, 1);

  return (
    <PageWrapper className="space-y-6 font-body">
      <Link href="/vehicles" className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-cyan-400 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 rounded">
        <ArrowLeft size={14} /> Back to Vehicle Intelligence
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-data font-bold text-cyan-400 tracking-wider">{vehicle.plate}</h1>
            <Badge variant={statusVariant} size="md">{vehicle.status}</Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-body">
            {vehicle.color} {vehicle.vehicleType}{vehicle.registeredCity ? ` · Registered in ${vehicle.registeredCity}` : ''}
          </p>
        </div>
        {journey && (
          <Link href={`/vehicles/${vehicle.plate}/trajectory`}>
            <Button variant="primary" size="md">
              <Route size={16} /> View Animated Trajectory
            </Button>
          </Link>
        )}
      </div>

      {/* ── Vehicle Intelligence Bento Stat Grid ── */}
      <BentoStatDeck
        items={[
          {
            hero: true,
            category: 'OPTICAL SURVEILLANCE',
            title: 'Recorded Plate Detections',
            badge: {
              text: vehicle.status.toUpperCase(),
              variant: vehicle.status === 'blacklist' ? 'critical' : vehicle.status === 'watchlist' ? 'warn' : 'ok',
            },
            value: vehicle.totalDetections,
            unit: 'events',
            trend: { text: `${vehicle.camerasVisited} Nodes Visited`, isPositive: true },
            note: `Registered: ${vehicle.registeredCity || 'Prayagraj Zone'}`,
            icon: Eye,
            colorTheme: 'brand',
            bars: {
              label: 'Detection Frequency Rhythm (Past 12h)',
              rightText: `${vehicle.totalDetections} Total Telemetry Hits`,
            },
          },
          {
            category: 'CAMERA COVERAGE',
            title: 'Optical nodes visited',
            value: vehicle.camerasVisited,
            unit: '/ 10',
            icon: Camera,
            colorTheme: 'violet',
            visual: 'ring',
            visualMeta: {
              ringValue: Math.min(Math.round((vehicle.camerasVisited / 10) * 100), 100),
              ringText: `${vehicle.camerasVisited}`,
              subLabel: 'Grid Exposure',
              subNote: 'Spatial Distribution',
            },
          },
          {
            category: 'FIRST SIGHTED',
            title: 'Initial optical capture',
            value: formatDate(vehicle.firstSeen),
            icon: Clock,
            colorTheme: 'emerald',
            visual: 'segmented-bar',
            visualMeta: {
              subLabel: 'Temporal Anchor',
              subNote: 'First Log Entry',
            },
          },
          {
            category: 'LAST SIGHTED',
            title: 'Most recent detection',
            value: formatDate(vehicle.lastSeen),
            icon: Clock,
            colorTheme: 'amber',
            visual: 'action-link',
            visualMeta: {
              subNote: 'Last active position',
              actionLabel: 'Trajectory',
              actionHref: journey ? `/vehicles/${vehicle.plate}/trajectory` : undefined,
            },
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movement Timeline */}
        <GlassCard className="lg:col-span-2" padding="md">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Temporal Movement Timeline
            </p>
            <Badge variant="cyan" size="sm">Chronological Feed</Badge>
          </div>

          {detectionsLoading ? (
            <SkeletonCard variant="list" rows={5} />
          ) : detectionsItems.length === 0 ? (
            <EmptyState icon={Eye} title="No Detection Events" subtitle="No detection events recorded for this vehicle yet." />
          ) : (
            <div className="relative">
              {/* Timeline connector */}
              <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-[var(--bg-elevated-2)]" />

              <div className="space-y-4">
                {detectionsItems.map((d: Detection, i: number) => (

                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                    className="flex items-start gap-4 relative"
                  >
                    <div className="w-6 h-6 rounded-full ring-2 ring-cyan-400 bg-[var(--bg-void)] flex items-center justify-center shrink-0 z-10 shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    </div>
                    <div className="flex-1 p-3.5 rounded-xl bg-[var(--bg-elevated)]/60 border border-[var(--glass-border)] hover:border-cyan-400/40 transition-all">
                      <div className="flex items-center justify-between mb-1.5">
                        <Link href={`/cameras/${d.cameraId}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-cyan-400 transition-colors font-display">
                          {d.cameraName}
                        </Link>
                        <span className="text-[10px] font-mono text-[var(--text-tertiary)]">{formatDateTime(d.timestamp)}</span>
                      </div>
                      {/* Bug #4 fixed: each detection shows its own recorded speed via d.speed */}
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-[var(--text-secondary)]">
                        <span className="text-cyan-400 font-semibold">{d.cameraName}</span>
                        <span>Speed: <span className="text-[var(--text-primary)] font-bold tabular-nums">{d.speed} km/h</span></span>
                        <span>Confidence: <span className="text-violet-400 font-bold">{d.confidence}%</span></span>
                        <span>Heading: {d.direction}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {/* Infinite Scroll Trigger */}
                {hasNextPage && (
                  <div ref={loadMoreRef} className="flex justify-center py-4">
                    <div className="w-6 h-6 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>

        {/* Journey Summary & Patterns */}
        <div className="space-y-5">
          {journey && (
            <GlassCard padding="md">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">
                Journey Analytics
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Total Distance',  value: `${journey.totalDistance} km` },
                  { label: 'Travel Duration', value: `${journey.totalDuration} min` },
                  { label: 'Average Velocity', value: `${journey.avgSpeed} km/h` },
                  { label: 'Nodes Crossed',   value: `${journey.waypoints.length} Cameras` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">{row.label}</span>
                    <span className="font-mono text-[var(--text-primary)] font-bold tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-primary)]">
                AI Behavior Analysis
              </p>
              {intelligence && (
                <Badge variant={intelligence.summary.anomalous_events_detected > 0 ? 'danger' : 'success'} size="sm">
                  {intelligence.summary.anomalous_events_detected > 0 ? 'Anomalies Detected' : 'Normal'}
                </Badge>
              )}
            </div>

            {!intelligence && (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <BrainCircuit className="w-8 h-8 text-cyan-400/50 animate-pulse" />
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  Run deep learning analysis to detect anomalous behavior, frequent hotspots, and calculate precise dwell times.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => fetchIntelligence()}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? 'Analyzing Trajectory...' : 'Run AI Analysis'}
                </Button>
              </div>
            )}

            {intelligence && (
              <div className="space-y-3">
                {[
                  { label: 'Anomalous Events',   value: intelligence.summary.anomalous_events_detected.toString() },
                  { label: 'Frequent Hotspots',  value: intelligence.summary.frequent_hotspots.toString() },
                  { label: 'Max Segment Speed',  value: `${intelligence.summary.max_segment_speed_kmh} km/h` },
                  { label: 'Total Dwell Time',   value: `${intelligence.summary.total_dwell_hours} hrs` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">{row.label}</span>
                    <span className={`font-mono font-bold tabular-nums ${row.label === 'Anomalous Events' && parseInt(row.value) > 0 ? 'text-rose-400' : 'text-[var(--text-primary)]'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Daily Activity Heatmap */}
          <GlassCard padding="md">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-3">
              Daily Activity Heatmap
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {activityDays.map((count, index) => {
                const level = count / maxActivity;
                const background =
                  level >= 0.75 ? 'bg-cyan-400/80 shadow-[0_0_6px_rgba(6,182,212,0.5)]'
                  : level >= 0.4  ? 'bg-cyan-500/40'
                  : count > 0     ? 'bg-cyan-500/15'
                  : 'bg-[var(--bg-elevated-2)]';
                return (
                  <div
                    key={index}
                    title={`${count} detections`}
                    className={`aspect-square rounded-sm ${background} transition-all duration-200 hover:scale-110`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-tertiary)] mt-3">
              <span>Low Activity</span>
              <div className="flex gap-1">
                {['bg-[var(--bg-elevated-2)]', 'bg-cyan-500/15', 'bg-cyan-500/40', 'bg-cyan-400/80'].map((c, i) => (
                  <div key={i} className={`w-2.5 h-2.5 rounded-sm ${c}`} />
                ))}
              </div>
              <span>Peak Detection</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
