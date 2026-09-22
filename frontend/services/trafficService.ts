import { apiClient, unwrapApiResponse } from './apiClient';

export interface ForecastDetail {
  camera_id: string;
  zone_id: string;
  current_vehicle_count: number;
  predicted_vehicle_count: number;
  congestion_risk: 'HIGH' | 'NORMAL';
}

export interface TrafficForecast {
  horizon_minutes: number;
  total_cameras_monitored: number;
  bottlenecks_count: number;
  forecast_details: ForecastDetail[];
}

export const trafficService = {
  async getForecast(horizonMins?: number): Promise<TrafficForecast> {
    const params = new URLSearchParams();
    if (horizonMins) params.append('minutes', horizonMins.toString());
    
    return unwrapApiResponse(
      await apiClient.get<TrafficForecast>(`/traffic/forecast?${params.toString()}`)
    );
  },
};
