'use client';

import { use } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Clock, Route, Camera, BrainCircuit, Loader2 } from 'lucide-react';
import { GlassCard }   from '@/components/ui/GlassCard';
import { Badge }       from '@/components/ui/Badge';
import { Button }      from '@/components/ui/Button';
import { StatCard }    from '@/components/ui/StatCard';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { vehicleService } from '@/services/vehicleService';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { Detection } from '@/types';

export default function VehicleProfilePage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = use(params);
  const decodedPlate = decodeURIComponent(plate).toUpperCase();

  const { data: vehicle }        = useQuery({ queryKey: ['vehicle', decodedPlate],           queryFn: () => vehicleService.getVehicleByPlate(decodedPlate) });
  
  const { 
    data: detectionsData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteQuery({
    queryKey: ['vehicleDetections', decodedPlate],
    queryFn: ({ pageParam }) => vehicleService.getVehicleDetections(decodedPlate, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });
  const detections = detectionsData?.pages.flatMap(page => page.items) || [];
  
  const { data: heatmapData = Array(28).fill(0) } = useQuery({ queryKey: ['vehicleHeatmap', decodedPlate], queryFn: () => vehicleService.getVehicleHeatmap(decodedPlate) });
  const { data: journey }        = useQuery({ queryKey: ['vehicleJourney', decodedPlate],    queryFn: () => vehicleService.getVehicleJourney(decodedPlate) });
  const { data: intelligence, refetch: fetchIntelligence, isFetching: isAnalyzing } = useQuery({ 
    queryKey: ['vehicleIntelligence', decodedPlate], 
    queryFn: () => vehicleService.getVehicleIntelligence(decodedPlate),
    enabled: false
  });

  if (!vehicle) return (
    <PageWrapper className="flex items-center justify-center min-h-[450px]">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Querying Profile Records...</span>
      </div>
    </PageWrapper>
  );

  const statusVariant = vehicle.status === 'blacklist' ? 'danger' : vehicle.status === 'watchlist' ? 'warning' : 'success';
  const activityDays = heatmapData;
  const maxActivity = Math.max(...activityDays, 1);

  return (
    <PageWrapper className="space-y-6 font-body">
      <Link href="/vehicles" className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors">
        <ArrowLeft size={14} /> Back to Vehicle Intelligence
      </Link>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-data font-bold text-cyan-300 tracking-wider">{vehicle.plate}</h1>
            <Badge variant={statusVariant} size="md">{vehicle.status}</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-body">
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

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Detections" value={vehicle.totalDetections} icon={Eye}    colorTheme="cyan" />
        <StatCard label="Cameras Visited"  value={vehicle.camerasVisited}  icon={Camera} colorTheme="violet" />
        <StatCard label="First Sighted"    value={formatDate(vehicle.firstSeen)} icon={Clock} colorTheme="emerald" />
        <StatCard label="Last Sighted"     value={formatDate(vehicle.lastSeen)}  icon={Clock} colorTheme="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movement Timeline */}
        <GlassCard className="lg:col-span-2" padding="md">
          <div className="flex items-center justify-between mb-5">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">
              Temporal Movement Timeline
            </p>
            <Badge variant="cyan" size="sm">Chronological Feed</Badge>
          </div>

          <div className="relative">
            {/* Clean timeline vertical connector */}
            <div className="absolute left-[11px] top-3 bottom-3 w-[2px] bg-slate-800" />
            
            <div className="space-y-4">
              {detections.map((d: Detection, i: number) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (i % 15) * 0.05, duration: 0.25 }}
                  className="flex items-start gap-4 relative"
                >
                  <div className="w-6 h-6 rounded-full ring-2 ring-cyan-400 bg-slate-950 flex items-center justify-center shrink-0 z-10 shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                  </div>
                  <div className="flex-1 p-3.5 rounded-xl bg-black/40 border border-white/[0.07] hover:border-cyan-400/40 transition-all">
                    <div className="flex items-center justify-between mb-1.5">
                      <Link href={`/cameras/${d.cameraId}`} className="text-sm font-semibold text-white hover:text-cyan-300 transition-colors font-display">
                        {d.cameraName}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400">{formatDateTime(d.timestamp)}</span>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs font-mono text-slate-400">
                      <span className="text-cyan-400 font-semibold">{d.cameraName || d.cameraId}</span>
                      <span>Speed: <span className="text-white font-bold">{d.speed} km/h</span></span>
                      <span>Confidence: <span className="text-violet-400 font-bold">{d.confidence}%</span></span>
                      <span>Heading: {d.direction}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {hasNextPage && (
              <div className="mt-8 flex justify-center pb-4 relative z-10">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchNextPage()} 
                  disabled={isFetchingNextPage}
                  className="bg-slate-950 text-cyan-400 border-cyan-400/30 hover:bg-cyan-950/50"
                >
                  {isFetchingNextPage ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</> : 'Load Previous Records'}
                </Button>
              </div>
            )}
          </div>
          {detections.length === 0 && (
            <p className="text-center text-xs font-mono text-slate-500 py-10">No detection events recorded for this vehicle</p>
          )}
        </GlassCard>

        {/* Journey Summary & Patterns */}
        <div className="space-y-5">
          {journey && (
            <GlassCard padding="md">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-300 mb-4">
                Journey Analytics
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Total Distance', value: `${journey.totalDistance} km` },
                  { label: 'Travel Duration', value: `${journey.totalDuration} min` },
                  { label: 'Average Velocity', value: `${journey.avgSpeed} km/h` },
                  { label: 'Nodes Crossed', value: `${journey.waypoints.length} Cameras` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">{row.label}</span>
                    <span className="font-mono text-white font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard padding="md">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-300">
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
                <BrainCircuit className="w-8 h-8 text-cyan-400/50" />
                <p className="text-xs text-slate-400 font-mono">
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
                  { label: 'Anomalous Events', value: intelligence.summary.anomalous_events_detected.toString() },
                  { label: 'Frequent Hotspots', value: intelligence.summary.frequent_hotspots.toString() },
                  { label: 'Max Segment Speed', value: `${intelligence.summary.max_segment_speed_kmh} km/h` },
                  { label: 'Total Dwell Time', value: `${intelligence.summary.total_dwell_hours} hrs` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">{row.label}</span>
                    <span className={`font-mono font-bold ${row.label === 'Anomalous Events' && parseInt(row.value) > 0 ? 'text-red-400' : 'text-white'}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          <GlassCard padding="md">
            <p className="text-xs font-display font-bold uppercase tracking-wider text-slate-400 mb-3">
              Daily Activity Heatmap
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {activityDays.map((count, index) => {
                const level = count / maxActivity;
                const background = level >= 0.75 ? 'bg-cyan-400/80 shadow-[0_0_6px_rgba(6,182,212,0.5)]'
                  : level >= 0.4 ? 'bg-cyan-500/40'
                  : count > 0 ? 'bg-cyan-500/15'
                  : 'bg-slate-800/60';
                return <div key={index} title={`${count} detections`} className={`aspect-square rounded-sm ${background}`} />;
              })}
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-3">
              <span>Low Activity</span>
              <div className="flex gap-1">
                {['bg-slate-800/60', 'bg-cyan-500/15', 'bg-cyan-500/40', 'bg-cyan-400/80'].map((c, i) => (
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
