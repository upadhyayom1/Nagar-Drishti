'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Cpu, Route, Shield, ArrowRight, Activity, Layers, Sparkles } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import DepthCarousel from '@/components/ui/DepthCarousel';
import { useUIStore } from '@/store/uiStore';

interface Step {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  icon: any;
  accent: 'emerald' | 'cyan' | 'violet' | 'rose';
  color: string;
  techBadge: string;
  desc: string;
  image: string;
  spec: { label: string; val: string }[];
}

const steps: Step[] = [
  {
    id: 'step-1',
    step: '01',
    title: 'Optical Ingestion',
    subtitle: 'High-FPS Frame Ingestion',
    icon: Video,
    accent: 'emerald',
    color: 'text-emerald-400',
    techBadge: '4K CCTV Matrix',
    image: 'https://images.unsplash.com/photo-1573152143286-0c422b4d2175?q=80&w=800&auto=format&fit=crop',
    desc: 'Captures raw H.264/H.265 RTSP streams across municipal camera nodes with sub-20ms frame extraction and spatial coordinate tagging.',
    spec: [
      { label: 'Ingestion Rate', val: '60 FPS' },
      { label: 'Latency', val: '< 18ms' },
      { label: 'Format', val: 'RTSP / H.265' },
    ],
  },
  {
    id: 'step-2',
    step: '02',
    title: 'Neural ANPR OCR',
    subtitle: 'License Plate Inference',
    icon: Cpu,
    accent: 'cyan',
    color: 'text-cyan-400',
    techBadge: 'YOLOv8 + OCR Tensor',
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop',
    desc: 'High-confidence deep neural network segments vehicle bounding boxes, reads Indian HSRP plates, and extracts color, make, and vehicle category.',
    spec: [
      { label: 'OCR Accuracy', val: '99.4%' },
      { label: 'Inference', val: '12ms / frame' },
      { label: 'Attributes', val: 'Type, Color, City' },
    ],
  },
  {
    id: 'step-3',
    step: '03',
    title: 'Trajectory Weaving',
    subtitle: 'Multi-Camera Spatiotemporal Stitching',
    icon: Route,
    accent: 'violet',
    color: 'text-violet-400',
    techBadge: 'Graph Spatiotemporal Engine',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=800&auto=format&fit=crop',
    desc: 'Correlates vehicle sightings across time and space into contiguous path vectors, calculating corridor transit times and average velocity curves.',
    spec: [
      { label: 'Matching Logic', val: 'Spatiotemporal Graph' },
      { label: 'Corridors', val: '6 Active Routes' },
      { label: 'Playback', val: 'Interactive 3D Spline' },
    ],
  },
  {
    id: 'step-4',
    step: '04',
    title: 'Sentinel Threat Engine',
    subtitle: 'Automated Anomaly Alerting',
    icon: Shield,
    accent: 'rose',
    color: 'text-rose-400',
    techBadge: 'Real-time Rule Evaluator',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
    desc: 'Instantly cross-references license plates against law enforcement watchlists, detects abnormal corridor deviations, and dispatches field response triage.',
    spec: [
      { label: 'Blacklist Check', val: '0ms (Indexed Hash)' },
      { label: 'Threat Triage', val: 'High / Critical' },
      { label: 'Citizen Dispatch', val: 'Auto Queue Sync' },
    ],
  },
];

