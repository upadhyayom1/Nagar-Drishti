import type { Camera, CameraStatus, TrafficLevel } from '@/types';
import type { Road } from '@/services/roadService';

export const PRAYAGRAJ_CENTER: [number, number] = [81.8468, 25.4516]; // [longitude, latitude] for MapLibre
export const DEFAULT_ZOOM = 12;

export function statusColor(status: CameraStatus | string): string {
  switch (status) {
    case 'online':
      return '#00f59b';
    case 'warning':
      return '#f59e0b';
    case 'offline':
    case 'critical':
      return '#ef4444';
    default:
      return '#00f59b';
  }
}

export function trafficColor(level: TrafficLevel | string): string {
  switch (level) {
    case 'congested':
      return '#ef4444';
    case 'high':
      return '#f59e0b';
    case 'moderate':
      return '#06b6d4';
    case 'low':
    default:
      return '#00f59b';
  }
}

export function trafficWeight(level: TrafficLevel | string, vehicleCount: number = 0): number {
  switch (level) {
    case 'congested':
      return Math.min(1.0, 0.75 + vehicleCount * 0.01);
    case 'high':
      return Math.min(0.75, 0.5 + vehicleCount * 0.008);
    case 'moderate':
      return 0.4;
    case 'low':
    default:
      return 0.2;
  }
}

/**
 * Converts backend Camera array into standard GeoJSON Point FeatureCollection.
 * MapLibre requires [longitude, latitude] coordinates.
 */
export function camerasToGeoJSON(cameras: Camera[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: cameras
      .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number')
      .map((c) => ({
        type: 'Feature',
        id: c.id,
        geometry: {
          type: 'Point',
          coordinates: [c.lng, c.lat], // [longitude, latitude]
        },
        properties: {
          id: c.id,
          name: c.name,
          cameraCode: c.cameraCode || c.id,
          location: c.location,
          status: c.status,
          trafficLevel: c.trafficLevel,
          vehiclesDetected: c.vehiclesDetected || 0,
          liveVehicleCount: c.liveVehicleCount ?? c.vehiclesDetected ?? 0,
          zone: c.zone || 'Central Sector',
          fps: c.fps ?? 30,
          color: statusColor(c.status),
          trafficColor: trafficColor(c.trafficLevel),
          weight: trafficWeight(c.trafficLevel, c.liveVehicleCount ?? c.vehiclesDetected ?? 0),
        },
      })),
  };
}

/**
 * Converts backend Road array into GeoJSON LineString FeatureCollection.
 * Geometry coordinates from backend roadService are already [longitude, latitude][].
 */
export function roadsToGeoJSON(roads: Road[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const validRoads = roads.filter(
    (r) =>
      r.geometry &&
      r.geometry.type === 'LineString' &&
      Array.isArray(r.geometry.coordinates) &&
      r.geometry.coordinates.length > 1
  );

  return {
    type: 'FeatureCollection',
    features: validRoads.map((r) => ({
      type: 'Feature',
      id: r.id,
      geometry: {
        type: 'LineString',
        coordinates: r.geometry!.coordinates, // already [longitude, latitude]
      },
      properties: {
        id: r.id,
        roadCode: r.roadCode || r.id,
        name: r.name,
      },
    })),
  };
}

/**
 * Converts backend Camera telemetry into traffic density rings data.
 */
export function camerasToDensityGeoJSON(cameras: Camera[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: cameras
      .filter((c) => typeof c.lat === 'number' && typeof c.lng === 'number')
      .map((c) => {
        const liveCount = c.liveVehicleCount ?? c.vehiclesDetected ?? 0;
        const radius = liveCount > 30 ? 28 : liveCount > 15 ? 20 : 12;
        return {
          type: 'Feature',
          id: `density-${c.id}`,
          geometry: {
            type: 'Point',
            coordinates: [c.lng, c.lat],
          },
          properties: {
            id: c.id,
            name: c.name,
            trafficLevel: c.trafficLevel,
            color: trafficColor(c.trafficLevel),
            liveVehicleCount: liveCount,
            radius: radius,
          },
        };
      }),
  };
}

/**
 * Generates an HTML popup card matching Nagar-Drishti's glassmorphism UI.
 */
export function createCameraPopupHTML(camera: Camera, isDark: boolean = true): string {
  const isOnline = camera.status === 'online';
  const isWarn = camera.status === 'warning';
  const statusBg = isOnline
    ? (isDark ? 'rgba(0,245,155,0.15)' : 'rgba(13,148,136,0.15)')
    : isWarn
    ? 'rgba(245,158,11,0.15)'
    : 'rgba(239,68,68,0.15)';
  const statusColorText = isOnline
    ? (isDark ? '#00f59b' : '#0f766e')
    : isWarn
    ? (isDark ? '#f59e0b' : '#b45309')
    : (isDark ? '#ef4444' : '#be123c');
  const statusBorder = isOnline
    ? (isDark ? 'rgba(0,245,155,0.35)' : 'rgba(13,148,136,0.35)')
    : isWarn
    ? 'rgba(245,158,11,0.35)'
    : 'rgba(239,68,68,0.35)';

  const liveVehicles = camera.liveVehicleCount ?? camera.vehiclesDetected ?? 0;
  const trafficLevel = camera.trafficLevel || 'normal';

  const textColor = isDark ? '#ffffff' : '#0f172a';
  const subtextColor = isDark ? 'rgba(255,255,255,0.6)' : '#64748b';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(148,163,184,0.22)';
  const boxBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(241,245,249,0.9)';
  const codeColor = isDark ? '#22d3ee' : '#0284c7';
  const btnStyle = isDark
    ? 'background:rgba(6,182,212,0.18);color:#22d3ee;border:1px solid rgba(6,182,212,0.4);'
    : 'background:#0d9488;color:#ffffff;border:1px solid #0f766e;';

  return [
    `<div class="p-3.5 space-y-2.5 min-w-[210px] font-sans" style="color:${textColor}">`,
    `  <div class="flex items-center justify-between gap-2 pb-2" style="border-bottom:1px solid ${borderColor}">`,
    `    <span class="font-mono text-xs font-bold tracking-wider" style="color:${codeColor}">${camera.cameraCode || camera.id}</span>`,
    `    <span style="background:${statusBg};color:${statusColorText};border:1px solid ${statusBorder};padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">${camera.status}</span>`,
    '  </div>',
    '  <div>',
    `    <h4 class="font-bold text-sm leading-tight" style="color:${textColor}">${camera.name}</h4>`,
    `    <p class="text-[11px] mt-0.5 font-mono" style="color:${subtextColor}">${camera.location || camera.zone}</p>`,
    '  </div>',
    `  <div class="grid grid-cols-2 gap-2 text-xs font-mono p-2 rounded-xl" style="background:${boxBg};border:1px solid ${borderColor}">`,
    '    <div>',
    `      <span class="text-[9px] block uppercase" style="color:${subtextColor}">Live Vehicles</span>`,
    `      <span class="font-bold" style="color:${codeColor}">${liveVehicles}</span>`,
    '    </div>',
    '    <div>',
    `      <span class="text-[9px] block uppercase" style="color:${subtextColor}">Traffic</span>`,
    `      <span class="font-bold capitalize" style="color:${textColor}">${trafficLevel}</span>`,
    '    </div>',
    '  </div>',
    '  <div class="pt-1">',
    `    <a href="/cameras/${encodeURIComponent(camera.name)}" class="inline-flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm" style="${btnStyle}">`,
    '      Live Camera Telemetry &rarr;',
    '    </a>',
    '  </div>',
    '</div>',
  ].join('\n');
}
