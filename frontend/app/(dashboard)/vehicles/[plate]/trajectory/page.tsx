'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Pause, RotateCcw, Radio } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { vehicleService } from '@/services/vehicleService';
import { useUIStore } from '@/store/uiStore';
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
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const theme = useUIStore((s) => s.theme);

  const { data: journey } = useQuery({
    queryKey: ['vehicleJourney', decodedPlate],
    queryFn: () => vehicleService.getVehicleJourney(decodedPlate),
  });

  useEffect(() => {
    if (!isPlaying || !journey || currentWaypointIndex >= journey.waypoints.length - 1) return;
    const delay = playbackSpeed === 1 ? 2200 : 1100;
    const timer = setTimeout(() => {
      setCurrentWaypointIndex((previousIndex) => {
        const nextIndex = previousIndex + 1;
        if (nextIndex >= journey.waypoints.length - 1) {
          setIsPlaying(false);
          return journey.waypoints.length - 1;
        }
        return nextIndex;
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [isPlaying, currentWaypointIndex, journey, playbackSpeed]);

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

  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const lightTileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
  const tileUrl = theme === 'light' ? lightTileUrl : darkTileUrl;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] -m-5 rounded-2xl overflow-hidden bg-[var(--bg-void)] border border-[var(--glass-border)] font-body">
      {/* Map Canvas */}
      <div className="flex-1 relative min-h-[350px]">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: '100%', width: '100%', minHeight: '350px' }}
          zoomControl={true}
        >
          <TileLayer
            key={theme}
            url={tileUrl}
            subdomains="abcd"
            maxZoom={19}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          />

          {/* Inactive planned route path */}
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#525252', weight: 1.5, opacity: 0.4, dashArray: '4 4' }}
          />

          {/* Active traversed route (Single Restrained Accent) */}
          {visibleRoute.length > 1 && (
            <Polyline
              positions={visibleRoute}
              pathOptions={{ color: theme === 'light' ? '#0d9488' : '#10a37f', weight: 3.5, opacity: 0.95 }}
            />
          )}

          {/* Waypoint nodes */}
          {waypoints.map((wp, i) => (
            <CircleMarker
              key={`${wp.cameraId}-${i}`}
              center={[wp.lat, wp.lng]}
              radius={i <= currentWaypointIndex ? 6 : 4}
              pathOptions={{
                color: i <= currentWaypointIndex ? '#10a37f' : '#525252',
                fillColor: i <= currentWaypointIndex ? '#10a37f' : '#212121',
                fillOpacity: i <= currentWaypointIndex ? 0.9 : 0.4,
                weight: 1.5,
              }}
            >
              <Popup>
                <div className="p-3 min-w-[190px] font-body text-[var(--text-primary)]">
                  <p className="font-semibold text-xs font-display text-[var(--text-primary)]">{wp.cameraName}</p>
                  <p className="text-[10px] text-[#10a37f] font-mono mt-0.5">{wp.cameraId}</p>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-2 space-y-0.5 font-mono">
                    <p>Time: <span className="font-semibold text-[var(--text-primary)]">{formatTime(wp.timestamp)}</span></p>
                    <p>Speed: <span className="text-[#10a37f] font-semibold">{wp.speed} km/h</span></p>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Active Pulsing Position Marker */}
          <CircleMarker
            center={[currentWaypoint.lat, currentWaypoint.lng]}
            radius={10}
            pathOptions={{
              color: '#ffffff',
              fillColor: '#10a37f',
              fillOpacity: 1,
              weight: 2,
            }}
          />
        </MapContainer>

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
          <div className="px-4 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--glass-border)] shadow-md">
            <span className="font-mono font-bold text-[var(--text-primary)] text-sm tracking-widest">{decodedPlate}</span>
          </div>
        </div>
      </div>

      {/* Trajectory Controls & Telemetry Side Panel */}
      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full lg:w-84 bg-[var(--glass-surface)] backdrop-blur-2xl border-t lg:border-t-0 lg:border-l border-[var(--glass-border)] overflow-y-auto p-5 space-y-4 shrink-0 flex flex-col"
      >
        <div>
          <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-display flex items-center gap-2">
            <Radio size={13} className="text-[#10a37f]" />
            Trajectory Telemetry
          </h2>
          <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-0.5">Route vector sequence &amp; metrics</p>
        </div>

        {/* Telemetry KPI Grid */}
        <div className="grid grid-cols-2 gap-2">
          <GlassCard padding="sm" className="p-3">
            <div className="text-[8px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">Distance</div>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)] mt-0.5">{formatDistance(journey.totalDistance)}</div>
          </GlassCard>
          <GlassCard padding="sm" className="p-3">
            <div className="text-[8px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">Duration</div>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)] mt-0.5">{formatDuration(journey.totalDuration)}</div>
          </GlassCard>
          <GlassCard padding="sm" className="p-3">
            <div className="text-[8px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">Avg Velocity</div>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)] mt-0.5">{formatSpeed(journey.avgSpeed)}</div>
          </GlassCard>
          <GlassCard padding="sm" className="p-3">
            <div className="text-[8px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">Waypoints</div>
            <div className="text-sm font-mono font-bold text-[var(--text-primary)] mt-0.5">{waypoints.length} nodes</div>
          </GlassCard>
        </div>

        {/* Playback Controls */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-[var(--glass-border)] space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[var(--text-secondary)]">Progress</span>
            <span className="text-[#10a37f] font-bold">{currentWaypointIndex + 1} / {waypoints.length}</span>
          </div>

          <input
            type="range"
            min={0}
            max={waypoints.length - 1}
            value={currentWaypointIndex}
            onChange={(e) => {
              setCurrentWaypointIndex(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="w-full accent-[#10a37f] h-1 rounded-lg bg-neutral-700 cursor-pointer"
          />

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1 cursor-pointer"
            >
              {isPlaying ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Playback</>}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : 1))}
              title="Toggle Speed"
              className="cursor-pointer font-mono font-bold text-xs px-3"
            >
              {playbackSpeed}x
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              title="Reset"
              className="cursor-pointer"
            >
              <RotateCcw size={13} />
            </Button>
          </div>
        </div>

        {/* Waypoints List */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-0.5">
          <p className="text-[9px] font-mono font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Waypoints</p>
          <div className="space-y-1.5">
            {waypoints.map((wp: Waypoint, i: number) => {
              const isCurrent = i === currentWaypointIndex;
              const isPassed = i < currentWaypointIndex;

              return (
                <div
                  key={`${wp.cameraId}-${i}-${wp.timestamp}`}
                  onClick={() => {
                    setCurrentWaypointIndex(i);
                    setIsPlaying(false);
                  }}
                  className={cn(
                    'p-2.5 rounded-xl border text-xs cursor-pointer transition-colors duration-150',
                    isCurrent
                      ? 'bg-[var(--bg-elevated-2)] border-neutral-700 text-[var(--text-primary)]'
                      : isPassed
                        ? 'bg-transparent border-transparent opacity-60 hover:opacity-100 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                        : 'bg-transparent border-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)]',
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-sm font-semibold font-display truncate text-[var(--text-primary)]">{wp.cameraName}</span>
                    <span className="text-[9px] font-mono text-[var(--text-secondary)]">{formatTime(wp.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-end text-[10px] font-mono">
                    <span className="text-[var(--text-secondary)]">{wp.speed} km/h</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
