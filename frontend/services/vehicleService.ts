import type { Vehicle, Detection, VehicleJourney } from '@/types';
import vehiclesData from '@/data/vehicles.json';
import detectionsData from '@/data/detections.json';
import routesData from '@/data/routes.json';
import { delay } from '@/lib/utils';

const heroVehicle: Vehicle = vehiclesData.hero as Vehicle;
const allVehicles: Vehicle[] = [heroVehicle, ...(vehiclesData.vehicles as Vehicle[])];
const detections: Detection[] = detectionsData as Detection[];
const journeys: VehicleJourney[] = routesData as VehicleJourney[];

export const vehicleService = {
  async searchVehicles(query: string): Promise<Vehicle[]> {
    await delay(300);
    if (!query) return allVehicles.slice(0, 5);
    const q = query.toUpperCase();
    return allVehicles.filter(v => v.plate.includes(q));
  },

  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    await delay(200);
    return allVehicles.find(v => v.plate === plate.toUpperCase());
  },

  async getVehicleDetections(plate: string): Promise<Detection[]> {
    await delay(200);
    return detections
      .filter(d => d.vehiclePlate === plate.toUpperCase())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async getVehicleJourney(plate: string): Promise<VehicleJourney | undefined> {
    await delay(200);
    return journeys.find(j => j.plate === plate.toUpperCase());
  },

  async getAllVehicles(): Promise<Vehicle[]> {
    await delay(200);
    return allVehicles;
  },

  async getTotalVehiclesToday(): Promise<number> {
    await delay(100);
    return allVehicles.length;
  },

  async getRecentVehicles(limit: number = 5): Promise<Vehicle[]> {
    await delay(200);
    return allVehicles
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .slice(0, limit);
  },
};
