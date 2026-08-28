'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const router = useRouter();
  const { user, isInitialized, isAuthenticated, setUser, setInitialized } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.me();
        if (user) {
          setUser(user);
        }
      } catch (error) {
        // Not authenticated
        setUser(null);
      } finally {
        setInitialized(true);
      }
    };

    if (!isInitialized) {
      checkAuth();
    }
  }, [isInitialized, setInitialized, setUser]);

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
      <div className="flex items-center justify-center min-h-screen bg-[#050711] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 flex items-center justify-center p-0.5 animate-pulse">
            <div className="w-full h-full rounded-[10px] bg-[#050711] flex items-center justify-center">
              <Loader2 className="animate-spin text-cyan-400" size={24} />
            </div>
          </div>
          <span className="text-sm font-display tracking-widest uppercase font-bold text-slate-400">Verifying Identity...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

type UserRole = 'ADMIN' | 'USER';
