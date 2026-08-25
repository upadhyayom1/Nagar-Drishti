import type { Vehicle, Detection, VehicleJourney } from '@/types';
import { apiClient, unwrapApiResponse } from './apiClient';

export const vehicleService = {
  async searchVehicles(query: string): Promise<Vehicle[]> {
    if (!query.trim()) return this.getRecentVehicles(8);
    return unwrapApiResponse(await apiClient.get<Vehicle[]>(`/vehicles/search?q=${encodeURIComponent(query)}`));
  },

  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    return unwrapApiResponse(await apiClient.get<Vehicle>(`/vehicles/${encodeURIComponent(plate)}`));
  },

  async getVehicleDetections(plate: string): Promise<Detection[]> {
    return unwrapApiResponse(await apiClient.get<Detection[]>(`/detections/vehicle/${encodeURIComponent(plate)}?limit=100`));
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
};
