'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Car, Eye, MapPin, Clock, Route, Camera, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { vehicleService } from '@/services/vehicleService';
import { formatDateTime, formatTime, formatDate } from '@/lib/utils';
import type { Detection } from '@/types';

export default function VehicleProfilePage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = use(params);
  const decodedPlate = decodeURIComponent(plate).toUpperCase();

  const { data: vehicle } = useQuery({
    queryKey: ['vehicle', decodedPlate],
    queryFn: () => vehicleService.getVehicleByPlate(decodedPlate),
  });

  const { data: detections = [] } = useQuery({
    queryKey: ['vehicleDetections', decodedPlate],
    queryFn: () => vehicleService.getVehicleDetections(decodedPlate),
  });

  const { data: journey } = useQuery({
    queryKey: ['vehicleJourney', decodedPlate],
    queryFn: () => vehicleService.getVehicleJourney(decodedPlate),
  });

  if (!vehicle) {
    return (
      <PageWrapper className="flex items-center justify-center min-h-[400px]">
        <div className="text-text-secondary">Loading vehicle data...</div>
      </PageWrapper>
    );
  }

  const statusVariant = vehicle.status === 'blacklist' ? 'danger' : vehicle.status === 'watchlist' ? 'warning' : 'default';

  return (
    <PageWrapper className="space-y-6">
      {/* Back */}
      <Link href="/vehicles" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to Vehicle Search
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-data font-bold text-accent-cyan">{vehicle.plate}</h1>
            <Badge variant={statusVariant} size="md">{vehicle.status}</Badge>
          </div>
          <p className="text-sm text-text-secondary mt-1">
            {vehicle.color} {vehicle.vehicleType}
            {vehicle.registeredCity && ` • Registered in ${vehicle.registeredCity}`}
          </p>
        </div>
        {journey && (
          <Link href={`/vehicles/${vehicle.plate}/trajectory`}>
            <Button variant="primary" size="md">
              <Route size={16} />
              View Full Trajectory
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Detections" value={vehicle.totalDetections} icon={Eye} accentColor="var(--accent-cyan)" />
        <StatCard label="Cameras Visited" value={vehicle.camerasVisited} icon={Camera} accentColor="var(--accent-blue)" />
        <StatCard label="First Seen" value={formatDate(vehicle.firstSeen)} icon={Clock} />
        <StatCard label="Last Seen" value={formatDate(vehicle.lastSeen)} icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movement Timeline */}
        <GlassCard className="lg:col-span-2" padding="md">
          <h3 className="text-sm font-semibold font-display mb-4">Movement Timeline</h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-accent-cyan to-accent-blue opacity-30" />

            <div className="space-y-4">
              {detections.map((detection: Detection, index: number) => (
                <motion.div
                  key={detection.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="flex items-start gap-4 relative"
                >
                  {/* Timeline dot */}
                  <div className="w-6 h-6 rounded-full border-2 border-accent-cyan bg-bg-void flex items-center justify-center flex-shrink-0 z-10">
                    <div className="w-2 h-2 rounded-full bg-accent-cyan" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-3 rounded-lg bg-white/[0.02] border border-border-glass">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/cameras/${detection.cameraId}`} className="text-sm font-medium text-text-primary hover:text-accent-cyan transition-colors">
                        {detection.cameraName}
                      </Link>
                      <span className="text-[10px] font-data text-text-secondary">{formatDateTime(detection.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span className="font-data">{detection.cameraId}</span>
                      <span>Speed: <span className="font-data text-text-primary">{detection.speed} km/h</span></span>
                      <span>Confidence: <span className="font-data text-text-primary">{detection.confidence}%</span></span>
                      <span>Direction: {detection.direction}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {detections.length === 0 && (
            <p className="text-center text-text-secondary text-sm py-8">No detection events recorded</p>
          )}
        </GlassCard>

        {/* Journey Summary + Activity */}
        <div className="space-y-4">
          {journey && (
            <GlassCard padding="md">
              <h3 className="text-sm font-semibold font-display mb-3">Journey Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Total Distance</span>
                  <span className="font-data text-text-primary">{journey.totalDistance} km</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Duration</span>
                  <span className="font-data text-text-primary">{journey.totalDuration} min</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Avg Speed</span>
                  <span className="font-data text-text-primary">{journey.avgSpeed} km/h</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Waypoints</span>
                  <span className="font-data text-text-primary">{journey.waypoints.length}</span>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Activity Heatmap placeholder */}
          <GlassCard padding="md">
            <h3 className="text-sm font-semibold font-display mb-3">Activity Pattern</h3>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 28 }, (_, i) => {
                const intensity = Math.random();
                const bg = intensity > 0.7 ? 'bg-accent-cyan/60' : intensity > 0.4 ? 'bg-accent-cyan/30' : intensity > 0.15 ? 'bg-accent-cyan/10' : 'bg-white/[0.03]';
                return <div key={i} className={`aspect-square rounded-sm ${bg}`} />;
              })}
            </div>
            <div className="flex items-center justify-between text-[9px] text-text-secondary mt-2">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-white/[0.03]" />
                <div className="w-2.5 h-2.5 rounded-sm bg-accent-cyan/10" />
                <div className="w-2.5 h-2.5 rounded-sm bg-accent-cyan/30" />
                <div className="w-2.5 h-2.5 rounded-sm bg-accent-cyan/60" />
              </div>
              <span>More</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </PageWrapper>
  );
}
