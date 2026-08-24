'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Route, Gauge, Camera, Play, Pause, RotateCcw } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { vehicleService } from '@/services/vehicleService';
import { formatTime, formatDuration, formatDistance, formatSpeed } from '@/lib/utils';
import type { Waypoint } from '@/types';
import 'leaflet/dist/leaflet.css';

// Dynamic map imports
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then(mod => mod.Polyline),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then(mod => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
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

  // Need to delay map rendering until client-side
  useEffect(() => {
    setIsMapReady(true);
  }, []);

  // Animation playback
  useEffect(() => {
    if (!isPlaying || !journey) return;
    if (currentWaypointIndex >= journey.waypoints.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCurrentWaypointIndex(prev => prev + 1);
    }, 2000); // 2s per waypoint
    return () => clearTimeout(timer);
  }, [isPlaying, currentWaypointIndex, journey]);

  const handleReset = useCallback(() => {
    setCurrentWaypointIndex(0);
    setIsPlaying(false);
  }, []);

  if (!journey) {
    return (
      <div className="flex items-center justify-center min-h-[600px] text-text-secondary">
        Loading trajectory...
      </div>
    );
  }

  const waypoints = journey.waypoints;
  const routeCoords = waypoints.map(w => [w.lat, w.lng] as [number, number]);
  const visibleRoute = routeCoords.slice(0, currentWaypointIndex + 1);
  const centerLat = waypoints.reduce((s, w) => s + w.lat, 0) / waypoints.length;
  const centerLng = waypoints.reduce((s, w) => s + w.lng, 0) / waypoints.length;
  const currentWaypoint = waypoints[currentWaypointIndex];

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height,64px))] -m-6">
      {/* Map Area */}
      <div className="flex-1 relative">
        {isMapReady && (
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap &copy; CARTO'
            />

            {/* Full route (dim) */}
            <Polyline
              positions={routeCoords}
              pathOptions={{ color: '#5b8cff', weight: 2, opacity: 0.2, dashArray: '8 8' }}
            />

            {/* Animated route (bright) */}
            {visibleRoute.length > 1 && (
              <Polyline
                positions={visibleRoute}
                pathOptions={{ color: '#22d3ee', weight: 3, opacity: 0.8 }}
              />
            )}

            {/* Camera waypoint markers */}
            {waypoints.map((wp, i) => (
              <CircleMarker
                key={wp.cameraId}
                center={[wp.lat, wp.lng]}
                radius={i <= currentWaypointIndex ? 8 : 5}
                pathOptions={{
                  color: i <= currentWaypointIndex ? '#22d3ee' : '#5b8cff',
                  fillColor: i <= currentWaypointIndex ? '#22d3ee' : '#5b8cff',
                  fillOpacity: i <= currentWaypointIndex ? 0.8 : 0.3,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="bg-[#0e1016] text-[#eef0f4] p-3 rounded-lg min-w-[180px] -m-[20px] -my-[10px]">
                    <p className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{wp.cameraName}</p>
                    <p className="text-[10px] text-[#8a8d99] mt-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{wp.cameraId}</p>
                    <div className="text-xs text-[#8a8d99] mt-2 space-y-0.5">
                      <p>Time: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#eef0f4' }}>{formatTime(wp.timestamp)}</span></p>
                      <p>Speed: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#eef0f4' }}>{wp.speed} km/h</span></p>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* Current position marker */}
            <CircleMarker
              center={[currentWaypoint.lat, currentWaypoint.lng]}
              radius={12}
              pathOptions={{
                color: '#22d3ee',
                fillColor: '#22d3ee',
                fillOpacity: 0.9,
                weight: 3,
              }}
            />
          </MapContainer>
        )}

        {/* Back button overlay */}
        <div className="absolute top-4 left-4 z-[1000]">
          <Link href={`/vehicles/${decodedPlate}`}>
            <Button variant="secondary" size="sm">
              <ArrowLeft size={14} />
              Back to Profile
            </Button>
          </Link>
        </div>

        {/* Plate overlay */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="glass-panel px-4 py-2 rounded-full">
            <span className="font-data font-bold text-accent-cyan text-lg">{decodedPlate}</span>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-80 glass-panel border-l border-border-glass overflow-y-auto p-4 space-y-4"
      >
        <h2 className="text-lg font-display font-bold">Trajectory View</h2>

        {/* Journey Stats */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard padding="sm">
            <div className="text-[10px] text-text-secondary uppercase tracking-wider">Distance</div>
            <div className="text-lg font-data font-semibold text-text-primary">{formatDistance(journey.totalDistance)}</div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-[10px] text-text-secondary uppercase tracking-wider">Duration</div>
            <div className="text-lg font-data font-semibold text-text-primary">{formatDuration(journey.totalDuration)}</div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-[10px] text-text-secondary uppercase tracking-wider">Avg Speed</div>
            <div className="text-lg font-data font-semibold text-text-primary">{formatSpeed(journey.avgSpeed)}</div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-[10px] text-text-secondary uppercase tracking-wider">Cameras</div>
            <div className="text-lg font-data font-semibold text-text-primary">{waypoints.length}</div>
          </GlassCard>
        </div>

        {/* Playback Controls */}
        <GlassCard padding="sm">
          <div className="flex items-center justify-center gap-3">
            <button onClick={handleReset} className="p-2 text-text-secondary hover:text-text-primary transition-colors">
              <RotateCcw size={16} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-full bg-gradient-to-r from-accent-cyan to-accent-blue text-white hover:shadow-lg hover:shadow-accent-cyan/20 transition-all"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
          {/* Timeline Slider */}
          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={waypoints.length - 1}
              value={currentWaypointIndex}
              onChange={(e) => {
                setCurrentWaypointIndex(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-1 appearance-none bg-border-glass rounded-full cursor-pointer"
              style={{ accentColor: '#22d3ee' }}
            />
            <div className="flex justify-between text-[9px] font-data text-text-secondary mt-1">
              <span>{formatTime(waypoints[0].timestamp)}</span>
              <span>{formatTime(waypoints[waypoints.length - 1].timestamp)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Waypoint List */}
        <div>
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Route Sequence</h3>
          <div className="space-y-2">
            {waypoints.map((wp: Waypoint, i: number) => (
              <motion.button
                key={wp.cameraId}
                onClick={() => { setCurrentWaypointIndex(i); setIsPlaying(false); }}
                className={`w-full text-left p-2.5 rounded-lg border transition-all duration-150 ${
                  i === currentWaypointIndex
                    ? 'border-accent-cyan/40 bg-accent-cyan/10'
                    : i <= currentWaypointIndex
                    ? 'border-border-glass bg-white/[0.03]'
                    : 'border-border-glass bg-transparent opacity-50'
                }`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-text-primary">{wp.cameraName}</span>
                  <span className="text-[10px] font-data text-text-secondary">{formatTime(wp.timestamp)}</span>
                </div>
                <div className="text-[10px] text-text-secondary mt-0.5">
                  {wp.speed} km/h • {wp.direction}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
