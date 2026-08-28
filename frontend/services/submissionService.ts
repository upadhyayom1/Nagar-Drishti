import type { CitizenSubmission } from '@/types';
import { apiClient } from './apiClient';

type ComplaintStatus = 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

interface ComplaintRecord {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  createdAt: string;
  user?: { name: string | null; email: string | null };
}

const statusToSubmission: Record<ComplaintStatus, CitizenSubmission['status']> = {
  SUBMITTED: 'PENDING',
  ACKNOWLEDGED: 'REVIEWED',
  IN_PROGRESS: 'DISPATCHED',
  RESOLVED: 'DISPATCHED',
  REJECTED: 'DISMISSED',
};

const submissionToStatus: Record<CitizenSubmission['status'], ComplaintStatus> = {
  PENDING: 'SUBMITTED',
  REVIEWED: 'ACKNOWLEDGED',
  DISPATCHED: 'IN_PROGRESS',
  DISMISSED: 'REJECTED',
};

function toSubmission(record: ComplaintRecord): CitizenSubmission {
  return {
    id: record.id,
    title: record.title,
    description: record.description || '',
    location: `${record.latitude.toFixed(5)}, ${record.longitude.toFixed(5)}`,
    priority: record.priority === 'HIGH' || record.priority === 'CRITICAL' ? 'HIGH' : 'LOW',
    submitterName: record.user?.name || record.user?.email || 'Authenticated citizen',
    timestamp: record.createdAt,
    status: statusToSubmission[record.status],
  };
}

export const submissionService = {
  getSubmissions: async (): Promise<CitizenSubmission[]> => {
    const response = await apiClient.get<{ complaints: ComplaintRecord[] }>('/admin/complaints');
    return response.data.complaints.map(toSubmission);
  },

  createSubmission: async (
    data: Omit<CitizenSubmission, 'id' | 'timestamp' | 'status'> & { latitude: number; longitude: number }
  ): Promise<CitizenSubmission> => {
    const response = await apiClient.post<{ complaint: ComplaintRecord }>('/complaints', {
      title: data.title,
      description: data.description,
      category: 'OTHER',
      priority: data.priority,
      latitude: data.latitude,
      longitude: data.longitude,
    });
    return toSubmission(response.data.complaint);
  },

  updateStatus: async (
    id: string,
    status: CitizenSubmission['status']
  ): Promise<void> => {
    await apiClient.patch(`/admin/complaints/${encodeURIComponent(id)}/status`, {
      status: submissionToStatus[status],
    });
  },

  dismissSubmission: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/complaints/${encodeURIComponent(id)}/status`, {
      status: 'REJECTED',
    });
  },
};
