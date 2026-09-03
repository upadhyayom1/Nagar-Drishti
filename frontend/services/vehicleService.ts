import type { Vehicle, Detection, VehicleJourney, VehicleMovementIntelligence } from '@/types';
import { apiClient, unwrapApiResponse } from './apiClient';

export const vehicleService = {
  async searchVehicles(query: string): Promise<Vehicle[]> {
    if (!query.trim()) return this.getRecentVehicles(8);
    return unwrapApiResponse(await apiClient.get<Vehicle[]>(`/vehicles/search?q=${encodeURIComponent(query)}`));
  },

  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    return unwrapApiResponse(await apiClient.get<Vehicle>(`/vehicles/${encodeURIComponent(plate)}`));
  },

  async getVehicleDetections(plate: string, pageParam?: string): Promise<{ items: Detection[], nextCursor: string | null }> {
    const url = `/detections/vehicle/${encodeURIComponent(plate)}?limit=15${pageParam ? `&cursor=${pageParam}` : ''}`;
    return unwrapApiResponse(await apiClient.get<{ items: Detection[], nextCursor: string | null }>(url));
  },

  async getVehicleHeatmap(plate: string, offset: number = 0): Promise<{ activityDays: number[], periodStart: string, periodEnd: string }> {
    return unwrapApiResponse(await apiClient.get<{ activityDays: number[], periodStart: string, periodEnd: string }>(`/detections/vehicle/${encodeURIComponent(plate)}/heatmap?offset=${offset}`));
  },

  async getVehicleJourney(plate: string): Promise<VehicleJourney | undefined> {
    return unwrapApiResponse(await apiClient.get<VehicleJourney>(`/vehicles/journey/${encodeURIComponent(plate)}`));
  },

  async getAllVehicles(): Promise<Vehicle[]> {
    return unwrapApiResponse(await apiClient.get<Vehicle[]>('/vehicles'));
  },

  async getTotalVehiclesToday(): Promise<number> {
    const vehicles = await this.getAllVehicles();
    return vehicles.length;
  },

  async getRecentVehicles(limit: number = 5): Promise<Vehicle[]> {
    return unwrapApiResponse(await apiClient.get<Vehicle[]>(`/vehicles/recent?limit=${limit}`));
  },

  async getVehicleIntelligence(plate: string): Promise<VehicleMovementIntelligence | undefined> {
    return unwrapApiResponse(await apiClient.get<VehicleMovementIntelligence>(`/ml/analyze/${encodeURIComponent(plate)}`));
  },
};
