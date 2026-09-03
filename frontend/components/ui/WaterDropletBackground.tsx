'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';

interface Droplet {
  x: number;
  y: number;
  r: number;
  maxR: number;
  opacity: number;
  speed: number;
  color: string;
  ringCount: number;
}

interface AmbientDrop {
  x: number;
  y: number;
  size: number;
  vy: number;
  vx: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

export function WaterDropletBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const ripples: Droplet[] = [];

    const ambientDrops: AmbientDrop[] = Array.from({ length: 42 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1.8 + Math.random() * 3.8,
      vy: 0.25 + Math.random() * 0.55,
      vx: (Math.random() - 0.5) * 0.12,
      opacity: 0.35 + Math.random() * 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.015 + Math.random() * 0.03,
    }));

    const createRipple = (x: number, y: number, manual = false) => {
      const hue = Math.random() > 0.45 ? '0, 245, 155' : '6, 182, 212';
      ripples.push({
        x,
        y,
        r: manual ? 8 : 4,
        maxR: manual ? 90 + Math.random() * 65 : 60 + Math.random() * 80,
        opacity: manual ? 0.9 : 0.55 + Math.random() * 0.35,
        speed: manual ? 1.5 + Math.random() * 0.8 : 0.9 + Math.random() * 0.8,
        color: hue,
        ringCount: 2 + Math.floor(Math.random() * 2),
      });
    };

    let lastDropTime = 0;
    const dropInterval = 1200;

    const handlePointerDown = (e: MouseEvent) => {
      createRipple(e.clientX, e.clientY, true);
    };

    window.addEventListener('pointerdown', handlePointerDown);

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Spontaneous natural water droplet impact
      if (time - lastDropTime > dropInterval + Math.random() * 1100) {
        lastDropTime = time;
        const rx = 0.05 * width + Math.random() * 0.9 * width;
        const ry = 0.05 * height + Math.random() * 0.9 * height;
        createRipple(rx, ry, false);
      }

      // 1. Ambient Dew Droplets
      for (let i = 0; i < ambientDrops.length; i++) {
        const d = ambientDrops[i];
        d.y += d.vy;
        d.wobble += d.wobbleSpeed;
        d.x += Math.sin(d.wobble) * 0.25 + d.vx;

        if (d.y > height + 20) {
          d.y = -10;
          d.x = Math.random() * width;
        }

        const dropGrad = ctx.createRadialGradient(
          d.x - d.size * 0.3,
          d.y - d.size * 0.3,
          d.size * 0.1,
          d.x,
          d.y,
          d.size * 1.5
        );

        if (isDark) {
          dropGrad.addColorStop(0, `rgba(255, 255, 255, ${d.opacity * 0.95})`);
          dropGrad.addColorStop(0.35, `rgba(0, 245, 155, ${d.opacity * 0.6})`);
          dropGrad.addColorStop(0.85, `rgba(6, 182, 212, ${d.opacity * 0.25})`);
          dropGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          dropGrad.addColorStop(0, `rgba(255, 255, 255, ${d.opacity})`);
          dropGrad.addColorStop(0.4, `rgba(13, 148, 136, ${d.opacity * 0.5})`);
          dropGrad.addColorStop(0.9, `rgba(6, 182, 212, ${d.opacity * 0.2})`);
          dropGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = dropGrad;
        ctx.fill();

        // Droplet specular glint
        ctx.beginPath();
        ctx.arc(d.x - d.size * 0.3, d.y - d.size * 0.3, d.size * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
      }

      // 2. Concentric Fluid Water Ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += r.speed;
        const progress = r.r / r.maxR;
        const currentOpacity = r.opacity * (1 - progress);

        if (progress >= 1 || currentOpacity <= 0.01) {
          ripples.splice(i, 1);
          continue;
        }

        for (let ring = 0; ring < r.ringCount; ring++) {
          const ringR = Math.max(1, r.r - ring * 18);
          const ringAlpha = currentOpacity * Math.pow(0.72, ring);

          if (ringAlpha <= 0.01) continue;

          ctx.beginPath();
          ctx.arc(r.x, r.y, ringR, 0, Math.PI * 2);
          ctx.lineWidth = Math.max(0.9, 2.4 * (1 - progress));
          ctx.strokeStyle = isDark
            ? `rgba(${r.color}, ${ringAlpha})`
            : `rgba(13, 148, 136, ${ringAlpha * 0.85})`;
          ctx.stroke();

          if (ring === 0) {
            const haloGrad = ctx.createRadialGradient(r.x, r.y, ringR * 0.82, r.x, r.y, ringR * 1.18);
            haloGrad.addColorStop(0, 'rgba(0,0,0,0)');
            haloGrad.addColorStop(0.5, isDark ? `rgba(${r.color}, ${ringAlpha * 0.25})` : `rgba(13, 148, 136, ${ringAlpha * 0.15})`);
            haloGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.beginPath();
            ctx.arc(r.x, r.y, ringR * 1.18, 0, Math.PI * 2);
            ctx.fillStyle = haloGrad;
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[1] w-full h-full"
    />
  );
}
