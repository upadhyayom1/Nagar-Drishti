import { cn } from '@/lib/utils';

type PulseDotVariant = 'emerald' | 'cyan' | 'rose' | 'amber' | 'violet' | 'default';

interface PulseDotProps {
  variant?: PulseDotVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantConfig: Record<PulseDotVariant, { dot: string; ring: string }> = {
  emerald: {
    dot:  'bg-emerald-400',
    ring: 'bg-emerald-400/30',
  },
  cyan: {
    dot:  'bg-cyan-400',
    ring: 'bg-cyan-400/30',
  },
  rose: {
    dot:  'bg-rose-400',
    ring: 'bg-rose-400/30',
  },
  amber: {
    dot:  'bg-amber-400',
    ring: 'bg-amber-400/30',
  },
  violet: {
    dot:  'bg-violet-400',
    ring: 'bg-violet-400/30',
  },
  default: {
    dot:  'bg-slate-400',
    ring: 'bg-slate-400/30',
  },
};

const sizeConfig = {
  sm: { outer: 'w-2 h-2', ring: 'w-3.5 h-3.5', inner: 'w-1.5 h-1.5' },
  md: { outer: 'w-2.5 h-2.5', ring: 'w-4.5 h-4.5', inner: 'w-2 h-2' },
  lg: { outer: 'w-3 h-3', ring: 'w-5 h-5', inner: 'w-2.5 h-2.5' },
};

export function PulseDot({ variant = 'emerald', size = 'sm', className }: PulseDotProps) {
  const colors = variantConfig[variant];
  const sizes = sizeConfig[size];

  return (
    <span className={cn('relative inline-flex items-center justify-center shrink-0', sizes.outer, className)}>
      {/* Animated expanding ring */}
      <span
        className={cn(
          'absolute rounded-full animate-ping opacity-60',
          colors.ring,
          sizes.ring,
        )}
        style={{ animationDuration: '2s' }}
      />
      {/* Static core dot */}
      <span
        className={cn(
          'relative rounded-full shrink-0',
          colors.dot,
          sizes.inner,
        )}
      />
    </span>
  );
}
