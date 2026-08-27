'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authService.login(username, password);
      if (data.user) {
        setUser(data.user);
        router.push('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050711] text-white flex items-center justify-center relative overflow-hidden font-body select-none px-6">
      {/* ── Multi-Chromatic Ambient Light Orbs ── */}
      <div className="absolute top-[-10%] left-[10%] w-[55vw] h-[55vw] bg-indigo-500/[0.12] rounded-full blur-[190px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[10%] w-[45vw] h-[45vw] bg-cyan-500/[0.08] rounded-full blur-[180px] pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] p-0.5">
              <div className="w-full h-full rounded-[10px] bg-[#050711]/40 flex items-center justify-center">
                <Zap size={24} className="text-white font-extrabold fill-white" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mb-2">
            Urban<span className="text-gradient-spectral">Pulse</span>
          </h1>
          <p className="text-sm text-slate-400 font-body">
            Command Center Authorization Required
          </p>
        </div>

        <GlassCard padding="lg" className="p-8 border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3 text-rose-400 text-sm font-display font-bold"
              >
                <ShieldAlert size={16} />
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-display uppercase tracking-widest text-slate-400 font-bold ml-1">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#050711]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                placeholder="Enter operator ID"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-display uppercase tracking-widest text-slate-400 font-bold ml-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#050711]/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" className="w-full h-12 shadow-[0_0_20px_rgba(6,182,212,0.3)]" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin text-white/70" />
                ) : (
                  <>Authorize Access <ArrowRight size={16} className="ml-1" /></>
                )}
              </Button>
            </div>
          </form>
        </GlassCard>

        <div className="text-center mt-8 text-xs text-slate-500 font-body">
          <p>© {new Date().getFullYear()} UrbanPulse AI. Authorized smart city operations.</p>
        </div>
      </motion.div>
    </div>
  );
}
