import type { TrafficStats, HourlyTraffic, CameraTraffic, NetworkAnalytics, Route, SystemHealth } from '@/types';
import { apiClient, unwrapApiResponse } from './apiClient';

export interface AnalyticsWindow {
  from: string;
  to: string;
}

function withWindow(window?: AnalyticsWindow) {
  return window ? { params: window } : undefined;
}

export const analyticsService = {
  async getTrafficStats(window?: AnalyticsWindow): Promise<TrafficStats> {
    return unwrapApiResponse(await apiClient.get<TrafficStats>('/analytics/overview', withWindow(window)));
  },

  async getHourlyTraffic(window?: AnalyticsWindow): Promise<HourlyTraffic[]> {
    return unwrapApiResponse(await apiClient.get<HourlyTraffic[]>('/analytics/hourly', withWindow(window)));
  },

  async getCameraTraffic(window?: AnalyticsWindow): Promise<CameraTraffic[]> {
    return unwrapApiResponse(await apiClient.get<CameraTraffic[]>('/analytics/cameras', withWindow(window)));
  },

  async getBusiestRoads(window?: AnalyticsWindow): Promise<Route[]> {
    return unwrapApiResponse(await apiClient.get<Route[]>('/analytics/busiest-roads', withWindow(window)));
  },

  async getTrafficAnomalies(): Promise<string[]> {
    return unwrapApiResponse(await apiClient.get<string[]>('/analytics/anomalies'));
  },

  async getNetwork(window?: AnalyticsWindow): Promise<NetworkAnalytics> {
    return unwrapApiResponse(await apiClient.get<NetworkAnalytics>('/analytics/network', withWindow(window)));
  },

  async getSystemHealth(): Promise<SystemHealth> {
    return unwrapApiResponse(await apiClient.get<SystemHealth>('/analytics/system'));
  },
};
