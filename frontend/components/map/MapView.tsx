'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Camera } from '@/types';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';

interface MapViewProps {
  cameras: Camera[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'online': return '#2fd889';
    case 'warning': return '#ffb020';
    case 'offline': return '#ff4d4f';
    default: return '#8a8d99';
  }
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'online': return 'success';
    case 'warning': return 'warning';
    case 'offline': return 'danger';
    default: return 'success';
  }
}

export function MapView({ cameras, center = [13.04, 80.23], zoom = 12, className }: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-card)' }}
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
      />
      {cameras.map((camera) => (
        <CircleMarker
          key={camera.id}
          center={[camera.lat, camera.lng]}
          radius={8}
          pathOptions={{
            color: getStatusColor(camera.status),
            fillColor: getStatusColor(camera.status),
            fillOpacity: 0.6,
            weight: 2,
          }}
        >
          <Popup className="dark-popup">
            <div className="bg-[#0e1016] text-[#eef0f4] p-3 rounded-lg min-w-[200px] -m-[20px] -my-[10px]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{camera.name}</span>
                <Badge variant={getStatusVariant(camera.status)} size="sm" dot>
                  {camera.status}
                </Badge>
              </div>
              <div className="space-y-1 text-xs text-[#8a8d99]">
                <p>{camera.location}</p>
                <p style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}
                </p>
                <div className="flex justify-between mt-2">
                  <span>Vehicles: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#eef0f4' }}>{camera.vehiclesDetected}</span></span>
                  <span>FPS: <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#eef0f4' }}>{camera.fps}</span></span>
                </div>
              </div>
              <Link
                href={`/cameras/${camera.id}`}
                className="mt-3 block text-center text-xs py-1.5 rounded bg-gradient-to-r from-[#22d3ee] to-[#5b8cff] text-white font-medium hover:opacity-90 transition-opacity"
              >
                View Camera
              </Link>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
