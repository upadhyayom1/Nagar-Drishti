'use client';

import { useEffect, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}

export function LiquidInkAtmosphere() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = useUIStore((s) => s.theme);
  const isDark = theme !== 'light';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const ripples: Ripple[] = [];

    // Ambient floating ink clouds
    const colors = isDark
      ? [
          'rgba(0, 245, 155, ',   // Neon emerald ink
          'rgba(6, 182, 212, ',   // Cyan ink
          'rgba(99, 102, 241, ',  // Indigo velvet ink
        ]
      : [
          'rgba(13, 148, 136, ',  // Teal wash
          'rgba(14, 165, 233, ',  // Sky cyan wash
          'rgba(99, 102, 241, ',  // Soft violet wash
        ];

    const createParticle = (x?: number, y?: number, boost = false) => {
      const px = x ?? Math.random() * width;
      const py = y ?? Math.random() * height;
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      const maxLife = boost ? 160 + Math.random() * 120 : 280 + Math.random() * 200;
      const maxAlpha = isDark ? (boost ? 0.28 : 0.14) : (boost ? 0.22 : 0.12);

      particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * (boost ? 1.4 : 0.4),
        vy: (Math.random() - 0.5) * (boost ? 1.4 : 0.4),
        radius: boost ? 50 + Math.random() * 70 : 90 + Math.random() * 130,
        alpha: 0,
        maxAlpha,
        life: 0,
        maxLife,
        color: baseColor,
      });
    };

    // Initial ambient pool
    for (let i = 0; i < 18; i++) {
      createParticle();
    }

    // Add droplet ripple on mouse click or move
    const addRipple = (x: number, y: number) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      ripples.push({
        x,
        y,
        radius: 2,
        maxRadius: 180 + Math.random() * 80,
        alpha: isDark ? 0.45 : 0.35,
        color,
      });

      // Spawn 2-3 dispersed ink blooms
      for (let i = 0; i < 3; i++) {
        createParticle(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40, true);
      }
    };

    let lastMoveTime = 0;
    const handlePointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMoveTime > 85) { // Throttled to keep 60fps smooth
        lastMoveTime = now;
        addRipple(e.clientX, e.clientY);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      addRipple(e.clientX, e.clientY);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });

    // Periodic gentle droplet pulse in random spots
    const dropInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && ripples.length < 5) {
        addRipple(Math.random() * width, Math.random() * height);
      }
    }, 4500);

    // Animation Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 1.8;
        const progress = r.radius / r.maxRadius;
        const currentAlpha = r.alpha * (1 - progress);

        if (progress >= 1) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.lineWidth = 1.5 * (1 - progress * 0.7);
        ctx.strokeStyle = `${r.color}${currentAlpha})`;
        ctx.stroke();

        // Secondary subtle refractive double ring
        if (r.radius > 16) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, Math.max(1, r.radius - 12), 0, Math.PI * 2);
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = `${r.color}${currentAlpha * 0.5})`;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Draw organic dispersing ink clouds
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        // Sine wave fade in and fade out
        const progress = p.life / p.maxLife;
        if (progress < 0.25) {
          p.alpha = (progress / 0.25) * p.maxAlpha;
        } else if (progress > 0.7) {
          p.alpha = ((1 - progress) / 0.3) * p.maxAlpha;
        } else {
          p.alpha = p.maxAlpha;
        }

        if (progress >= 1) {
          particles.splice(i, 1);
          if (particles.length < 16) {
            createParticle();
          }
          continue;
        }

        ctx.save();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `${p.color}${p.alpha})`);
        grad.addColorStop(0.5, `${p.color}${p.alpha * 0.45})`);
        grad.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
      clearInterval(dropInterval);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [theme, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-75 transition-opacity duration-700"
      style={{ mixBlendMode: isDark ? 'screen' : 'multiply' }}
      aria-hidden="true"
    />
  );
}
