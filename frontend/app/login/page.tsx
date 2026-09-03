'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, KeyRound, ArrowRight, Shield, Radio, CheckCircle2, Lock, Zap, Sparkles, Activity } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Logo } from '@/components/ui/Logo';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'user' ? 'user' : 'admin';
  const { user, setUser, initializeAuthFromStorage } = useAuthStore();

  const [role, setRole] = useState<'admin' | 'user'>(initialRole);

  // Auto-redirect if user is already authenticated without signing out
  useEffect(() => {
    const activeUser = user || initializeAuthFromStorage();
    if (activeUser) {
      router.push(activeUser.role === 'ADMIN' ? '/dashboard' : '/report');
    }
  }, [user, initializeAuthFromStorage, router]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRoleSwitch = (newRole: 'admin' | 'user') => {
    setRole(newRole);
    setErrorMessage('');
    setUsername('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please provide both username and password');
      return;
    }

    setIsVerifying(true);
    setVerificationStep(1);
    setErrorMessage('');

    try {
      // 1. Verify with backend API
      const { authService } = await import('@/services/authService');
      const { user } = await authService.login(username, password);
      const expectedRole = role === 'admin' ? 'ADMIN' : 'USER';
      if (user.role !== expectedRole) {
        setErrorMessage(`This account is not authorized for the ${role === 'admin' ? 'admin command center' : 'citizen portal'}.`);
        setIsVerifying(false);
        setVerificationStep(0);
        return;
      }
      setUser(user);

      // 2. Play multi-stage HUD sequence
      setTimeout(() => {
        setVerificationStep(2);
      }, 700);

      setTimeout(() => {
        setVerificationStep(3);
        setIsVerifying(false);
        setVerifiedSuccess(true);
      }, 1400);

      setTimeout(() => {
        if (user.role === 'ADMIN') {
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
          : 'Authentication failed. Please check your credentials.';
      setErrorMessage(message || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] flex flex-col items-center justify-center p-4 relative overflow-hidden font-body select-none">
      
      {/* ── Neutral Ambient Orbs ── */}
      <div className="absolute top-[-15%] left-[20%] w-[55vw] h-[55vw] rounded-full blur-[190px] pointer-events-none bg-white/[0.015]" />
      <div className="absolute bottom-[-15%] right-[20%] w-[55vw] h-[55vw] rounded-full blur-[190px] pointer-events-none bg-white/[0.01]" />

      {/* ── Central Glass Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 space-y-5"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Logo size="md" className="justify-center" />
          <p className="text-xs text-[var(--text-secondary)] font-body mt-1">
            Municipal AI Intelligence &amp; Citizen Dispatch Gateway
          </p>
        </div>

        {/* Login Panel */}
        <GlassCard variant="textured" padding="lg" className="p-7 sm:p-8 space-y-6 relative overflow-hidden border border-neutral-800 shadow-xl bg-[var(--bg-elevated)]">

          {/* Multi-Stage Scanning HUD Animation during Verification */}
          {isVerifying && (
            <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-5 animate-in fade-in duration-200">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-neutral-700 border-t-[#10a37f] animate-spin" />
                <div className="w-8 h-8 rounded-full bg-[#10a37f]/10 border border-[#10a37f]/20 flex items-center justify-center text-[#10a37f]">
                  <Activity size={16} />
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs font-mono text-[#10a37f] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <Radio size={14} className="animate-pulse" />
                  {verificationStep === 1 && 'Scanning Biometric & Node Credentials…'}
                  {verificationStep === 2 && 'Validating Cryptographic Sector Signatures…'}
                </p>
                <div className="w-48 h-1 bg-neutral-800 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-[#10a37f] transition-all duration-700"
                    style={{ width: verificationStep === 1 ? '50%' : '95%' }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[var(--text-tertiary)] block">
                  {verificationStep === 1 ? 'Sector Handshake: Phase 1/2' : 'Sector Handshake: Phase 2/2'}
                </span>
              </div>
            </div>
          )}

          {/* Verified Success Screen */}
          {verifiedSuccess && (
            <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={36} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-bold font-display text-white">Access Authenticated</p>
                <p className="text-xs font-mono text-emerald-400">
                  Launching {role === 'admin' ? 'Command Center Grid' : 'Citizen Incident Portal'}…
                </p>
              </div>
            </div>
          )}

          {/* Dual-Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/[0.03] border border-[var(--glass-border)]">
            <button
              type="button"
              onClick={() => handleRoleSwitch('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-display text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                role === 'admin'
                  ? 'bg-[var(--bg-elevated-2)] text-[var(--text-primary)] border border-neutral-700'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <Shield size={14} className={role === 'admin' ? 'text-[#10a37f]' : ''} />
              Admin Command
            </button>

            <button
              type="button"
              onClick={() => handleRoleSwitch('user')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-display text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                role === 'user'
                  ? 'bg-[var(--bg-elevated-2)] text-[var(--text-primary)] border border-neutral-700'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
              }`}
            >
              <UserCheck size={14} className={role === 'user' ? 'text-[#10a37f]' : ''} />
              Citizen User
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold flex items-center justify-between">
                <span>{role === 'admin' ? 'Operator Identifier' : 'Citizen Email / Phone'}</span>
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'admin' ? 'e.g. operator.krishnan' : 'e.g. citizen@nagardrishti.gov'}
                className="h-10 text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                Security Key / Passcode
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-10 text-xs font-mono tracking-widest"
              />
            </div>

            {errorMessage && (
              <p className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full h-11 text-xs font-display uppercase tracking-wider font-bold cursor-pointer"
            >
              Authenticate &amp; Launch {role === 'admin' ? 'Command' : 'Portal'} <ArrowRight size={14} />
            </Button>
          </form>

          {/* Role Footnote */}
          <div className="pt-2 border-t border-[var(--glass-border)] text-center">
            <p className="text-[11px] font-mono text-[var(--text-tertiary)]">
              {role === 'admin' ? (
                <>Requires municipal security clearance</>
              ) : (
                <>Public safety upload &amp; tracking portal · No clearance needed</>
              )}
            </p>
          </div>
        </GlassCard>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/" className="text-xs font-mono text-[var(--text-secondary)] hover:text-cyan-400 transition-colors">
            ← Back to Overview
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-void)] flex items-center justify-center text-cyan-400 font-mono text-xs">
        Initializing Secure Gateway"¦
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
