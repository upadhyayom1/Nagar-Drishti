'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw, Activity, Radio } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button }    from '@/components/ui/Button';
import { vehicleService } from '@/services/vehicleService';
import { formatTime, formatDuration, formatDistance, formatSpeed, cn } from '@/lib/utils';
import type { Waypoint } from '@/types';
import 'leaflet/dist/leaflet.css';

// Dynamic Leaflet Map with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

export default function TrajectoryPage({ params }: { params: Promise<{ plate: string }> }) {
  const { plate } = use(params);
  const decodedPlate = decodeURIComponent(plate).toUpperCase();
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const { data: journey } = useQuery({
    queryKey: ['vehicleJourney', decodedPlate],
    queryFn: () => vehicleService.getVehicleJourney(decodedPlate),
  });

  useEffect(() => {
    setIsMapReady(true);
  }, []);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying || !journey) return;
    if (currentWaypointIndex >= journey.waypoints.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentWaypointIndex((prev) => prev + 1);
    }, 2200);
    return () => clearTimeout(timer);
  }, [isPlaying, currentWaypointIndex, journey]);

  const handleReset = useCallback(() => {
    setCurrentWaypointIndex(0);
    setIsPlaying(false);
  }, []);

  if (!journey) {
    return (
      <div className="flex items-center justify-center min-h-[500px] text-xs font-mono text-[var(--text-secondary)]">
        Interpolating Route Vectors...
      </div>
    );
  }

  const waypoints = journey.waypoints;
  const routeCoords = waypoints.map((w) => [w.lat, w.lng] as [number, number]);
  const visibleRoute = routeCoords.slice(0, currentWaypointIndex + 1);
  const centerLat = waypoints.reduce((s, w) => s + w.lat, 0) / waypoints.length;
  const centerLng = waypoints.reduce((s, w) => s + w.lng, 0) / waypoints.length;
  const currentWaypoint = waypoints[currentWaypointIndex];

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] -m-6 rounded-[1.75rem] overflow-hidden bg-[var(--bg-void)] border border-[rgba(150,190,210,0.12)] font-sans">
      {/* Map Canvas */}
      <div className="flex-1 relative min-h-[350px]">
        {isMapReady && (
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={12}
            style={{ height: '100%', width: '100%', minHeight: '350px' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Inactive future route path */}
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#38bdf8', weight: 2, opacity: 0.25, dashArray: '6 6' }}
            />

            {/* Active traversed route (Electric Cyan) */}
            {visibleRoute.length > 1 && (
              <Polyline
                positions={visibleRoute}
                pathOptions={{ color: '#06b6d4', weight: 4.5, opacity: 0.95 }}
              />
            )}

            {/* Waypoint nodes */}
            {waypoints.map((wp, i) => (
              <CircleMarker
                key={wp.cameraId}
                center={[wp.lat, wp.lng]}
                radius={i <= currentWaypointIndex ? 8 : 5}
                pathOptions={{
                  color:       i <= currentWaypointIndex ? '#06b6d4' : '#38bdf8',
                  fillColor:   i <= currentWaypointIndex ? '#06b6d4' : '#0a0e1e',
                  fillOpacity: i <= currentWaypointIndex ? 0.9 : 0.4,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[190px]">
                    <p className="font-bold text-xs text-primary font-display">{wp.cameraName}</p>
                    <p className="text-[10px] text-[var(--brand-cyan)] font-mono mt-0.5">{wp.cameraId}</p>
                    <div className="text-[10px] text-[var(--text-secondary)] mt-2 space-y-0.5 font-mono">
                      <p>Time: <span className="text-primary font-bold">{formatTime(wp.timestamp)}</span></p>
                      <p>Speed: <span className="text-[var(--brand-cyan)] font-bold">{wp.speed} km/h</span></p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Active Pulsing Position Marker */}
            <CircleMarker
              center={[currentWaypoint.lat, currentWaypoint.lng]}
              radius={14}
              pathOptions={{
                color:       '#38bdf8',
                fillColor:   '#06b6d4',
                fillOpacity: 1,
                weight: 3.5,
              }}
            />
          </MapContainer>
        )}

        {/* Back button overlay */}
        <div className="absolute top-4 left-4 z-[1000]">
          <Link href={`/vehicles/${decodedPlate}`}>
            <Button variant="secondary" size="sm">
              <ArrowLeft size={14} /> Back to Profile
            </Button>
          </Link>
        </div>

        {/* Target Plate Floating Badge */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="px-6 py-2 rounded-full bg-[var(--bg-elevated)]/90 backdrop-blur-2xl border border-[var(--brand-cyan)]/40 shadow-[0_0_25px_rgba(0,230,176,0.35)]">
            <span className="font-mono font-extrabold text-[var(--brand-cyan)] text-sm tracking-widest">{decodedPlate}</span>
          </div>
        </div>
      </div>

      {/* Trajectory Controls & Telemetry Side Panel */}
      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full lg:w-88 bg-[var(--bg-elevated)]/90 backdrop-blur-3xl border-t lg:border-t-0 lg:border-l border-[rgba(150,190,210,0.12)] overflow-y-auto p-6 space-y-4 shrink-0 flex flex-col"
      >
        <div>
          <h2 className="text-sm font-bold text-primary uppercase tracking-wider font-display flex items-center gap-2">
            <Radio size={14} className="text-[var(--brand-cyan)]" />
            Trajectory Telemetry
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">Route vector sequence and speed metrics</p>
        </div>

        {/* Telemetry KPI Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <GlassCard padding="sm">
            <div className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">Distance</div>
            <div className="text-base font-mono font-extrabold text-white">{formatDistance(journey.totalDistance)}</div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">Duration</div>
            <div className="text-base font-mono font-extrabold text-white">{formatDuration(journey.totalDuration)}</div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">Avg Velocity</div>
            <div className="text-base font-mono font-extrabold text-cyan-400">{formatSpeed(journey.avgSpeed)}</div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-[8px] font-mono text-slate-400 uppercase tracking-wider">Nodes Crossed</div>
            <div className="text-base font-mono font-extrabold text-violet-400">{waypoints.length} Nodes</div>
          </GlassCard>
        </div>

        {/* Playback Controls */}
        <GlassCard padding="sm" className="space-y-3.5">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="p-2 text-[var(--text-secondary)] hover:text-primary transition-colors"
              title="Reset Path"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-[var(--brand-cyan)] to-[var(--brand-azure)] text-[var(--bg-void)] hover:shadow-[0_0_30px_rgba(0,230,176,0.6)] transition-all font-bold"
            >
              {isPlaying ? <Pause size={17} /> : <Play size={17} />}
            </button>
          </div>

          <div>
            <input
              type="range"
              min={0}
              max={waypoints.length - 1}
              value={currentWaypointIndex}
              onChange={(e) => {
                setCurrentWaypointIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-[9px] font-mono text-[var(--text-secondary)] mt-1.5">
              <span>{formatTime(waypoints[0].timestamp)}</span>
              <span>{formatTime(waypoints[waypoints.length - 1].timestamp)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Waypoint List */}
        <div className="flex-1 space-y-2 overflow-y-auto pr-1">
          <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Waypoint Node Sequence
          </h3>
          <div className="space-y-2">
            {waypoints.map((wp: Waypoint, i: number) => (
              <button
                key={wp.cameraId}
                onClick={() => { setCurrentWaypointIndex(i); setIsPlaying(false); }}
                className={cn(
                  'w-full text-left p-3.5 rounded-2xl border transition-all',
                  i === currentWaypointIndex
                    ? 'bg-[var(--brand-cyan)]/15 border-[var(--brand-cyan)]/50 shadow-[0_0_20px_rgba(0,230,176,0.2)]'
                    : i <= currentWaypointIndex
                    ? 'bg-[var(--bg-void)]/80 border-[rgba(150,190,210,0.1)] hover:border-[rgba(150,190,210,0.25)]'
                    : 'bg-transparent border-white/5 opacity-40'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary font-display">{wp.cameraName}</span>
                  <span className="text-[10px] font-mono text-[var(--text-secondary)]">{formatTime(wp.timestamp)}</span>
                </div>
                <div className="text-[10px] font-mono text-[var(--brand-cyan)] mt-0.5">
                  {wp.speed} km/h · {wp.direction}
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
