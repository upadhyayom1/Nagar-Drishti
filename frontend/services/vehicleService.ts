import type { Vehicle, Detection, VehicleJourney } from '@/types';
import { apiClient } from './apiClient';

export const vehicleService = {
  async searchVehicles(query: string): Promise<Vehicle[]> {
    try {
      if (!query) return await this.getRecentVehicles(5);
      const response = await apiClient.get(`/vehicles/search?q=${encodeURIComponent(query)}`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    try {
      const response = await apiClient.get(`/vehicles/${encodeURIComponent(plate)}`);
      return response.data?.data || response.data;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  },

  async getVehicleDetections(plate: string): Promise<Detection[]> {
    try {
      const response = await apiClient.get(`/vehicles/${encodeURIComponent(plate)}/detections`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getVehicleJourney(plate: string): Promise<VehicleJourney | undefined> {
    try {
      const response = await apiClient.get(`/vehicles/${encodeURIComponent(plate)}/journey`);
      return response.data?.data || response.data;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  },

  async getAllVehicles(): Promise<Vehicle[]> {
    try {
      const response = await apiClient.get('/vehicles');
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getTotalVehiclesToday(): Promise<number> {
    try {
      const response = await apiClient.get('/vehicles');
      const data = response.data?.data || response.data || [];
      return data.length;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },

  async getRecentVehicles(limit: number = 5): Promise<Vehicle[]> {
    try {
      const response = await apiClient.get(`/vehicles?limit=${limit}&sort=recent`);
      return response.data?.data || response.data || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },
};
