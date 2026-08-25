import type { AlertSeverity, BlacklistedVehicle } from '@/types';
import { apiClient, unwrapApiResponse } from './apiClient';

function normalizeBlacklistVehicle(record: BlacklistedVehicle): BlacklistedVehicle {
  return {
    ...record,
    severity: record.severity.toLowerCase() as AlertSeverity,
  };
}

export const blacklistService = {
  async getActiveVehicles(): Promise<BlacklistedVehicle[]> {
    const records = unwrapApiResponse(await apiClient.get<BlacklistedVehicle[]>('/blacklist?status=ACTIVE'));
    return records.map(normalizeBlacklistVehicle);
  },

  async addVehicle(input: { plateNumber: string; reason: string; severity: AlertSeverity }): Promise<BlacklistedVehicle> {
    return normalizeBlacklistVehicle(unwrapApiResponse(await apiClient.post<BlacklistedVehicle>('/blacklist', input)));
  },

  async deactivateVehicle(id: string): Promise<BlacklistedVehicle> {
    return normalizeBlacklistVehicle(unwrapApiResponse(await apiClient.patch<BlacklistedVehicle>(`/blacklist/${encodeURIComponent(id)}/deactivate`)));
  },
};
