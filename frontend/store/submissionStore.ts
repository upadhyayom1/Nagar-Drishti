import { create } from 'zustand';
import type { CitizenSubmission } from '@/types';

const INITIAL_SUBMISSIONS: CitizenSubmission[] = [
  {
    id: 'SUB-2026-001',
    title: 'Reckless overtaking and red light violation',
    description: 'White SUV crossed civil lines junction at high speed breaking signal and nearly caused collision with pedestrian crossing.',
    location: 'Civil Lines Crossing, MG Marg',
    priority: 'HIGH',
    submitterName: 'Vikram Sethi',
    submitterContact: '+91 98390 12345',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(), // 18 mins ago
    status: 'PENDING',
    vehiclePlate: 'UP70CD5678',
    mediaType: 'image',
  },
  {
    id: 'SUB-2026-002',
    title: 'Illegal lane blocking during school dispersal',
    description: 'Multiple delivery vans parked in double lane creating heavy congestion backlog stretching to Sangam route.',
    location: 'Near BHS School, Thornhill Road',
    priority: 'LOW',
    submitterName: 'Priya Sharma',
    submitterContact: '+91 94152 67890',
    timestamp: new Date(Date.now() - 1000 * 60 * 52).toISOString(), // 52 mins ago
    status: 'REVIEWED',
    mediaType: 'image',
  },
  {
    id: 'SUB-2026-003',
    title: 'Commercial truck stalled on bridge incline',
    description: 'Heavy vehicle breakdown on Naini Bridge approach blocking inbound single lane. Traffic backing up rapidly.',
    location: 'New Yamuna Bridge, North Ramp',
    priority: 'HIGH',
    submitterName: 'Anand Verma',
    submitterContact: '+91 99180 54321',
    timestamp: new Date(Date.now() - 1000 * 60 * 115).toISOString(), // ~2 hrs ago
    status: 'DISPATCHED',
    vehiclePlate: 'UP70XY9912',
    mediaType: 'video',
  },
];

interface SubmissionState {
  submissions: CitizenSubmission[];
  addSubmission: (submission: Omit<CitizenSubmission, 'id' | 'timestamp' | 'status'>) => CitizenSubmission;
  updateStatus: (id: string, status: CitizenSubmission['status']) => void;
  deleteSubmission: (id: string) => void;
}

export const useSubmissionStore = create<SubmissionState>((set, get) => {
  // Load initial from localStorage if present
  let initial = INITIAL_SUBMISSIONS;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('urbanpulse_citizen_submissions');
    if (saved) {
      try {
        initial = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved submissions', e);
      }
    }
  }

  const persist = (items: CitizenSubmission[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('urbanpulse_citizen_submissions', JSON.stringify(items));
    }
  };

  return {
    submissions: initial,
    addSubmission: (sub) => {
      const newSub: CitizenSubmission = {
        ...sub,
        id: `SUB-${new Date().getFullYear()}-${String(get().submissions.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        status: 'PENDING',
      };
      const updated = [newSub, ...get().submissions];
      set({ submissions: updated });
      persist(updated);
      return newSub;
    },
    updateStatus: (id, status) => {
      const updated = get().submissions.map((s) => (s.id === id ? { ...s, status } : s));
      set({ submissions: updated });
      persist(updated);
    },
    deleteSubmission: (id) => {
      const updated = get().submissions.filter((s) => s.id !== id);
      set({ submissions: updated });
      persist(updated);
    },
  };
});
