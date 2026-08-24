import type { Camera, Detection } from '@/types';
import camerasData from '@/data/cameras.json';
import detectionsData from '@/data/detections.json';
import { delay } from '@/lib/utils';

const cameras: Camera[] = camerasData as Camera[];
const detections: Detection[] = detectionsData as Detection[];

export const cameraService = {
  async getCameras(): Promise<Camera[]> {
    await delay(200);
    return cameras;
  },

  async getCameraById(id: string): Promise<Camera | undefined> {
    await delay(150);
    return cameras.find(c => c.id === id);
  },

  async getCamerasByStatus(status: string): Promise<Camera[]> {
    await delay(200);
    if (status === 'all') return cameras;
    return cameras.filter(c => c.status === status);
  },

  async getDetectionsByCamera(cameraId: string): Promise<Detection[]> {
    await delay(200);
    return detections.filter(d => d.cameraId === cameraId);
  },

  async getRecentDetections(limit: number = 10): Promise<Detection[]> {
    await delay(200);
    return [...detections]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  async getOnlineCameraCount(): Promise<number> {
    await delay(100);
    return cameras.filter(c => c.status === 'online').length;
  },
};
