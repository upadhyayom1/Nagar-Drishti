'use client';

import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  height?: number | string;
  rows?: number;
  className?: string;
  variant?: 'chart' | 'list' | 'tile' | 'stat';
}

function SkeletonRow({ width = '100%', height = 12 }: { width?: string; height?: number }) {
  return (
    <div
      className="rounded-lg bg-[var(--bg-elevated-2)] relative overflow-hidden"
      style={{ width, height }}
    >
      <div className="absolute inset-0 skeleton-shimmer" />
    </div>
  );
}

export function SkeletonCard({ height, rows = 3, className, variant = 'chart' }: SkeletonCardProps) {
  if (variant === 'chart') {
    return (
      <div
        className={cn('w-full flex flex-col gap-3 p-1', className)}
        style={height ? { height } : undefined}
      >
        {/* Chart bars skeleton */}
        <div className="flex items-end gap-2 flex-1 pt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-md bg-[var(--bg-elevated-2)] relative overflow-hidden"
              style={{ height: `${30 + (i % 3) * 20 + (i % 5) * 10}%` }}
            >
              <div className="absolute inset-0 skeleton-shimmer" style={{ animationDelay: `${i * 80}ms` }} />
            </div>
          ))}
        </div>
        {/* X-axis skeleton */}
        <div className="flex gap-2 mt-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonRow key={i} width="100%" height={8} />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[var(--bg-elevated-2)] relative overflow-hidden shrink-0">
              <div className="absolute inset-0 skeleton-shimmer" style={{ animationDelay: `${i * 60}ms` }} />
            </div>
            <div className="flex-1 space-y-1.5">
              <SkeletonRow width={`${70 + (i % 3) * 10}%`} height={10} />
              <SkeletonRow width="40%" height={8} />
            </div>
            <div className="w-16 h-5 rounded-full bg-[var(--bg-elevated-2)] relative overflow-hidden">
              <div className="absolute inset-0 skeleton-shimmer" style={{ animationDelay: `${i * 60 + 30}ms` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'tile') {
    return (
      <div className={cn('glass-panel p-4 space-y-3', className)}>
        <div className="aspect-video w-full rounded-xl bg-[var(--bg-elevated-2)] relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <SkeletonRow width="70%" height={12} />
        <SkeletonRow width="50%" height={10} />
      </div>
    );
  }

  // stat variant
  return (
    <div className={cn('glass-panel p-5 space-y-3', className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <SkeletonRow width="60%" height={10} />
          <SkeletonRow width="40%" height={28} />
        </div>
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated-2)] relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
      </div>
      <SkeletonRow width="100%" height={6} />
    </div>
  );
}
