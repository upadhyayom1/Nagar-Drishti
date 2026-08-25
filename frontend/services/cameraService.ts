import type { Camera, Detection } from '@/types';
import { apiClient, unwrapApiResponse } from './apiClient';

interface BackendCamera {
  id: string;
  cameraCode?: string;
  name?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  status?: string;
  trafficLevel?: Camera['trafficLevel'];
  vehiclesDetected?: number;
  vehicleCount?: number;
  detectionCount?: number;
  fps?: number;
  lastUpdated?: string;
  updatedAt?: string;
  zone?: string | { name?: string } | null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

const normalizeCamera = (data: BackendCamera): Camera => ({
  id: data.id,
  cameraCode: data.cameraCode || data.id,
  name: data.name || data.cameraCode || data.id,
  location: `Lat ${asNumber(data.lat ?? data.latitude).toFixed(4)}, Lng ${asNumber(data.lng ?? data.longitude).toFixed(4)}`,
  lat: asNumber(data.lat ?? data.latitude),
  lng: asNumber(data.lng ?? data.longitude),
  status: data.status === 'MAINTENANCE' ? 'warning' : String(data.status || 'OFFLINE').toLowerCase() as Camera['status'],
  trafficLevel: data.trafficLevel || 'low',
  vehiclesDetected: asNumber(data.vehiclesDetected ?? data.vehicleCount),
  detectionCount: asNumber(data.detectionCount),
  fps: typeof data.fps === 'number' ? data.fps : null,
  lastUpdated: data.lastUpdated ?? data.updatedAt ?? '',
  zone: typeof data.zone === 'string' ? data.zone : data.zone?.name || 'Unassigned',
});

export const cameraService = {
  async getCameras(): Promise<Camera[]> {
    return unwrapApiResponse(await apiClient.get<BackendCamera[]>('/cameras')).map(normalizeCamera);
  },

  async getCameraById(id: string): Promise<Camera | undefined> {
    const camera = unwrapApiResponse(await apiClient.get<BackendCamera>(`/cameras/${encodeURIComponent(id)}`));
    return normalizeCamera(camera);
  },

  async getCamerasByStatus(status: string): Promise<Camera[]> {
    const cameras = await this.getCameras();
    return status === 'all' ? cameras : cameras.filter((camera) => camera.status === status);
  },

  async getDetectionsByCamera(cameraId: string): Promise<Detection[]> {
    return unwrapApiResponse(await apiClient.get<Detection[]>(`/detections/camera/${encodeURIComponent(cameraId)}?limit=100`));
  },

  async getRecentDetections(limit: number = 10): Promise<Detection[]> {
    return unwrapApiResponse(await apiClient.get<Detection[]>(`/detections/recent?limit=${limit}`));
  },

  async getOnlineCameraCount(): Promise<number> {
    const cameras = await this.getCameras();
    return cameras.filter((camera) => camera.status === 'online').length;
  },
};
