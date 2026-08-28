'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Video, Crosshair } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { roadService } from '@/services/roadService';
import type { Camera } from '@/types';

interface MapViewProps {
  cameras: Camera[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  autoResetOnLeave?: boolean;
}

function statusColor(status: string): string {
  switch (status) {
    case 'online':   return '#00E6B0'; // emerald
    case 'warning':  return '#f59e0b'; // amber
    case 'offline':  return '#f43f5e'; // rose
    case 'critical': return '#f43f5e';
    default:         return '#00f0ff';
  }
}

function statusVariant(status: string): 'ok' | 'warn' | 'critical' {
  switch (status) {
    case 'online':   return 'ok';
    case 'warning':  return 'warn';
    default:         return 'critical';
  }
}

function MapResizeHandler() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 600);

    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

// Controller component to handle smooth animated recentering
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  const handleReset = () => {
    map.closePopup();
    map.flyTo(center, zoom, {
      duration: 1.2,
      easeLinearity: 0.2,
    });
  };

  return (
    <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
      <button
        onClick={handleReset}
        title="Reset Map to Sector Grid View"
        className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-elevated)]/90 text-cyan-400 hover:text-white hover:bg-cyan-500/20 border border-[var(--glass-border)] hover:border-cyan-400/60 transition-all text-xs font-display font-semibold flex items-center gap-1.5 shadow-[0_0_18px_rgba(0,240,255,0.25)] backdrop-blur-md cursor-pointer"
      >
        <Crosshair size={13} className="text-cyan-400" />
        Reset Grid View
      </button>
    </div>
  );
}

export function MapView({
  cameras,
  center = [25.4516, 81.8468],
  zoom = 12,
  className,
}: MapViewProps) {
  const { theme } = useUIStore();
  const { showHeatmap, showTrajectories, showTrafficDensity } = useFilterStore();
  const { data: roads = [] } = useQuery({ queryKey: ['roads'], queryFn: roadService.getRoads });
  const mapCenter: [number, number] = cameras.length
    ? [cameras.reduce((sum, camera) => sum + camera.lat, 0) / cameras.length, cameras.reduce((sum, camera) => sum + camera.lng, 0) / cameras.length]
    : center;

  // Fastly SSL URLs for clean tiles without "API KEY REQUIRED" watermark
  const darkTileUrl = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png';
  const lightTileUrl = 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager/{z}/{x}/{y}.png';

  const tileUrl = theme === 'light' ? lightTileUrl : darkTileUrl;

  return (
    <div className="w-full h-full min-h-[480px] relative rounded-2xl overflow-hidden group">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className={className}
        style={{ height: '100%', width: '100%', minHeight: '480px', zIndex: 1 }}
        zoomControl={true}
        attributionControl={true}
      >
        <MapResizeHandler />
        <MapViewController center={mapCenter} zoom={zoom} />

        {/* Clean Theme-Adaptive Tiles (No Watermark) */}
        <TileLayer
          key={theme}
          url={tileUrl}
          subdomains="abcd"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {roads.map((road) => road.geometry?.type === 'LineString' && road.geometry.coordinates.length > 1 && (
          <Polyline
            key={road.id}
            positions={road.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])}
            pathOptions={{
              color: theme === 'light' ? '#0284c7' : '#00f0ff',
              weight: showTrajectories ? 3.5 : 2,
              opacity: showTrajectories ? 0.9 : 0.45,
              dashArray: showTrajectories ? '8 6' : undefined,
            }}
          />
        ))}

        {/* ── Layer 1: Density Heatmap Halos ── */}
        {showHeatmap && cameras.map((c) => {
          const heatColor = c.trafficLevel === 'congested' ? '#f43f5e' : c.trafficLevel === 'high' ? '#f59e0b' : '#00f0ff';
          return (
            <Circle
              key={`heat-${c.id}`}
              center={[c.lat, c.lng]}
              radius={1200}
              pathOptions={{
                color: heatColor,
                fillColor: heatColor,
                fillOpacity: 0.18,
                weight: 1.5,
                dashArray: '4 4',
              }}
            />
          );
        })}

        {/* ── Layer 2: Live Density Rings ── */}
        {showTrafficDensity && cameras.map((c) => {
          const ringColor = c.trafficLevel === 'congested' ? '#f43f5e' : c.trafficLevel === 'high' ? '#f59e0b' : '#00E6B0';
          const radius = c.vehiclesDetected > 300 ? 550 : c.vehiclesDetected > 150 ? 380 : 220;
          return (
            <Circle
              key={`density-${c.id}`}
              center={[c.lat, c.lng]}
              radius={radius}
              pathOptions={{
                color: ringColor,
                fillColor: ringColor,
                fillOpacity: 0.16,
                weight: 1.5,
              }}
            />
          );
        })}

        {/* ── Camera Station Markers ── */}
        {cameras.map((c) => {
          const color = statusColor(c.status);
          const isSelected = false;

          return (
            <CircleMarker
              key={c.id}
              center={[c.lat, c.lng]}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.9,
                weight: isSelected ? 3 : 2,
              }}
            >
              <Popup className="glassmorphism-popup">
                <div className="p-4 space-y-3 min-w-[210px] text-[var(--text-primary)] font-body">
                  <div className="flex items-center justify-between gap-2 border-b border-[var(--glass-border)] pb-2">
                    <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">
                      {c.cameraCode}
                    </span>
                    <Badge variant={statusVariant(c.status)} size="sm" dot>
                      {c.status}
                    </Badge>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)] leading-tight">
                      {c.name}
                    </h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {c.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-white/[0.04] p-2 rounded-xl border border-[var(--glass-border)]">
                    <div>
                      <span className="text-[9px] text-[var(--text-secondary)] block uppercase">Detections</span>
                      <span className="font-bold text-cyan-400">{c.vehiclesDetected}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-[var(--text-secondary)] block uppercase">Traffic</span>
                      <span className="font-bold text-[var(--text-primary)] capitalize">{c.trafficLevel}</span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <Link
                      href={`/cameras/${c.id}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-display font-bold hover:bg-cyan-500/30 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                    >
                      <Video size={12} />
                      Live Camera Telemetry
                    </Link>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
