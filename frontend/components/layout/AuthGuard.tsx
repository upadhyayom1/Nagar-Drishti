'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Loader2 } from 'lucide-react';

type UserRole = 'ADMIN' | 'USER';

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const router = useRouter();
  const { user, isInitialized, isAuthenticated, setUser, setInitialized, initializeAuthFromStorage } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Instantly restore from localStorage if available
      const stored = initializeAuthFromStorage();

      try {
        // 2. Sync with backend API
        const remoteUser = await authService.me();
        if (remoteUser) {
          setUser(remoteUser);
        }
      } catch {
        // If remote fails but we have valid local storage user, retain local session
        if (!stored) {
          setUser(null);
        }
      } finally {
        setInitialized(true);
      }
    };

    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, initializeAuthFromStorage, setInitialized, setUser]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
    if (isInitialized && user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push(user.role === 'ADMIN' ? '/dashboard' : '/report');
    }
  }, [allowedRoles, isInitialized, isAuthenticated, router, user]);

  if (!isInitialized || !isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 flex items-center justify-center p-0.5 animate-pulse shadow-[0_0_24px_rgba(0,240,255,0.4)]">
            <div className="w-full h-full rounded-[10px] bg-[var(--bg-elevated)] flex items-center justify-center">
              <Loader2 className="animate-spin text-cyan-400" size={24} />
            </div>
          </div>
          <span className="text-xs font-mono tracking-widest uppercase font-bold text-[var(--text-secondary)]">Authenticating Grid Session...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
