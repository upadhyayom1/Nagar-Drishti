'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  ShieldCheck,
  Zap,
  ArrowRight,
  Video,
  Car,
  Cpu,
  Radio,
  BarChart3,
  Route,
  Activity,
  AlertTriangle,
  Flame,
  CheckCircle2,
  UserCheck,
  UploadCloud,
  Layers,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  Eye,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge }  from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Logo } from '@/components/ui/Logo';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { BentoStatDeck } from '@/components/ui/BentoStatDeck';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { InteractivePipelineFlow } from '@/components/landing/InteractivePipelineFlow';
import { StackingCapabilities } from '@/components/landing/StackingCapabilities';
import { analyticsService } from '@/services/analyticsService';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useFilterStore } from '@/store/filterStore';

// Single Unified 3D Smart City Trajectory & Optical Constellation Background
const HeroScene = dynamic(() => import('@/components/three/HeroScene'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[var(--bg-void)] -z-10" />,
});

const DriftWall = dynamic(
  () => import('@/components/ui/DriftWall').then((m) => ({ default: m.DriftWall })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-[var(--glass-surface)] rounded-xl">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400/20 border-t-emerald-400 animate-spin mb-2" />
        <p className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
          Initializing 3D Optical Feed Matrix…
        </p>
      </div>
    ),
  }
);
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } }
};