export function InteractivePipelineFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const { theme } = useUIStore();
  const isLight = theme === 'light';

  // Format carousel items from steps
  const carouselItems = steps.map((s) => ({
    image: s.image,
    alt: s.title,
    step: s.step,
    title: s.title,
    subtitle: s.subtitle,
    badge: s.techBadge,
    specs: s.spec,
  }));

  const handleCarouselChange = (index: number) => {
    if (index >= 0 && index < steps.length && index !== activeStep) {
      setActiveStep(index);
    }
  };

  return (
    <div className="space-y-10">
      {/* ── 4 Steps Card Grid with Connected Animated Neon Arrows ───────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {steps.map((item, index) => {
          const isSelected = activeStep === index;
          const Icon = item.icon;

          return (
            <div key={item.id} className="relative flex flex-col">
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                onClick={() => setActiveStep(index)}
                className="h-full cursor-pointer"
              >
                <GlassCard
                  hover
                  glow={item.accent}
                  accent={isSelected ? item.accent : 'none'}
                  className={`p-6 flex flex-col justify-between h-full transition-all duration-300 ${
                    isSelected
                      ? (isLight
                          ? 'border-emerald-600 shadow-[0_0_24px_rgba(13,148,136,0.25)] bg-white/95'
                          : 'border-cyan-400 shadow-[0_0_28px_rgba(0,245,155,0.3)] bg-white/[0.08] dark:bg-slate-900/90')
                      : 'border-[var(--glass-border)] opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Top Row: Icon Capsule + Step Number */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-2.5 rounded-xl border backdrop-blur-md transition-transform duration-300 ${
                          isSelected ? 'scale-110' : ''
                        } ${
                          item.accent === 'emerald'
                            ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                            : item.accent === 'cyan'
                            ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                            : item.accent === 'violet'
                            ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <span className="text-xl font-mono tabular-nums font-bold text-[var(--text-tertiary)]">
                        {item.step}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-primary)] font-display mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] font-body leading-relaxed line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  {/* Active Indicator Bar */}
                  <div className="mt-4 pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
                      {item.techBadge}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full transition-all ${
                        isSelected
                          ? (isLight ? 'bg-emerald-600 shadow-[0_0_8px_#0d9488] scale-125' : 'bg-cyan-400 shadow-[0_0_10px_#00f0ff] scale-125 animate-pulse')
                          : 'bg-black/20 dark:bg-white/20'
                      }`}
                    />
                  </div>
                </GlassCard>
              </motion.div>

              {/* Glowing Arrow Connector between Cards */}
              {index < 3 && (
                <div className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-[var(--bg-elevated)] border border-cyan-400/50 shadow-[0_0_15px_rgba(0,245,155,0.3)] items-center justify-center text-cyan-500 dark:text-cyan-400 pointer-events-none">
                  <ArrowRight size={13} className="animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 3D Depth Carousel Stage for the Steps ──────────────────────── */}
      <div className="relative rounded-3xl border border-[var(--glass-border)] bg-[var(--bg-surface)]/60 backdrop-blur-2xl p-6 sm:p-8 overflow-hidden shadow-[var(--glass-shadow)]">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
              <Layers size={15} />
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
              3D Interactive Optical Stage
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-tertiary)]">
            <Sparkles size={12} className="text-emerald-500" />
            <span>Drag, Scroll, or Click to Navigate Depth Rails</span>
          </div>
        </div>

        <div className="h-[460px] sm:h-[500px] w-full relative">
          <DepthCarousel
            items={carouselItems}
            activeIndex={activeStep}
            onChange={handleCarouselChange}
            depth={220}
            spread={100}
            tilt={22}
            tiltDirection="right"
            perspective={1400}
            visibleCards={4}
            cardWidth={320}
            cardHeight={390}
            radius={20}
            tint={isLight ? 'rgba(241, 245, 249, 0.35)' : '#05060a'}
            autoplay
            autoplayDelay={3800}
            loop
            showControls
            showIndicators
          />
        </div>
      </div>

      {/* ── Active Step Deep-Dive Interactive Showcase Panel ───────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard padding="lg" glow={steps[activeStep].accent} accent={steps[activeStep].accent} className="p-8 border border-emerald-500/40 dark:border-cyan-500/40">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={steps[activeStep].accent} size="sm">
                    PHASE {steps[activeStep].step} SPECIFICATION
                  </Badge>
                  <span className="text-xs font-mono text-emerald-600 dark:text-cyan-400 font-semibold flex items-center gap-1">
                    <Activity size={12} className="animate-pulse" /> Active Pipeline Stage
                  </span>
                </div>
                <h4 className="text-2xl font-bold font-display text-[var(--text-primary)]">
                  {steps[activeStep].title} · <span className="text-[var(--text-secondary)] font-normal text-lg">{steps[activeStep].subtitle}</span>
                </h4>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed font-body">
                  {steps[activeStep].desc}
                </p>
              </div>

              {/* Live Specs Matrix */}
              <div className="p-4 rounded-2xl bg-white/[0.04] dark:bg-white/[0.03] border border-[var(--glass-border)] space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] font-bold">
                  Telemetry Benchmarks
                </p>
                <div className="space-y-2">
                  {steps[activeStep].spec.map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="text-[var(--text-secondary)] font-body">{s.label}</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-cyan-400">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
