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
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
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
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('nagardrishti_theme', nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
      return { theme: nextTheme };
    });
  },
}));
