import { create } from 'zustand';

export type AppTheme = 'dark' | 'light';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearchOpen: () => void;

  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;

  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: (event?: React.MouseEvent | MouseEvent | any) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
  toggleSearchOpen: () => set((state) => ({ searchOpen: !state.searchOpen })),

  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),

  theme: 'dark',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nagardrishti_theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
  toggleTheme: (event?: React.MouseEvent | MouseEvent | any) => {
    const currentTheme = get().theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

    if (typeof window === 'undefined') {
      set({ theme: nextTheme });
      return;
    }

    const doc = document as any;
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fallback if browser doesn't support View Transitions or user prefers reduced motion
    if (!doc.startViewTransition || isReducedMotion) {
      localStorage.setItem('nagardrishti_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      set({ theme: nextTheme });
      return;
    }

    // Set transition state for directional cinematic CSS styling
    document.documentElement.setAttribute('data-theme-transition', nextTheme);

    const transition = doc.startViewTransition(() => {
      localStorage.setItem('nagardrishti_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      set({ theme: nextTheme });
    });

    transition.finished.finally(() => {
      document.documentElement.removeAttribute('data-theme-transition');
    });
  },
}));
