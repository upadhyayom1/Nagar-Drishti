import { create } from 'zustand';
import { User } from '@/services/authService';

const STORAGE_KEY = 'nagardrishti_user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
  initializeAuthFromStorage: () => User | null;
}

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    set({ user, isAuthenticated: !!user });
  },

  setInitialized: (initialized) => set({ isInitialized: initialized }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ user: null, isAuthenticated: false });
  },

  initializeAuthFromStorage: () => {
    const stored = getStoredUser();
    if (stored) {
      set({ user: stored, isAuthenticated: true, isInitialized: true });
    }
    return stored;
  },
}));
