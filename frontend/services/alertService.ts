import type { Alert, AlertSeverity, AlertType } from '@/types';
import { apiClient, unwrapApiResponse } from './apiClient';

export interface NotificationSummary {
  items: Alert[];
  total: number;
}

export const alertService = {
  async getAlerts(): Promise<Alert[]> {
    return unwrapApiResponse(await apiClient.get<Alert[]>('/alerts'));
  },

  async getAlertsBySeverity(severity: AlertSeverity | 'all'): Promise<Alert[]> {
    return unwrapApiResponse(await apiClient.get<Alert[]>(`/alerts?severity=${severity === 'all' ? '' : severity}`));
  },

  async getAlertsByType(type: AlertType | 'all'): Promise<Alert[]> {
    return unwrapApiResponse(await apiClient.get<Alert[]>(`/alerts?type=${type === 'all' ? '' : type}`));
  },

  async getActiveAlertCount(): Promise<number> {
    const response = await apiClient.get<number>('/alerts/active/count');
    return unwrapApiResponse(response);
  },

  async getNotificationSummary(limit: number = 8): Promise<NotificationSummary> {
    return unwrapApiResponse(await apiClient.get<NotificationSummary>(`/alerts/notifications?limit=${limit}`));
  },

  async getRecentAlerts(limit: number = 5): Promise<Alert[]> {
    return unwrapApiResponse(await apiClient.get<Alert[]>(`/alerts?limit=${limit}`));
  },

  async acknowledgeAlert(id: string): Promise<void> {
    await apiClient.patch(`/alerts/${encodeURIComponent(id)}`, { status: 'ACKNOWLEDGED' });
  },
};
