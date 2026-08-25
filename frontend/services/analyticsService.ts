import type { TrafficStats, HourlyTraffic, CameraTraffic, Route } from '@/types';
import { apiClient } from './apiClient';

export const analyticsService = {
  async getTrafficStats(): Promise<TrafficStats> {
    try {
      const response = await apiClient.get<TrafficStats>('/analytics/overview');
      return response.data || response;
    } catch (e) {
      console.error(e);
      return {
        totalVehiclesToday: 0,
        avgSpeed: 0,
        activeCameras: 0,
        activeAlerts: 0,
        congestionIndex: 0,
        incidentsToday: 0
      };
    }
  },

  async getHourlyTraffic(): Promise<HourlyTraffic[]> {
    try {
      const response = await apiClient.get<HourlyTraffic[]>('/analytics/hourly');
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getCameraTraffic(): Promise<CameraTraffic[]> {
    try {
      const response = await apiClient.get<CameraTraffic[]>('/analytics/cameras');
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getBusiestRoads(): Promise<Route[]> {
    try {
      const response = await apiClient.get<Route[]>('/analytics/busiest-roads');
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getTrafficAnomalies(): Promise<string[]> {
    try {
      const response = await apiClient.get<string[]>('/analytics/anomalies');
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  }
};
