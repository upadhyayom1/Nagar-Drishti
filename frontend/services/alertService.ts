import type { Alert, AlertSeverity, AlertType } from '@/types';
import { apiClient } from './apiClient';

export const alertService = {
  async getAlerts(): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>('/alerts');
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getAlertsBySeverity(severity: AlertSeverity | 'all'): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>(`/alerts?severity=${severity === 'all' ? '' : severity}`);
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getAlertsByType(type: AlertType | 'all'): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>(`/alerts?type=${type === 'all' ? '' : type}`);
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getActiveAlertCount(): Promise<number> {
    try {
      const alerts = await this.getAlerts();
      return alerts.filter(a => !a.isResolved).length;
    } catch (e) {
      console.error(e);
      return 0;
    }
  },

  async getRecentAlerts(limit: number = 5): Promise<Alert[]> {
    try {
      const response = await apiClient.get<Alert[]>(`/alerts?limit=${limit}`);
      return response.data || response || [];
    } catch (e) {
      console.error(e);
      return [];
    }
  },
};
