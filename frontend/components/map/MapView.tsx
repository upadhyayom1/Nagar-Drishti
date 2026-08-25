'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Video, Crosshair } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/store/filterStore';
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
    case 'online':  return '#10b981'; // Emerald
    case 'warning': return '#f59e0b'; // Amber
    case 'offline': return '#f43f5e'; // Crimson
    default:        return '#94a3b8';
  }
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'online':  return 'success';
    case 'warning': return 'warning';
    default:        return 'danger';
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
      duration: 1.0,
      easeLinearity: 0.25,
    });
  };

  return (
    <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
      <button
        onClick={handleReset}
        title="Reset Map to Sector Grid View"
        className="px-3 py-1.5 rounded-xl bg-slate-950/90 text-cyan-300 hover:text-white hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/60 transition-all text-xs font-display font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-md"
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
  const { showHeatmap, showTrajectories, showTrafficDensity } = useFilterStore();
  const { data: roads = [] } = useQuery({ queryKey: ['roads'], queryFn: roadService.getRoads });
  const mapCenter: [number, number] = cameras.length
    ? [cameras.reduce((sum, camera) => sum + camera.lat, 0) / cameras.length, cameras.reduce((sum, camera) => sum + camera.lng, 0) / cameras.length]
    : center;

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

        {/* CartoDB Dark Matter Base Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {roads.map((road) => road.geometry?.type === 'LineString' && road.geometry.coordinates.length > 1 && (
          <Polyline
            key={road.id}
            positions={road.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number])}
            pathOptions={{
              color: '#38bdf8',
              weight: showTrajectories ? 3.5 : 2,
              opacity: showTrajectories ? 0.8 : 0.42,
              dashArray: showTrajectories ? '8 6' : undefined,
            }}
          />
        ))}

        {/* ── Layer 1: Density Heatmap Halos ── */}
        {showHeatmap && cameras.map((c) => {
          const heatColor = c.trafficLevel === 'congested' ? '#f43f5e' : c.trafficLevel === 'high' ? '#f59e0b' : '#06b6d4';
          return (
            <Circle
              key={`heat-${c.id}`}
              center={[c.lat, c.lng]}
              radius={1200}
              pathOptions={{
                color: heatColor,
                fillColor: heatColor,
                fillOpacity: 0.18,
                weight: 1,
                dashArray: '4 4',
              }}
            />
          );
        })}

        {/* ── Layer 2: Traffic Density Radii ── */}
        {showTrafficDensity && cameras.map((c) => {
          const isHeavy = c.trafficLevel === 'congested' || c.trafficLevel === 'high';
          return (
            <CircleMarker
              key={`density-${c.id}`}
              center={[c.lat, c.lng]}
              radius={isHeavy ? 20 : 14}
              pathOptions={{
                color: isHeavy ? '#f43f5e' : '#38bdf8',
                fillColor: isHeavy ? '#f43f5e' : '#06b6d4',
                fillOpacity: 0.25,
                weight: 1.5,
              }}
            />
          );
        })}

        {/* ── Primary Optical Camera Nodes ── */}
        {cameras.map((camera) => {
          const color = statusColor(camera.status);
          const isOnline = camera.status === 'online';

          return (
            <CircleMarker
              key={camera.id}
              center={[camera.lat, camera.lng]}
              radius={isOnline ? 8 : 6}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: isOnline ? 0.9 : 0.5,
                weight: isOnline ? 2.5 : 1.5,
              }}
            >
              <Popup>
                <div className="min-w-[240px] p-4 text-white font-body">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-bold text-sm text-white font-display leading-tight">
                        {camera.name}
                      </p>
                      <p className="text-[10px] text-cyan-400 font-data font-bold mt-0.5">
                        {camera.cameraCode} · {camera.zone}
                      </p>
                    </div>
                    <Badge variant={statusVariant(camera.status)} size="sm" dot pulse={isOnline}>
                      {camera.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-400 mb-3 font-normal font-body">
                    {camera.location}
                  </p>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/90 border border-cyan-500/20 text-[10px] font-data mb-3">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-display uppercase font-bold">VEHICLES</span>
                      <span className="text-cyan-400 font-extrabold text-xs font-data">{camera.vehiclesDetected}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-display uppercase font-bold">DETECTIONS</span>
                      <span className="text-white font-bold text-xs font-data">{camera.detectionCount}</span>
                    </div>
                  </div>

                  <Link
                    href={`/cameras/${camera.id}`}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:opacity-90 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-display"
                  >
                    <Video size={13} />
                    Open Live Feed
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
