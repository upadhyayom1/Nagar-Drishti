import { apiClient, unwrapApiResponse } from './apiClient';

export interface Road {
  id: string;
  roadCode: string;
  name: string;
  geometry: { type: 'LineString'; coordinates: [number, number][] } | null;
}

export const roadService = {
  async getRoads(): Promise<Road[]> {
    return unwrapApiResponse(await apiClient.get<Road[]>('/roads'));
  },
};
