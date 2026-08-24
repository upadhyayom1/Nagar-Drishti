import type { TrafficStats, HourlyTraffic, CameraTraffic, Route } from '@/types';
import analyticsData from '@/data/analytics.json';
import { delay } from '@/lib/utils';

const data = analyticsData as {
  stats: TrafficStats;
  hourlyTraffic: HourlyTraffic[];
  cameraTraffic: CameraTraffic[];
  busiestRoads: Route[];
  anomalies: string[];
};

export const analyticsService = {
  async getTrafficStats(): Promise<TrafficStats> {
    await delay(200);
    return data.stats;
  },

  async getHourlyTraffic(): Promise<HourlyTraffic[]> {
    await delay(200);
    return data.hourlyTraffic;
  },

  async getCameraTraffic(): Promise<CameraTraffic[]> {
    await delay(200);
    return data.cameraTraffic;
  },

  async getBusiestRoads(): Promise<Route[]> {
    await delay(200);
    return data.busiestRoads;
  },

  async getTrafficAnomalies(): Promise<string[]> {
    await delay(150);
    return data.anomalies;
  },
};
