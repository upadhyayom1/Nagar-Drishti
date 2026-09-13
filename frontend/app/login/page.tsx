'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  UserCheck,
  Lock,
  ArrowRight,
  Radio,
  CheckCircle2,
  Activity,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowLeft,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { User as AuthUser } from '@/services/authService';

// Dynamic import for ColorBends Three.js canvas with ssr: false
const ColorBends = dynamic(() => import('@/components/ui/ColorBends'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[var(--bg-void)]" />,
});
function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'user' ? 'user' : 'admin';
  const { user, setUser, initializeAuthFromStorage, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();

  const [role, setRole] = useState<'admin' | 'user'>(initialRole);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeSession, setActiveSession] = useState<AuthUser | null>(null);

  // Initialize active session on mount without auto-redirecting
  useEffect(() => {
    const existingUser = user || initializeAuthFromStorage();
    if (existingUser) {
      setActiveSession(existingUser);
    }
  }, [user, initializeAuthFromStorage]);

  const handleRoleSwitch = (newRole: 'admin' | 'user') => {
    setRole(newRole);
    setErrorMessage('');
  };

  const handleSignOutActive = () => {
    logout();
    setActiveSession(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please provide both identification and passcode.');
      return;
    }

    setIsVerifying(true);
    setVerificationStep(1);
    setErrorMessage('');

    try {
      const { authService } = await import('@/services/authService');
      const { user: authenticatedUser } = await authService.login(username, password);
      const expectedRole = role === 'admin' ? 'ADMIN' : 'USER';

      if (authenticatedUser.role !== expectedRole) {
        setErrorMessage(
          'Access Denied: Account is not authorized for ' +
            (role === 'admin' ? 'Command Center (Admin clearance required)' : 'Citizen Incident Portal') +
            '.'
        );
        setIsVerifying(false);
        setVerificationStep(0);
        return;
      }
      setUser(authenticatedUser);
      setActiveSession(authenticatedUser);

      setTimeout(() => {
        setVerificationStep(2);
      }, 700);

      setTimeout(() => {
        setVerificationStep(3);
        setIsVerifying(false);
        setVerifiedSuccess(true);
      }, 1400);

      setTimeout(() => {
        if (authenticatedUser.role === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/report');
        }
      }, 2100);
    } catch (err: unknown) {
      setIsVerifying(false);
      setVerificationStep(0);
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Authentication failed. Please verify your credentials.';
      setErrorMessage(message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const isLight = theme === 'light';

  return (
    <div className={'min-h-screen flex flex-col justify-between p-4 sm:p-6 md:p-8 relative overflow-hidden font-body select-none transition-colors duration-300 ' + (isLight ? 'bg-[#f3f6f9] text-slate-900' : 'bg-black text-white')}>
      
      {/* ── ColorBends Background (Harmonized Nagar-Drishti Emerald Palette) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <ColorBends
          colors={
            isLight
              ? ['#0d9488', '#059669', '#047857', '#0f766e']
              : ['#00f59b', '#00dc82', '#059669', '#10b981']
          }
          rotation={45}
          autoRotate={0.8}
          speed={0.22}
          scale={1.1}
          frequency={1.1}
          warpStrength={1.2}
          mouseInfluence={0.8}
          parallax={0.4}
          noise={0.06}
          iterations={2}
          intensity={isLight ? 1.05 : 1.25}
          bandWidth={6}
          transparent={!isLight}
          lightMode={isLight}
          backgroundColor={isLight ? '#f3f6f9' : '#000000'}
        />
        {/* Subtle Ambient Vignette */}
        <div className={'absolute inset-0 pointer-events-none ' + (isLight ? 'bg-radial-gradient from-transparent via-slate-100/10 to-slate-200/40' : 'bg-radial-gradient from-transparent via-black/20 to-black/60')} />
      </div>

      {/* ── Top Bar HUD ── */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-20">
        <Link
          href="/"
          className={'group inline-flex items-center gap-2 text-xs font-mono font-medium transition-all py-2 px-4 rounded-full border backdrop-blur-xl shadow-sm cursor-pointer ' +
            (isLight
              ? 'border-slate-200/90 bg-white/85 text-slate-700 hover:text-slate-950 hover:border-emerald-500/50 shadow-slate-200/50'
              : 'border-white/10 bg-black/60 text-zinc-300 hover:text-white hover:border-emerald-500/50 hover:shadow-[0_0_16px_rgba(0,245,155,0.2)]')}
        >
          <ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform duration-200 text-emerald-500 dark:text-emerald-400" />
          <span>System Overview</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {/* Node Status Pill */}
          <div className={'hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border backdrop-blur-xl text-[10px] font-mono shadow-sm ' +
            (isLight
              ? 'border-slate-200/90 bg-white/85 text-slate-700 shadow-slate-200/50'
              : 'border-white/10 bg-black/60 text-zinc-300')}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold tracking-wider uppercase text-[9px] text-emerald-600 dark:text-emerald-400">SEC-OPS 4.0 // ONLINE</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={(e) => toggleTheme(e)}
            className={'flex items-center gap-2 px-3.5 py-2 rounded-full border backdrop-blur-xl transition-all text-xs font-mono cursor-pointer shadow-sm ' +
              (isLight
                ? 'border-slate-200/90 bg-white/85 text-slate-700 hover:text-slate-950 shadow-slate-200/50 hover:border-emerald-500/50'
                : 'border-white/10 bg-black/60 text-zinc-300 hover:text-white hover:border-emerald-500/50 hover:shadow-[0_0_16px_rgba(0,245,155,0.2)]')}
            title={'Switch to ' + (isLight ? 'Dark' : 'Light') + ' mode'}
          >
            {isLight ? (
              <>
                <Moon size={14} className="text-sky-600" />
                <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun size={14} className="text-amber-400" />
                <span className="text-[10px] font-bold tracking-wider uppercase hidden sm:inline">Light</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Holographic Cyber-Glass Console ── */}
      <main className="w-full max-w-lg mx-auto relative z-10 my-auto py-6">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-4"
        >
          {/* Header Brand */}
          <div className="text-center space-y-1.5">
            <Logo size="md" className="justify-center" />
            <p className={'text-xs font-body ' + (isLight ? 'text-slate-600' : 'text-zinc-400')}>
              Municipal AI Intelligence &amp; Citizen Dispatch Gateway
            </p>
          </div>

          {/* Holographic Cyber-Glass Card — Light & Dark Mode Harmonized */}
          <div className={'relative rounded-3xl border backdrop-blur-2xl overflow-hidden glass-card--border-glow p-7 sm:p-9 transition-colors duration-300 ' +
            (isLight
              ? 'bg-white/90 border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.1)]'
              : 'bg-black/75 border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)]')}>
            
            {/* Top Specular Rim Accent */}
            <div className={'absolute top-0 left-8 right-8 h-[2px] pointer-events-none ' +
              (isLight
                ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent'
                : 'bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent')} />

            {/* Verification Scanning HUD Overlay */}
            {isVerifying && (
              <div className={'absolute inset-0 z-30 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-5 animate-in fade-in duration-200 ' + (isLight ? 'bg-white/95 text-slate-900' : 'bg-black/92 text-white')}>
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className={'absolute inset-0 rounded-full border-2 border-t-emerald-500 animate-spin ' + (isLight ? 'border-slate-200' : 'border-neutral-700/60')} />
                  <div className="absolute inset-2 rounded-full border border-dashed border-emerald-500/40 animate-[spin_4s_linear_infinite_reverse]" />
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Activity size={18} className="animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-2 max-w-xs">
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                    <Radio size={14} className="animate-pulse" />
                    {verificationStep === 1 && 'Scanning Sector Credentials…'}
                    {verificationStep === 2 && 'Validating Cryptographic Ledger…'}
                  </p>
                  <div className={'w-48 h-1.5 rounded-full overflow-hidden mx-auto ' + (isLight ? 'bg-slate-200' : 'bg-neutral-800')}>
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700 rounded-full"
                      style={{ width: verificationStep === 1 ? '50%' : '92%' }}
                    />
                  </div>
                  <span className={'text-[10px] font-mono block ' + (isLight ? 'text-slate-500' : 'text-zinc-500')}>
                    {verificationStep === 1 ? 'Sector Handshake: Phase 1/2' : 'Sector Handshake: Phase 2/2'}
                  </span>
                </div>
              </div>
            )}

            {/* Verified Success Confirmation */}
            {verifiedSuccess && (
              <div className={'absolute inset-0 z-30 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300 ' + (isLight ? 'bg-white/95 text-slate-900' : 'bg-black/92 text-white')}>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
                  <CheckCircle2 size={36} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-bold font-display">Clearance Authenticated</p>
                  <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    Launching {role === 'admin' ? 'Command Center Grid' : 'Citizen Incident Portal'}…
                  </p>
                </div>
              </div>
            )}

            {/* Active Session Notification (if authenticated already) */}
            {activeSession && (
              <div className={'mb-5 p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono animate-in fade-in duration-200 ' +
                (isLight
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
                  : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400')}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="truncate">
                    <span className="font-semibold">{activeSession.name}</span>
                    <span className={'text-[10px] block sm:inline sm:ml-2 ' + (isLight ? 'text-slate-600' : 'text-zinc-400')}>
                      ({activeSession.role} session active)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={activeSession.role === 'ADMIN' ? '/dashboard' : '/report'}>
                    <button
                      type="button"
                      className={'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ' +
                        (isLight
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-500/25 hover:bg-emerald-500/35 text-emerald-400 border border-emerald-500/50')}
                    >
                      Enter Grid <ArrowRight size={11} />
                    </button>
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOutActive}
                    className={'p-1.5 rounded-lg transition-colors cursor-pointer ' +
                      (isLight ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-100' : 'text-rose-400 hover:text-rose-300 hover:bg-white/10')}
                    title="Sign Out to switch operator"
                  >
                    <LogOut size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Tactile Clearance Switcher Tabs */}
            <div className={'grid grid-cols-2 gap-2 p-1.5 rounded-2xl border mb-5 ' +
              (isLight
                ? 'bg-slate-100/90 border-slate-200/90'
                : 'bg-black/60 border-white/10')}>
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={'group relative flex flex-col items-center justify-center py-3 px-3 rounded-xl font-display text-xs font-semibold transition-all duration-200 cursor-pointer overflow-hidden ' +
                  (role === 'admin'
                    ? (isLight
                        ? 'bg-white text-slate-900 border border-emerald-500/50 shadow-[0_2px_12px_rgba(16,185,129,0.18)]'
                        : 'bg-emerald-500/15 text-white border border-emerald-500/50 shadow-[0_0_20px_rgba(0,245,155,0.25)]')
                    : (isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'))}
              >
                <div className="flex items-center gap-2">
                  <Shield size={15} className={role === 'admin' ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-slate-400' : 'text-zinc-500')} />
                  <span className="font-bold tracking-wide">Admin Command</span>
                </div>
                <span className={'text-[9px] font-mono mt-0.5 ' + (role === 'admin' ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : (isLight ? 'text-slate-500' : 'text-zinc-500'))}>
                  Municipal Operator
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('user')}
                className={'group relative flex flex-col items-center justify-center py-3 px-3 rounded-xl font-display text-xs font-semibold transition-all duration-200 cursor-pointer overflow-hidden ' +
                  (role === 'user'
                    ? (isLight
                        ? 'bg-white text-slate-900 border border-cyan-500/50 shadow-[0_2px_12px_rgba(6,182,212,0.18)]'
                        : 'bg-cyan-500/15 text-white border border-cyan-500/50 shadow-[0_0_20px_rgba(0,229,255,0.25)]')
                    : (isLight
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60 border border-transparent'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent'))}
              >
                <div className="flex items-center gap-2">
                  <UserCheck size={15} className={role === 'user' ? (isLight ? 'text-cyan-600' : 'text-cyan-400') : (isLight ? 'text-slate-400' : 'text-zinc-500')} />
                  <span className="font-bold tracking-wide">Citizen Portal</span>
                </div>
                <span className={'text-[9px] font-mono mt-0.5 ' + (role === 'user' ? (isLight ? 'text-cyan-700' : 'text-cyan-400') : (isLight ? 'text-slate-500' : 'text-zinc-500'))}>
                  Public Safety Desk
                </span>
              </button>
            </div>

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className={'text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center justify-between ' + (isLight ? 'text-slate-700' : 'text-zinc-300')}>
                  <span>{role === 'admin' ? 'Operator Identifier' : 'Citizen Identifier'}</span>
                  <span className={'text-[9px] font-normal ' + (isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400')}>REQUIRED</span>
                </label>
                <div className="relative group">
                  <div className={'absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ' +
                    (isLight ? 'text-slate-400 group-focus-within:text-emerald-600' : 'text-zinc-500 group-focus-within:text-emerald-400')}>
                    {role === 'admin' ? <Shield size={14} /> : <UserCheck size={14} />}
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={role === 'admin' ? 'e.g. operator.krishnan' : 'e.g. citizen.user'}
                    className={'w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-mono transition-all outline-none ' +
                      (isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm'
                        : 'bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 shadow-inner')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={'text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center justify-between ' + (isLight ? 'text-slate-700' : 'text-zinc-300')}>
                  <span>Security Passcode</span>
                  <span className={'text-[9px] font-normal ' + (isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400')}>ENCRYPTED</span>
                </label>
                <div className="relative group">
                  <div className={'absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ' +
                    (isLight ? 'text-slate-400 group-focus-within:text-emerald-600' : 'text-zinc-500 group-focus-within:text-emerald-400')}>
                    <Lock size={14} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={'w-full h-11 pl-10 pr-11 rounded-xl border text-xs font-mono tracking-widest transition-all outline-none ' +
                      (isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-sm'
                        : 'bg-black/60 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 shadow-inner')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={'absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1.5 rounded-lg cursor-pointer ' +
                      (isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60' : 'text-zinc-400 hover:text-white hover:bg-white/10')}
                    title={showPassword ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Clearance Hint */}
              <div className={'px-1 text-[10px] font-mono flex items-center justify-between ' + (isLight ? 'text-slate-500' : 'text-zinc-400')}>
                <span>{role === 'admin' ? 'Clearance: Level-4 Admin' : 'Access: Public Citizen Desk'}</span>
                <span>admin123 / user123</span>
              </div>

              {errorMessage && (
                <div className={'text-xs font-mono p-3 rounded-xl flex items-start gap-2 animate-in fade-in duration-150 border ' +
                  (isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-400')}>
                  <span className="font-bold shrink-0">!</span>
                  <p className="leading-snug">{errorMessage}</p>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                className={'group relative w-full h-12 rounded-xl font-display font-extrabold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 mt-4 ' +
                  (isLight
                    ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-[0_6px_24px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_32px_rgba(16,185,129,0.5)] active:scale-[0.99]'
                    : 'bg-gradient-to-r from-[#00f59b] via-[#00dc82] to-[#059669] text-black shadow-[0_0_28px_rgba(0,245,155,0.45)] hover:shadow-[0_0_38px_rgba(0,245,155,0.65)] hover:scale-[1.01] active:scale-[0.99] border border-emerald-200/50')}
              >
                <span>Authorize &amp; Launch {role === 'admin' ? 'Command Grid' : 'Citizen Portal'}</span>
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </button>
            </form>

            {/* Security Clearance Footer */}
            <div className={'mt-6 pt-5 border-t flex items-center justify-between text-[10px] font-mono flex-wrap gap-2 ' +
              (isLight ? 'border-slate-200 text-slate-500' : 'border-white/10 text-zinc-400')}>
              <span className="flex items-center gap-1.5">
                <Shield size={11} className={isLight ? 'text-emerald-600' : 'text-emerald-400'} /> TLS 1.3 // 256-Bit Encrypted
              </span>
              <span className="flex items-center gap-1">
                <Sparkles size={11} className={isLight ? 'text-cyan-600' : 'text-cyan-400'} /> Nagar-Drishti v2.4 OS
              </span>
            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className={'w-full max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono z-20 py-2 ' +
        (isLight ? 'text-slate-600' : 'text-zinc-400')}>
        <div>
          <span>Integrated Smart City Command Network · Prayagraj Optical Node Grid</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className={'transition-colors ' + (isLight ? 'hover:text-slate-950' : 'hover:text-white')}>
            Terms of Clearance
          </Link>
          <span className={isLight ? 'text-slate-300' : 'text-zinc-700'}>|</span>
          <Link href="/" className={'transition-colors ' + (isLight ? 'hover:text-slate-950' : 'hover:text-white')}>
            Optical Grid Diagnostics
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center text-xs font-mono text-emerald-400">Loading Authorization Terminal…</div>}>
      <LoginFormContent />
    </Suspense>
  );
}
