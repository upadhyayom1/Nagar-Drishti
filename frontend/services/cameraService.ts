import type { Camera, Detection } from '@/types';
import { apiClient } from './apiClient';

export const cameraService = {
  async getCameras(): Promise<Camera[]> {
    try {
      const response = await apiClient.get('/cameras');
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getCameraById(id: string): Promise<Camera | undefined> {
    try {
      const response = await apiClient.get(`/cameras/${id}`);
      return response.data?.data || response.data;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  },

  async getCamerasByStatus(status: string): Promise<Camera[]> {
    try {
      const response = await apiClient.get(`/cameras?status=${status}`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getDetectionsByCamera(cameraId: string): Promise<Detection[]> {
    try {
      const response = await apiClient.get(`/cameras/${cameraId}/detections`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getRecentDetections(limit: number = 10): Promise<Detection[]> {
    try {
      const response = await apiClient.get(`/detections?limit=${limit}`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getOnlineCameraCount(): Promise<number> {
    try {
      const cameras = await this.getCameras();
      return cameras.filter(c => c.status === 'online').length;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },
};
