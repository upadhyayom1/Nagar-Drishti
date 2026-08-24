import type { Alert, AlertSeverity, AlertType } from '@/types';
import alertsData from '@/data/alerts.json';
import { delay } from '@/lib/utils';

const alerts: Alert[] = alertsData as Alert[];

export const alertService = {
  async getAlerts(): Promise<Alert[]> {
    await delay(200);
    return alerts;
  },

  async getAlertsBySeverity(severity: AlertSeverity | 'all'): Promise<Alert[]> {
    await delay(200);
    if (severity === 'all') return alerts;
    return alerts.filter(a => a.severity === severity);
  },

  async getAlertsByType(type: AlertType | 'all'): Promise<Alert[]> {
    await delay(200);
    if (type === 'all') return alerts;
    return alerts.filter(a => a.type === type);
  },

  async getActiveAlertCount(): Promise<number> {
    await delay(100);
    return alerts.filter(a => !a.isResolved).length;
  },

  async getRecentAlerts(limit: number = 5): Promise<Alert[]> {
    await delay(200);
    return [...alerts]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },
};
