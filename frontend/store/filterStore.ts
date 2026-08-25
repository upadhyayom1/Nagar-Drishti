import { create } from 'zustand';
import type { CameraStatus, AlertSeverity, AlertType } from '@/types';

interface FilterState {
  // Camera filters
  cameraStatusFilter: CameraStatus | 'all';
  setCameraStatusFilter: (status: CameraStatus | 'all') => void;
  
  // Alert filters
  alertSeverityFilter: AlertSeverity | 'all';
  setAlertSeverityFilter: (severity: AlertSeverity | 'all') => void;
  alertTypeFilter: AlertType | 'all';
  setAlertTypeFilter: (type: AlertType | 'all') => void;
  
  // Map layer toggles
  showHeatmap: boolean;
  toggleHeatmap: () => void;
  showTrajectories: boolean;
  toggleTrajectories: () => void;
  showTrafficDensity: boolean;
  toggleTrafficDensity: () => void;
  
  // Reset
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  cameraStatusFilter: 'all',
  setCameraStatusFilter: (status) => set({ cameraStatusFilter: status }),
  
  alertSeverityFilter: 'all',
  setAlertSeverityFilter: (severity) => set({ alertSeverityFilter: severity }),
  alertTypeFilter: 'all',
  setAlertTypeFilter: (type) => set({ alertTypeFilter: type }),
  
  showHeatmap: false,
  toggleHeatmap: () => set((state) => ({ showHeatmap: !state.showHeatmap })),
  showTrajectories: false,
  toggleTrajectories: () => set((state) => ({ showTrajectories: !state.showTrajectories })),
  showTrafficDensity: true,
  toggleTrafficDensity: () => set((state) => ({ showTrafficDensity: !state.showTrafficDensity })),
  
  resetFilters: () => set({
    cameraStatusFilter: 'all',
    alertSeverityFilter: 'all',
    alertTypeFilter: 'all',
    showHeatmap: false,
    showTrajectories: false,
    showTrafficDensity: true,
  }),
}));
