'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Shield,
  Zap,
  Activity,
  ArrowRight,
  Video,
  Car,
  TrendingUp,
  Cpu,
  Lock,
  Globe,
  Radio,
  BarChart3,
  Route,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge }  from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';

// 3D R3F Background Scene with zero SSR errors
const HeroScene = dynamic(() => import('@/components/three/HeroScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#050711]" />,
});

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as any } }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050711] text-white relative overflow-hidden font-body select-none">

      {/* ── Multi-Chromatic Ambient Light Orbs ── */}
      <div className="absolute top-[-10%] left-[10%] w-[55vw] h-[55vw] bg-indigo-500/[0.12] rounded-full blur-[190px] pointer-events-none z-0" />
      <div className="absolute top-[35%] right-[-10%] w-[50vw] h-[50vw] bg-cyan-500/[0.12] rounded-full blur-[190px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[45vw] h-[45vw] bg-pink-500/[0.08] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="absolute top-[70%] right-[20%] w-[40vw] h-[40vw] bg-emerald-500/[0.06] rounded-full blur-[180px] pointer-events-none z-0" />

      {/* ── Floating Spectral Glass Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-3.5 px-6 rounded-2xl bg-[rgba(13,19,40,0.7)] backdrop-blur-2xl border border-white/10 shadow-[0_16px_48px_rgba(0,0,0,0.85),_inset_0_1px_0_rgba(255,255,255,0.12)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] p-0.5">
              <div className="w-full h-full rounded-[10px] bg-[#050711]/40 flex items-center justify-center">
                <Zap size={16} className="text-white font-extrabold fill-white" />
              </div>
            </div>
            <span className="font-display font-extrabold text-lg text-white">
              Urban<span className="text-gradient-spectral">Pulse</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-display uppercase tracking-widest font-bold text-slate-400">
            <a href="#pipeline" className="hover:text-cyan-300 transition-colors">Neural Pipeline</a>
            <a href="#capabilities" className="hover:text-cyan-300 transition-colors">Capabilities</a>
            <a href="#telemetry" className="hover:text-cyan-300 transition-colors">Telemetry</a>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="cyan" dot pulse size="sm">Grid Active</Badge>
            <Link href="/dashboard">
              <Button variant="primary" size="sm">
                Command Center <ArrowRight size={13} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section with 3D Neural Mesh ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 px-6 z-10">
        <HeroScene />

        <div className="max-w-5xl mx-auto text-center relative z-20 space-y-8 py-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/15 via-cyan-500/15 to-pink-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold tracking-widest shadow-[0_0_25px_rgba(6,182,212,0.25)]">
            <Radio size={13} className="text-cyan-400 animate-pulse-live" />
            AI-POWERED CITY-WIDE VEHICLE INTELLIGENCE
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight font-display leading-[1.06]">
            Transform Optical Feeds Into <br />
            <span className="text-gradient-spectral">Neural Vector Intelligence</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-body leading-relaxed">
            Neural ANPR plate recognition, multi-camera spatial trajectory synthesis, and real-time municipal traffic analytics engineered for public safety and smart city operations.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
                Explore Command Center <ArrowRight size={17} />
              </Button>
            </Link>
            <Link href="/vehicles/TN38AB1234">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                <Car size={17} /> Track Target <span className="font-mono ml-1 text-cyan-300">TN38AB1234</span>
              </Button>
            </Link>
          </div>

          {/* Multi-Color Sensor Metric Chips */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto"
          >
            {[
              { val: '99.4%', label: 'OCR RECOGNITION', text: 'text-emerald-400' },
              { val: '<140ms', label: 'EDGE INFERENCE', text: 'text-cyan-400' },
              { val: '10+', label: 'OPTICAL NODES', text: 'text-violet-400' },
              { val: '24/7', label: 'ANOMALY SENTINEL', text: 'text-rose-400' },
            ].map((m, i) => (
              <motion.div variants={fadeUp} key={i}>
                <GlassCard padding="sm" className="p-4 text-center">
                  <div className={`text-2xl font-extrabold font-data ${m.text}`}>{m.val}</div>
                  <div className="text-[10px] font-display text-slate-400 mt-1 tracking-widest uppercase font-bold">{m.label}</div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Section: 4-Step Neural Pipeline ── */}
      <section id="pipeline" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <Badge variant="cyan" size="md">NEURAL PIPELINE</Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            From Raw CCTV Photons to Vector Telemetry
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm font-body">
            Four synchronized layers transform fragmented optical streams into unified municipal intelligence.
          </p>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { step: '01', title: 'Detect', icon: Video, desc: 'YOLO edge inference classifies vehicle types, colors, and bounding coordinates in real-time at 30 FPS.', glow: 'emerald', iconColor: 'text-emerald-400', iconBg: 'bg-emerald-500/15 border-emerald-500/30' },
            { step: '02', title: 'Recognize', icon: Cpu, desc: 'Neural ANPR OCR reads and validates license plates under low-light and adverse weather conditions.', glow: 'cyan', iconColor: 'text-cyan-400', iconBg: 'bg-cyan-500/15 border-cyan-500/30' },
            { step: '03', title: 'Connect', icon: Route, desc: 'Correlates timestamps and GPS metadata across adjacent intersection nodes to construct complete trajectory journeys.', glow: 'violet', iconColor: 'text-violet-400', iconBg: 'bg-violet-500/15 border-violet-500/30' },
            { step: '04', title: 'Sentinel', icon: Shield, desc: 'Automated heuristics flag blacklisted targets, route anomalies, and traffic surges instantly.', glow: 'crimson', iconColor: 'text-rose-400', iconBg: 'bg-rose-500/15 border-rose-500/30' },
          ].map((card, i) => (
            <motion.div variants={fadeUp} key={i} className="h-full">
              <GlassCard hover glow={card.glow as any} className="flex flex-col justify-between p-7 h-full">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className={`p-3.5 rounded-2xl ${card.iconBg} ${card.iconColor} border shadow-lg`}>
                      <card.icon size={22} />
                    </div>
                    <span className="text-2xl font-data font-extrabold text-slate-600">{card.step}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white font-display mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-body">{card.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Section: Core Capabilities ── */}
      <section id="capabilities" className="py-20 px-6 relative z-10 max-w-7xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <motion.div variants={fadeUp} className="h-full">
            <GlassCard hover glow="violet" className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="p-3.5 rounded-2xl bg-violet-500/15 text-violet-400 border border-violet-500/30 w-fit mb-5 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                  <Car size={24} />
                </div>
                <h3 className="text-xl font-bold text-white font-display mb-2.5">Vehicle Intelligence</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-5 font-body">
                  Instantly look up any vehicle plate, inspect its camera sighting timeline, and playback full animated journey routes with speed and duration telemetry.
                </p>
              </div>
              <Link href="/vehicles" className="inline-flex items-center gap-2 text-xs font-display text-violet-400 font-bold hover:text-white transition-colors tracking-wide uppercase">
                Explore Vehicles <ArrowRight size={13} />
              </Link>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="h-full">
            <GlassCard hover glow="cyan" className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="p-3.5 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 w-fit mb-5 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-xl font-bold text-white font-display mb-2.5">Traffic Analytics</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-5 font-body">
                  Diurnal 24-hour vehicle volume curves, live camera density bars, congestion scoring, and automated anomaly warnings for city planners.
                </p>
              </div>
              <Link href="/analytics" className="inline-flex items-center gap-2 text-xs font-display text-cyan-400 font-bold hover:text-white transition-colors tracking-wide uppercase">
                View Analytics <ArrowRight size={13} />
              </Link>
            </GlassCard>
          </motion.div>

          <motion.div variants={fadeUp} className="h-full">
            <GlassCard hover glow="crimson" className="p-8 flex flex-col justify-between h-full">
              <div>
                <div className="p-3.5 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 w-fit mb-5 shadow-[0_0_20px_rgba(244,63,94,0.25)]">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-bold text-white font-display mb-2.5">Sentinel Threat Alerts</h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-5 font-body">
                  Automated security sentinel flagging watchlist/blacklisted vehicles, unusual route divergence, and camera connectivity dropouts.
                </p>
              </div>
              <Link href="/alerts" className="inline-flex items-center gap-2 text-xs font-display text-rose-400 font-bold hover:text-white transition-colors tracking-wide uppercase">
                Access Alerts <ArrowRight size={13} />
              </Link>
            </GlassCard>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Closing CTA Banner (Spacious & Clean Redesign) ── */}
      <section className="py-24 px-6 relative z-10 max-w-6xl mx-auto">
        <GlassCard padding="lg" glow="spectral" className="p-10 sm:p-16 text-center space-y-8 relative overflow-hidden border border-white/15 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
          {/* Subtle background ambient pulse inside card */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <Badge variant="cyan" dot pulse size="sm">Live Node Network</Badge>
            <Badge variant="spectral" size="sm">Sub-140ms Latency</Badge>
            <Badge variant="default" size="sm">Sector Chennai Central</Badge>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white font-display tracking-tight leading-[1.12]">
              Ready to Deploy Municipal <br />
              <span className="text-gradient-spectral">Vehicle Intelligence?</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-body leading-relaxed max-w-2xl mx-auto">
              Launch the UrbanPulse command center to access real-time neural ANPR feeds, trajectory tracking histories, and city-wide traffic telemetry.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="w-full sm:w-auto px-10 shadow-[0_0_35px_rgba(6,182,212,0.4)]">
                Launch Command Center <ArrowRight size={17} />
              </Button>
            </Link>
            <Link href="/alerts">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                <Shield size={16} /> View Sentinel Threats
              </Button>
            </Link>
          </div>
        </GlassCard>
      </section>

      {/* ── Spacious Multi-Column Enterprise Footer ── */}
      <footer className="relative z-10 border-t border-white/10 bg-[rgba(5,7,17,0.95)] backdrop-blur-2xl pt-16 pb-12 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Main Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            
            {/* Col 1: Brand & Identity */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-cyan-400 to-pink-500 flex items-center justify-center p-0.5 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                  <div className="w-full h-full rounded-[10px] bg-[#050711]/50 flex items-center justify-center">
                    <Zap size={16} className="text-white fill-white" />
                  </div>
                </div>
                <span className="font-display font-extrabold text-lg text-white">
                  Urban<span className="text-gradient-spectral">Pulse</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-body leading-relaxed">
                Autonomous vehicle intelligence and smart municipal traffic telemetry operating system engineered for Chennai's smart roads.
              </p>
              <div className="pt-1">
                <Badge variant="emerald" dot pulse size="sm">Grid Operational</Badge>
              </div>
            </div>

            {/* Col 2: Platform Navigation */}
            <div className="space-y-3.5">
              <p className="text-xs font-display font-bold uppercase tracking-widest text-slate-300">
                Command Grid
              </p>
              <ul className="space-y-2 text-xs font-body text-slate-400">
                <li><Link href="/dashboard" className="hover:text-cyan-300 transition-colors">Command Center</Link></li>
                <li><Link href="/cameras" className="hover:text-cyan-300 transition-colors">Optical Feed Grid</Link></li>
                <li><Link href="/vehicles" className="hover:text-cyan-300 transition-colors">Vehicle Intelligence</Link></li>
                <li><Link href="/analytics" className="hover:text-cyan-300 transition-colors">Traffic Analytics</Link></li>
                <li><Link href="/network" className="hover:text-cyan-300 transition-colors">Movement Network</Link></li>
              </ul>
            </div>

            {/* Col 3: Operations & Sentinel */}
            <div className="space-y-3.5">
              <p className="text-xs font-display font-bold uppercase tracking-widest text-slate-300">
                Operations & Sentinel
              </p>
              <ul className="space-y-2 text-xs font-body text-slate-400">
                <li><Link href="/alerts" className="hover:text-rose-400 transition-colors">Sentinel Threat Alerts</Link></li>
                <li><Link href="/system" className="hover:text-amber-400 transition-colors">System Diagnostics</Link></li>
                <li><Link href="/vehicles/TN38AB1234/trajectory" className="hover:text-cyan-300 transition-colors">Trajectory Playback</Link></li>
                <li><span className="text-slate-600">ANPR Neural Engine v2.4</span></li>
                <li><span className="text-slate-600">Edge Stream Ingestion</span></li>
              </ul>
            </div>

            {/* Col 4: Platform Status & Credentials */}
            <div className="space-y-3.5">
              <p className="text-xs font-display font-bold uppercase tracking-widest text-slate-300">
                Mission Credentials
              </p>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500">SECTOR:</span>
                  <span className="text-cyan-300 font-bold">Chennai Central</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">OPERATOR:</span>
                  <span className="text-white">Rahul Krishnan</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">TELEMETRY:</span>
                  <span className="text-emerald-400 font-bold">30 FPS Live</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Divider & Copyright */}
          <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-body text-slate-500">
            <p>© {new Date().getFullYear()} UrbanPulse AI. Authorized smart city operations platform.</p>
            <p className="flex items-center gap-1.5 text-slate-400">
              Built by <span className="text-cyan-300 font-semibold">Team Antigravity</span> for Smart City Chennai
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}