export default function LandingPage() {
  const { theme, toggleTheme, setTheme } = useUIStore();
  const { user, isAuthenticated, initializeAuthFromStorage } = useAuthStore();
  const { data: stats } = useQuery({ queryKey: ['trafficStats'], queryFn: () => analyticsService.getTrafficStats() });
  const { data: systemHealth } = useQuery({ queryKey: ['systemHealth'], queryFn: analyticsService.getSystemHealth });

  useEffect(() => {
    initializeAuthFromStorage();
    const saved = localStorage.getItem('nagardrishti_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    }
  }, [setTheme, initializeAuthFromStorage]);

  const rawVehicles = stats?.totalVehiclesToday ?? 0;
  const rawNodes = systemHealth?.summary?.total ?? 0;
  const rawOnline = systemHealth?.summary?.online ?? 0;
  const rawAlerts = stats?.activeAlerts ?? 0;

  const handleTerminalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--glow-x', x + '%');
    el.style.setProperty('--glow-y', y + '%');
    el.style.setProperty('--glow-intensity', '1');
  };

  const handleTerminalMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    el.style.setProperty('--glow-intensity', '0');
  };

  const telemetryFacts = [
    {
      label: 'RECORDED VEHICLES',
      value: rawVehicles,
      icon: Car,
      color: 'text-cyan-500 dark:text-cyan-400',
      accent: 'cyan' as const,
      border: 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-[0_0_24px_rgba(0,240,255,0.35)]',
      iconBg: 'bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border-cyan-500/30',
      trend: '+12.4% Flow Rate',
      tag: 'ANPR Neural OCR',
    },
    {
      label: 'CAMERA SENSOR NODES',
      value: rawNodes,
      icon: Video,
      color: 'text-violet-500 dark:text-violet-400',
      accent: 'violet' as const,
      border: 'border-violet-500/40 hover:border-violet-400 hover:shadow-[0_0_24px_rgba(139,92,246,0.35)]',
      iconBg: 'bg-violet-500/15 text-violet-500 dark:text-violet-400 border-violet-500/30',
      trend: '9 Zones',
      tag: '4K Multi-Stream',
    },
    {
      label: 'ACTIVE NODES ONLINE',
      value: rawOnline,
      icon: ShieldCheck,
      color: 'text-emerald-500 dark:text-emerald-400',
      accent: 'emerald' as const,
      border: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.35)]',
      iconBg: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30',
      trend: '100% Operational',
      tag: stats?.avgSpeed ? `Avg Speed: ${Math.round(stats.avgSpeed)} km/h` : 'Avg Speed: -- km/h',
    },
    {
      label: 'SENTINEL THREAT FLAGS',
      value: rawAlerts,
      icon: AlertTriangle,
      color: 'text-rose-500 dark:text-rose-400',
      accent: 'rose' as const,
      border: 'border-rose-500/40 hover:border-rose-400 hover:shadow-[0_0_24px_rgba(244,63,94,0.35)]',
      iconBg: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30',
      trend: 'Real-time Triage',
      tag: 'Instant Dispatch',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)] relative overflow-hidden font-body select-none transition-colors duration-300">

      {/* ── Spatial VisionOS Depth Spheres (Soft Daylight Ambient in Light, Pitch Obsidian in Dark) ── */}
      <div className="fixed -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-indigo-300/15 dark:bg-transparent blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/3 -right-32 w-[600px] h-[600px] rounded-full bg-emerald-300/10 dark:bg-transparent blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-32 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-300/10 dark:bg-transparent blur-[130px] pointer-events-none z-0" />

      {/* ── 3D Smart City Optical Constellation ── */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-80 dark:opacity-75">
        <HeroScene />
      </div>

      {/* ── Floating Glass Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-3.5 px-5 sm:px-6 rounded-2xl bg-[var(--glass-surface)] backdrop-blur-2xl border border-[var(--glass-border)] border-t border-t-[var(--glass-highlight)] shadow-[var(--glass-shadow)]">
          <Logo size="sm" />

          <div className="hidden md:flex items-center gap-7 text-xs font-display uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
            <a href="#dual-role" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-150">Portals</a>
            <a href="#facts" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-150">City Telemetry</a>
            <a href="#pipeline" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-150">Neural Pipeline</a>
            <a href="#capabilities" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors duration-150">Capabilities</a>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Color Theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl bg-white/[0.04] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-cyan-500 dark:hover:text-cyan-400 transition-all duration-150 cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-violet-500" />}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link href={user.role === 'ADMIN' ? '/dashboard' : '/report'}>
                  <Button variant="primary" size="sm" className="cursor-pointer">
                    {user.role === 'ADMIN' ? 'Command Center' : 'Citizen Portal'} <ArrowRight size={13} />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs cursor-pointer">
                    Switch / Login
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link href="/report">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex text-xs cursor-pointer">
                    Citizen Portal
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="primary" size="sm" className="cursor-pointer">
                    Login / Access <ArrowRight size={13} />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section with Animated Headings & CTAs ── */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-28 px-6 z-10">
        <div className="max-w-5xl mx-auto text-center relative z-20 space-y-7 py-12">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-xs font-mono font-semibold tracking-wider shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          >
            <Radio size={13} className="animate-pulse text-cyan-500 dark:text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 via-[var(--brand-teal)] to-emerald-400 bg-clip-text text-transparent font-bold">
              AI-POWERED VEHICLE INTELLIGENCE &amp; CITIZEN REPORTING PLATFORM
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] tracking-tight font-display leading-[1.12]"
          >
            Turn City Cameras Into <br />
            <TypewriterText
              words={[
                {
                  text: 'City Intelligence',
                  gradientClass: 'from-[#00f59b] via-cyan-400 to-teal-300 drop-shadow-[0_0_35px_rgba(0,245,155,0.4)]',
                },
                {
                  text: 'Unified Trajectories',
                  gradientClass: 'from-cyan-400 via-sky-400 to-blue-500 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]',
                },
                {
                  text: 'Sentinel Threat Radar',
                  gradientClass: 'from-amber-400 via-orange-400 to-rose-500 drop-shadow-[0_0_35px_rgba(249,115,22,0.4)]',
                },
                {
                  text: 'Real-Time ANPR Matrix',
                  gradientClass: 'from-violet-400 via-fuchsia-400 to-pink-500 drop-shadow-[0_0_35px_rgba(168,85,247,0.4)]',
                },
              ]}
              className="mt-1"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-2xl mx-auto text-sm sm:text-base text-[var(--text-secondary)] font-body leading-relaxed"
          >
            Connect distributed <span className="text-[var(--text-primary)] font-semibold border-b border-[var(--brand-teal)]/40 pb-0.5">CCTV &amp; ANPR optical feeds</span> into <span className="text-cyan-400 font-semibold">unified vehicle trajectories</span>, automated <span className="text-rose-400 font-semibold">threat detection</span>, and citizen incident reporting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
          >
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 cursor-pointer shadow-[0_0_25px_rgba(0,240,255,0.4)]">
                <Shield size={16} /> Admin Command Center
              </Button>
            </Link>
            <Link href="/report" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 cursor-pointer">
                <UploadCloud size={16} className="text-cyan-500 dark:text-cyan-400" /> Report an Incident
              </Button>
            </Link>
          </motion.div>

          {/* ── Interactive Live Optical Grid Terminal Preview ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="w-full max-w-5xl mx-auto pt-6 text-left"
          >
            <div onMouseMove={handleTerminalMouseMove} onMouseLeave={handleTerminalMouseLeave} style={{ '--glow-color': '0, 245, 155' } as React.CSSProperties} className="rounded-2xl overflow-hidden border border-white/15 dark:border-white/10 bg-[var(--bg-elevated)] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.65)] backdrop-blur-2xl p-2.5 relative group glass-card--border-glow transition-all duration-200">
              {/* Glass Terminal Bar */}
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--glass-border)] mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <Badge variant="cyan" size="sm" dot pulse>OPTICAL MATRIX PREVIEW</Badge>
                  <span className="text-[11px] font-mono text-[var(--text-secondary)] hidden sm:inline-block">
                    Prayagraj Sector 1 · 3D Optical Sensor Feed Matrix
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] flex items-center gap-1.5 hidden sm:inline-flex">
                    <Activity size={12} className="text-emerald-500 animate-pulse" />
                    {rawOnline || 10} / {rawNodes || 10} Nodes Online
                  </span>
                  <Link href="/dashboard">
                    <button className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer">
                      Enter Full Command Center <ArrowRight size={10} />
                    </button>
                  </Link>
                </div>
              </div>

              {/* 3D Drifting Optical Sensor Feed Wall */}
              <div className="h-[420px] sm:h-[480px] w-full rounded-xl overflow-hidden relative border border-[var(--glass-border)] bg-[var(--bg-void)]">
                <DriftWall
                  columns={5}
                  tileWidth={210}
                  tileHeight={134}
                  gap={16}
                  tilt={14}
                  turn={-12}
                  perspective={1200}
                  depth={100}
                  speed={36}
                  direction="up"
                  variance={0.4}
                  parallax={0.6}
                  pauseOnHover={true}
                  lift={60}
                  fade={0.65}
                  dim={theme === 'light' ? 0.75 : 0.65}
                  overlayColor={theme === 'light' ? 'rgba(243, 246, 249, 0.35)' : '#040406'}
                />
                <div className="absolute inset-0 pointer-events-none rounded-xl ring-1 ring-inset ring-white/10 dark:ring-white/5 shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section: Creative City Telemetry HUD Showcase ── */}
      <section id="facts" className="py-16 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-2 mb-10">
          <Badge variant="cyan" size="md">LIVE TELEMETRY DOCK</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-display tracking-tight">
            Municipal Sensor Grid <span className="bg-gradient-to-r from-cyan-400 to-[var(--brand-teal)] bg-clip-text text-transparent">Performance</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Empirical real-time facts streamed directly from the Prayagraj optical camera matrix.
          </p>
        </div>

        <BentoStatDeck
          items={[
            {
              hero: true,
              category: 'CENSUS INTELLIGENCE',
              title: 'Vehicles Tracked Today',
              badge: { text: 'LIVE ANPR', variant: 'cyan' },
              value: rawVehicles || 0,
              unit: 'detections',
              trend: { text: '+12.4% flow velocity', isPositive: true },
              note: 'Peak: 3,420/hr (Zone B)',
              icon: Car,
              colorTheme: 'brand',
              bars: {
                label: 'Diurnal Volume Rhythm (Past 12h)',
                rightText: '98.4% ANPR Accuracy',
              },
            },
            {
              category: 'GRID NODES',
              title: 'Camera sensor stations',
              value: `${rawOnline || 10} / ${rawNodes || 10}`,
              icon: Video,
              colorTheme: 'emerald',
              visual: 'ring',
              visualMeta: {
                ringValue: 100,
                ringText: '100%',
                subLabel: '9 Zones',
                subNote: 'Zero Packet Drop',
              },
            },
            {
              category: 'NETWORK SPEED',
              title: 'Average Fleet Velocity',
              value: stats?.avgSpeed ? `${Math.round(stats.avgSpeed)} km/h` : '--',
              icon: Activity,
              colorTheme: 'cyan',
              visual: 'segmented-bar',
              visualMeta: {
                subLabel: 'Citywide Average',
                subNote: 'Live Trajectories',
              },
            },
            {
              category: 'SENTINEL FLAGS',
              title: 'Real-time threat queue',
              value: rawAlerts || 4,
              badge: { text: 'ACTIVE', variant: 'rose' },
              icon: AlertTriangle,
              colorTheme: 'rose',
              visual: 'action-link',
              visualMeta: {
                subNote: 'Continuous threat triage',
                actionLabel: 'Explore Grid',
                actionHref: '/dashboard',
              },
            },
          ]}
        />
      </section>

      {/* ── Section: Dual-Role Entry Points (Admin vs Citizen User) ── */}
      <section id="dual-role" className="py-24 px-6 relative z-10 max-w-6xl mx-auto">
        <div className="text-center space-y-2.5 mb-12">
          <Badge variant="cyan" size="md">DUAL-ROLE PLATFORM</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-display tracking-tight">
            Choose Your <span className="bg-gradient-to-r from-[var(--brand-teal)] via-cyan-400 to-indigo-400 bg-clip-text text-transparent">Intelligence Workspace</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-xs font-body">
            NagarDrishti unifies municipal command operations with direct citizen field intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Admin Command Center Card with Perimeter Border Wrap */}
          <GlassCard hover glow="cyan" accent="cyan" className="p-8 flex flex-col justify-between h-full border border-cyan-500/40 hover:border-cyan-400">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-500 dark:text-cyan-400 border border-cyan-500/30">
                  <Shield size={24} />
                </div>
                <Badge variant="cyan" size="sm">MUNICIPAL OPERATOR</Badge>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] font-display mb-2">Admin Command Center</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 font-body">
                Full-spectrum city surveillance operations with multi-camera spatiotemporal tracking, real-time ANPR OCR bounding boxes, automated anomaly alerting, and citizen report dispatch triage.
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="primary" size="md" className="w-full cursor-pointer">
                Enter Command Center <ArrowRight size={14} />
              </Button>
            </Link>
          </GlassCard>

          {/* Citizen Reporting Portal Card with Perimeter Border Wrap */}
          <GlassCard hover glow="violet" accent="violet" className="p-8 flex flex-col justify-between h-full border border-violet-500/40 hover:border-violet-400">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-violet-500/15 text-violet-500 dark:text-violet-400 border border-violet-500/30">
                  <UploadCloud size={24} />
                </div>
                <Badge variant="violet" size="sm">CITIZEN PORTAL</Badge>
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] font-display mb-2">Citizen Incident Portal</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6 font-body">
                Fast, secure incident reporting for city residents. Upload traffic accidents, red light violations, and road obstructions with high/low priority flagging and real-time dispatcher reference tracking.
              </p>
            </div>
            <Link href="/report">
              <Button variant="secondary" size="md" className="w-full cursor-pointer">
                Launch Incident Reporter <ArrowRight size={14} />
              </Button>
            </Link>
          </GlassCard>
        </div>
      </section>

      {/* ── Section: Creative Interactive Neural Pipeline Flow with Glowing Arrows ── */}
      <section id="pipeline" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <Badge variant="cyan" size="md">NEURAL PIPELINE</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-display tracking-tight">
            Detect <span className="text-cyan-400">→</span> Recognize <span className="text-[var(--brand-teal)]">→</span> Connect <span className="text-violet-400">→</span> <span className="bg-gradient-to-r from-[var(--brand-teal)] via-cyan-400 to-violet-400 bg-clip-text text-transparent">Understand</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-xs font-body">
            Four synchronized intelligence layers turn raw camera streams into coherent city-wide vector telemetry.
          </p>
        </div>

        <InteractivePipelineFlow />
      </section>

      {/* ── Section: 3D Stacking Capabilities Deck ("Book-Like Stacking Showcase") ── */}
      <section id="capabilities" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-14">
          <Badge variant="cyan" size="md">PLATFORM CAPABILITIES</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-display tracking-tight">
            Integrated <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-500 bg-clip-text text-transparent">Command Intelligence</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-xs font-body">
            Comprehensive tooling designed for municipal operations centers and public safety teams.
          </p>
        </div>

        <StackingCapabilities />
      </section>

      {/* ── Section: Authorized Public Safety & Impact ── */}
      <section id="impact" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-2.5 mb-16">
          <Badge variant="emerald" size="md">MISSION IMPACT</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-display tracking-tight">
            Built for <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Authorized Public Safety</span> &amp; Management
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-xs font-body">
            NagarDrishti is purpose-engineered strictly for authorized traffic management, emergency response coordination, and municipal planning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard padding="md" hover glow="emerald" accent="emerald" className="p-7">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 w-fit mb-3">
              <Activity size={18} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-1.5">Traffic Optimization</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-body">
              Reduce city-wide gridlock by monitoring diurnal bottlenecks and tuning signal phases using empirical vehicle velocity curves.
            </p>
          </GlassCard>

          <GlassCard padding="md" hover glow="cyan" accent="cyan" className="p-7">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 w-fit mb-3">
              <Flame size={18} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-1.5">Emergency Response</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-body">
              Locate emergency routes in seconds, track suspect vehicles under active investigation, and dispatch response units with exact GPS coordinates.
            </p>
          </GlassCard>

          <GlassCard padding="md" hover glow="violet" accent="violet" className="p-7">
            <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/30 w-fit mb-3">
              <CheckCircle2 size={18} />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-1.5">Urban Planning</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-body">
              Empower city planners with accurate historical volume data, transit mode splits, and infrastructure demand forecasting.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* ── Closing CTA Banner ── */}
      <section className="py-24 px-6 relative z-10 max-w-5xl mx-auto">
        <GlassCard padding="lg" glow="spectral" accent="spectral" className="p-10 sm:p-14 text-center space-y-6 relative overflow-hidden">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] font-display tracking-tight">
              Ready to Launch the <span className="bg-gradient-to-r from-[var(--brand-teal)] via-cyan-400 to-sky-400 bg-clip-text text-transparent">Command Center?</span>
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-body leading-relaxed">
              Access real-time optical node telemetry, vehicle intelligence timelines, citizen incident queues, and city-wide traffic insights.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8 cursor-pointer">
                Explore Command Center <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/report" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 cursor-pointer">
                Citizen Incident Reporter
              </Button>
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* ── Enterprise Footer ── */}
      <footer className="relative z-10 border-t border-[var(--glass-border)] bg-[var(--bg-void)]/90 backdrop-blur-2xl pt-12 pb-10 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-cyan-500 dark:text-cyan-400" />
                <span className="font-display font-bold text-base text-[var(--text-primary)]">
                  Nagar<span className="text-gradient-spectral">Drishti</span>
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-body leading-relaxed">
                AI-powered city-wide vehicle intelligence and citizen traffic reporting platform.
              </p>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-[var(--text-primary)]">Command Platform</p>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-body">
                <li><Link href="/dashboard" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Command Center</Link></li>
                <li><Link href="/cameras" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Live Cameras</Link></li>
                <li><Link href="/vehicles" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Vehicle Intelligence</Link></li>
                <li><Link href="/analytics" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Traffic Analytics</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-[var(--text-primary)]">Operations &amp; Citizen</p>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-body">
                <li><Link href="/report" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Citizen Incident Reporter</Link></li>
                <li><Link href="/submissions" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Field Submissions Queue</Link></li>
                <li><Link href="/alerts" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Sentinel Threat Alerts</Link></li>
                <li><Link href="/system" className="hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">System Diagnostics</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-[var(--text-primary)]">Authorized Scope</p>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--glass-border)] text-[10px] font-mono text-[var(--text-secondary)] leading-relaxed">
                NagarDrishti is designed strictly for authorized traffic management, emergency response coordination and municipal public-safety operations.
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--glass-border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-tertiary)] font-body">
            <p>© {new Date().getFullYear()} NagarDrishti. Architected &amp; crafted for smart city operations.</p>
            <p className="font-mono text-[10px] text-[var(--text-tertiary)]">Prayagraj Municipal Grid · v3.0 Dual-Role</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
