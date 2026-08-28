import { useSubmissionStore } from '@/store/submissionStore';
import type { CitizenSubmission } from '@/types';

export const submissionService = {
  getSubmissions: async (): Promise<CitizenSubmission[]> => {
    // Simulated micro async call
    await new Promise((resolve) => setTimeout(resolve, 60));
    return useSubmissionStore.getState().submissions;
  },

  createSubmission: async (
    data: Omit<CitizenSubmission, 'id' | 'timestamp' | 'status'>
  ): Promise<CitizenSubmission> => {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return useSubmissionStore.getState().addSubmission(data);
  },

  updateStatus: async (
    id: string,
    status: CitizenSubmission['status']
  ): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    useSubmissionStore.getState().updateStatus(id, status);
  },

  deleteSubmission: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 80));
    useSubmissionStore.getState().deleteSubmission(id);
  },
};
