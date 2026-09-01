import React, { useEffect, useRef } from 'react';
import './ParticleText.css';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

const hexToRgb = (hex: string): RgbColor | null => {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
};

const mixRgb = (from: RgbColor, to: RgbColor, amount: number): RgbColor => ({
  r: Math.round(from.r + (to.r - from.r) * amount),
  g: Math.round(from.g + (to.g - from.g) * amount),
  b: Math.round(from.b + (to.b - from.b) * amount)
});

const rgbToCss = (rgb: RgbColor): string => `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
const easeOutExpo = (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const resolveFontSize = (
  value: number | string,
  container: HTMLElement,
  fontWeight: number | string,
  fontFamily: string
): number => {
  if (typeof value === 'number') return value;

  const probe = document.createElement('span');
  probe.textContent = 'M';
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  probe.style.fontSize = value;
  probe.style.fontWeight = String(fontWeight);
  probe.style.fontFamily = fontFamily;
  container.appendChild(probe);
  const size = parseFloat(window.getComputedStyle(probe).fontSize) || 96;
  probe.remove();
  return size;
};

const waitForFonts = async (font: string): Promise<void> => {
  if (!('fonts' in document)) return;

  try {
    await (document as any).fonts.load(font);
  } catch {}

  await (document as any).fonts.ready;
};

export interface ParticleTextProps {
  text?: string;
  particleSize?: number;
  density?: number;
  color?: string;
  highlightColor?: string;
  scatter?: number;
  gatherDuration?: number;
  stagger?: number;
  pointerRepel?: number;
  repelRadius?: number;
  idleDrift?: number;
  trigger?: 'view' | 'mount' | 'hover' | 'click' | 'none';
  fontSize?: number | string;
  fontWeight?: number | string;
  fontFamily?: string;
  glow?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  baseSize: number;
  color: string;
  highlightColorStr: string;
  seed: number;
  depth: number;
  delay: number;
}

interface Target {
  x: number;
  y: number;
  alpha: number;
}

const ParticleText: React.FC<ParticleTextProps> = ({
  text = "LET'S CRAFT THE FUTURE",
  particleSize = 2.4,
  density = 4,
  color = '#f8fafc',
  highlightColor = '#ffffff',
  scatter = 220,
  gatherDuration = 1600,
  stagger = 400,
  pointerRepel = 70,
  repelRadius = 140,
  idleDrift = 0.6,
  trigger = 'view',
  fontSize = 'clamp(2.4rem, 6.2vw, 5.2rem)',
  fontWeight = 800,
  fontFamily = 'inherit',
  glow = true,
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let particles: Particle[] = [];
    let animationFrame: number | null = null;
    let resizeFrame: number | null = null;
    let buildId = 0;
    let gathering = false;
    let gatherStart = 0;
    let hasGathered = false;
    let reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Pointer state
    const pointer = {
      active: false,
      x: -2000,
      y: -2000,
      prevX: -2000,
      prevY: -2000,
      vx: 0,
      vy: 0,
      pulseX: 0,
      pulseY: 0,
      pulseRadius: 0,
      pulseMaxRadius: 0
    };

    const scatterAllParticles = () => {
      if (!particles.length) return;
      const spread = reducedMotion ? 0 : scatter;
      const w = width || 800;
      const h = height || 300;

      particles.forEach(p => {
        const angle = p.seed * Math.PI * 2;
        const distance = spread * (0.6 + p.depth * 0.9);
        const randOffsetW = (p.seed - 0.5) * (w * 0.9);
        const randOffsetH = (p.depth - 0.5) * (h * 0.9);

        p.startX = p.targetX + Math.cos(angle) * distance + randOffsetW;
        p.startY = p.targetY + Math.sin(angle) * distance + randOffsetH;
        p.x = p.startX;
        p.y = p.startY;
        p.vx = 0;
        p.vy = 0;
        p.delay = reducedMotion ? 0 : p.seed * stagger;
      });
    };

    const startGather = (forceFromCurrent = false) => {
      if (!particles.length) return;
      const now = performance.now();

      if (forceFromCurrent) {
        particles.forEach(p => {
          p.startX = p.x;
          p.startY = p.y;
          p.vx = 0;
          p.vy = 0;
          p.delay = reducedMotion ? 0 : p.seed * (stagger * 0.4);
        });
      } else {
        scatterAllParticles();
      }

      gatherStart = now;
      gathering = true;
      hasGathered = true;
    };

    const drawParticle = (x: number, y: number, size: number, particleColor: string, isGlowing: boolean) => {
      ctx.fillStyle = particleColor;

      if (isGlowing && glow && !reducedMotion) {
        ctx.shadowBlur = size * 2.5;
        ctx.shadowColor = '#ffffff';
      } else {
        ctx.shadowBlur = 0;
      }

      if (size <= 2) {
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      let allCompleted = true;
      const repelRad = repelRadius;

      // Pulse wave expansion
      if (pointer.pulseRadius > 0) {
        pointer.pulseRadius += 6.5;
        if (pointer.pulseRadius > pointer.pulseMaxRadius) {
          pointer.pulseRadius = 0;
        }
      }

      const totalParticles = particles.length;
      for (let i = 0; i < totalParticles; i++) {
        const particle = particles[i];

        if (gathering) {
          // Entry gathering animation phase
          const local = (now - gatherStart - particle.delay) / Math.max(1, reducedMotion ? 1 : gatherDuration);
          const progress = clamp(local, 0, 1);
          const eased = easeOutExpo(progress);

          const curTargetX = particle.startX + (particle.targetX - particle.startX) * eased;
          const curTargetY = particle.startY + (particle.targetY - particle.startY) * eased;

          // React dynamically to pointer hover even while gathering
          let pushX = 0;
          let pushY = 0;
          let isHovered = false;
          let curSize = particle.baseSize;

          if (pointer.active && !reducedMotion && repelRad > 0) {
            const dx = (curTargetX + particle.vx) - pointer.x;
            const dy = (curTargetY + particle.vy) - pointer.y;
            const dist = Math.hypot(dx, dy);

            if (dist < repelRad && dist > 0) {
              const ratio = 1 - dist / repelRad;
              const force = Math.pow(ratio, 1.2) * (pointerRepel * 0.4);
              const angle = Math.atan2(dy, dx);
              const swirlAngle = angle + (particle.seed - 0.5) * 0.8 * ratio;
              particle.vx += Math.cos(swirlAngle) * force + pointer.vx * ratio * 0.25;
              particle.vy += Math.sin(swirlAngle) * force + pointer.vy * ratio * 0.25;
              curSize = particle.baseSize * (1 + ratio * 2.2);
              isHovered = true;
            }
          }

          particle.vx *= 0.86;
          particle.vy *= 0.86;
          particle.x = curTargetX + particle.vx;
          particle.y = curTargetY + particle.vy;

          ctx.globalAlpha = clamp(0.35 + progress * 0.65 + (isHovered ? 0.35 : 0), 0, 1);
          drawParticle(particle.x, particle.y, curSize, isHovered ? particle.highlightColorStr : particle.color, isHovered);

          if (progress < 1) allCompleted = false;
        } else if (!hasGathered && trigger === 'view') {
          // Ambient floating cloud before entering view
          const driftTime = now * 0.001;
          const px = particle.startX + Math.sin(driftTime * 0.8 + particle.seed * 10) * 12 * particle.depth;
          const py = particle.startY + Math.cos(driftTime * 0.65 + particle.depth * 10) * 12 * particle.depth;

          ctx.globalAlpha = 0.35;
          drawParticle(px, py, particle.baseSize * 0.85, particle.color, false);
        } else {
          // Fully assembled interactive state with velocity-based fluid repulsion & spring return
          let isHovered = false;
          let curSize = particle.baseSize;

          if (!reducedMotion) {
            // Direct dynamic repulsion from cursor
            if (pointer.active && repelRad > 0) {
              const dx = particle.x - pointer.x;
              const dy = particle.y - pointer.y;
              const dist = Math.hypot(dx, dy);

              if (dist < repelRad && dist > 0) {
                const ratio = 1 - dist / repelRad;
                const force = Math.pow(ratio, 1.2) * (pointerRepel * 0.55);
                const angle = Math.atan2(dy, dx);
                const swirlAngle = angle + (particle.seed - 0.5) * 0.9 * ratio;

                // Push velocity directly away from cursor + cursor velocity transfer
                particle.vx += Math.cos(swirlAngle) * force + pointer.vx * ratio * 0.35;
                particle.vy += Math.sin(swirlAngle) * force + pointer.vy * ratio * 0.35;

                curSize = particle.baseSize * (1 + ratio * 2.6);
                isHovered = true;
              }
            }

            // Radial pulse shockwave from click/enter
            if (pointer.pulseRadius > 0) {
              const pdx = particle.x - pointer.pulseX;
              const pdy = particle.y - pointer.pulseY;
              const pDist = Math.hypot(pdx, pdy);
              const ringDist = Math.abs(pDist - pointer.pulseRadius);
              const ringWidth = 55;

              if (ringDist < ringWidth && pDist > 0) {
                const ringFactor = (1 - ringDist / ringWidth) * (1 - pointer.pulseRadius / pointer.pulseMaxRadius);
                const pAngle = Math.atan2(pdy, pdx);
                particle.vx += Math.cos(pAngle) * ringFactor * 14;
                particle.vy += Math.sin(pAngle) * ringFactor * 14;
                isHovered = true;
                curSize = particle.baseSize * (1 + ringFactor * 2.2);
              }
            }

            // High-precision Hooke's spring return towards particle.targetX, particle.targetY
            const springDx = particle.targetX - particle.x;
            const springDy = particle.targetY - particle.y;
            const springK = 0.065;
            const friction = 0.84;

            particle.vx += springDx * springK;
            particle.vy += springDy * springK;
            particle.vx *= friction;
            particle.vy *= friction;

            // Ambient organic micro-drift when resting
            if (idleDrift > 0 && !pointer.active && Math.hypot(particle.vx, particle.vy) < 0.15) {
              const driftTime = now * 0.001;
              particle.vx += Math.sin(driftTime * 0.9 + particle.seed * 10) * idleDrift * 0.02 * particle.depth;
              particle.vy += Math.cos(driftTime * 0.75 + particle.depth * 10) * idleDrift * 0.02 * particle.depth;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;
          } else {
            particle.x = particle.targetX;
            particle.y = particle.targetY;
          }

          ctx.globalAlpha = isHovered ? 1.0 : 0.88;
          drawParticle(particle.x, particle.y, curSize, isHovered ? particle.highlightColorStr : particle.color, isHovered);
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (gathering && allCompleted) {
        gathering = false;
        hasGathered = true;
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const sampleText = async () => {
      const currentBuild = ++buildId;
      const rect = container.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);

      if (width <= 0 || height <= 0) return;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const computed = window.getComputedStyle(container);
      const resolvedFamily = fontFamily === 'inherit' ? computed.fontFamily || 'sans-serif' : fontFamily;
      let resolvedSize = resolveFontSize(fontSize, container, fontWeight, resolvedFamily);
      let font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;

      await waitForFonts(font);
      if (currentBuild !== buildId) return;

      const offscreen = document.createElement('canvas');
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      const content = String(text || ' ');
      const maxTextWidth = width * 0.94;
      offCtx.font = font;
      let metrics = offCtx.measureText(content);
      const measuredWidth = Math.max(1, metrics.width);
      if (measuredWidth > maxTextWidth) {
        resolvedSize = Math.max(18, resolvedSize * (maxTextWidth / measuredWidth));
        font = `${fontWeight} ${resolvedSize}px ${resolvedFamily}`;
        await waitForFonts(font);
        if (currentBuild !== buildId) return;
        offCtx.font = font;
        metrics = offCtx.measureText(content);
      }

      const left = Math.ceil(metrics.actualBoundingBoxLeft || 0);
      const right = Math.ceil(metrics.actualBoundingBoxRight || metrics.width);
      const ascent = Math.ceil(metrics.actualBoundingBoxAscent || resolvedSize * 0.78);
      const descent = Math.ceil(metrics.actualBoundingBoxDescent || resolvedSize * 0.22);
      const padding = Math.max(12, Math.ceil(resolvedSize * 0.08));
      const textWidth = Math.max(1, left + right);
      const textHeight = Math.max(1, ascent + descent);

      offscreen.width = textWidth + padding * 2;
      offscreen.height = textHeight + padding * 2;
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
      offCtx.font = font;
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'alphabetic';
      offCtx.fillStyle = '#ffffff';
      offCtx.fillText(content, padding - left, padding + ascent);

      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const targets: Target[] = [];
      const step = Math.max(2, Math.floor(density));

      for (let y = 0; y < offscreen.height; y += step) {
        for (let x = 0; x < offscreen.width; x += step) {
          const alpha = imageData.data[(y * offscreen.width + x) * 4 + 3];
          if (alpha > 40) {
            targets.push({
              x: width / 2 - offscreen.width / 2 + x,
              y: height / 2 - offscreen.height / 2 + y,
              alpha: alpha / 255
            });
          }
        }
      }

      const maxParticles = Math.max(900, Math.min(4800, Math.floor((width * height) / 95)));
      const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
      const baseRgb = hexToRgb(color) || { r: 248, g: 250, b: 252 };
      const highlightRgb = hexToRgb(highlightColor) || { r: 255, g: 255, b: 255 };
      const selected = targets.filter((_, index) => index % stride === 0);

      particles = selected.map((target, index) => {
        const seed = ((index * 9301 + 49297) % 233280) / 233280;
        const depth = 0.45 + (((index * 233 + 97) % 1000) / 1000) * 0.9;
        const blend = clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1);
        const particleColor = rgbToCss(mixRgb(baseRgb, { r: 200, g: 215, b: 230 }, blend * 0.5));
        const angle = seed * Math.PI * 2;
        const distance = (reducedMotion ? 0 : scatter) * (0.6 + depth * 0.9);
        const startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * (width * 0.9);
        const startY = target.y + Math.sin(angle) * distance + (depth - 0.5) * (height * 0.9);

        return {
          x: reducedMotion ? target.x : startX,
          y: reducedMotion ? target.y : startY,
          vx: 0,
          vy: 0,
          startX,
          startY,
          targetX: target.x,
          targetY: target.y,
          baseSize: Math.max(0.8, particleSize * (0.75 + target.alpha * 0.4)),
          color: particleColor,
          highlightColorStr: '#ffffff',
          seed,
          depth,
          delay: seed * stagger
        };
      });

      if (reducedMotion) {
        particles.forEach(p => {
          p.x = p.targetX;
          p.y = p.targetY;
        });
        gathering = false;
        hasGathered = true;
      } else if (trigger === 'mount') {
        startGather(false);
      } else if (trigger === 'view') {
        // Check if currently visible in viewport
        const currentRect = container.getBoundingClientRect();
        const inView = currentRect.top < window.innerHeight * 0.95 && currentRect.bottom > 0;
        if (inView) {
          startGather(false);
        } else {
          scatterAllParticles();
          hasGathered = false;
        }
      }

      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const queueSample = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(sampleText);
    };

    // Robust pointer tracking
    const updatePointerPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const currentX = clientX - rect.left;
      const currentY = clientY - rect.top;

      if (pointer.prevX !== -2000) {
        pointer.vx = currentX - pointer.prevX;
        pointer.vy = currentY - pointer.prevY;
      } else {
        pointer.vx = 0;
        pointer.vy = 0;
      }

      pointer.prevX = currentX;
      pointer.prevY = currentY;
      pointer.x = currentX;
      pointer.y = currentY;
      pointer.active = true;

      // If text hasn't gathered yet, hover immediately kicks off gathering
      if (!hasGathered && particles.length > 0 && !gathering) {
        startGather(true);
      }
    };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
    };

    const handlePointerEnter = (e: PointerEvent | MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
      pointer.pulseX = pointer.x;
      pointer.pulseY = pointer.y;
      pointer.pulseRadius = 15;
      pointer.pulseMaxRadius = Math.max(repelRadius * 1.8, 200);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -2000;
      pointer.y = -2000;
      pointer.prevX = -2000;
      pointer.prevY = -2000;
      pointer.vx = 0;
      pointer.vy = 0;
    };

    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      updatePointerPos(e.clientX, e.clientY);
      pointer.pulseX = pointer.x;
      pointer.pulseY = pointer.y;
      pointer.pulseRadius = 20;
      pointer.pulseMaxRadius = Math.max(repelRadius * 2.5, 260);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointerPos(touch.clientX, touch.clientY);
        pointer.pulseX = pointer.x;
        pointer.pulseY = pointer.y;
        pointer.pulseRadius = 20;
        pointer.pulseMaxRadius = Math.max(repelRadius * 2.5, 260);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        updatePointerPos(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      handlePointerLeave();
    };

    // Dual-trigger viewport detection (IntersectionObserver + Scroll check fallback)
    const checkViewportVisibility = () => {
      if (trigger !== 'view' || reducedMotion) return;
      const rect = container.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.88 && rect.bottom > window.innerHeight * 0.1;

      if (inView) {
        if (!hasGathered && particles.length > 0 && !gathering) {
          startGather(false);
        }
      } else if (rect.bottom < -100 || rect.top > window.innerHeight + 200) {
        if (hasGathered) {
          hasGathered = false;
          gathering = false;
          scatterAllParticles();
        }
      }
    };

    let intersectionObserver: IntersectionObserver | null = null;
    if (trigger === 'view' && typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (!hasGathered && particles.length > 0 && !gathering) {
                startGather(false);
              }
            } else {
              const rect = entry.boundingClientRect;
              if (rect.top > window.innerHeight || rect.bottom < 0) {
                hasGathered = false;
                gathering = false;
                if (particles.length > 0) {
                  scatterAllParticles();
                }
              }
            }
          });
        },
        {
          rootMargin: '0px 0px -5% 0px',
          threshold: 0.1
        }
      );
      intersectionObserver.observe(container);
    }

    const onGlobalPointerMove = (e: MouseEvent | PointerEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const pad = 60;
      if (
        e.clientX >= rect.left - pad &&
        e.clientX <= rect.right + pad &&
        e.clientY >= rect.top - pad &&
        e.clientY <= rect.bottom + pad
      ) {
        updatePointerPos(e.clientX, e.clientY);
      } else if (pointer.active) {
        handlePointerLeave();
      }
    };

    window.addEventListener('scroll', checkViewportVisibility, { passive: true });
    window.addEventListener('pointermove', onGlobalPointerMove, { passive: true });

    // Attach interaction listeners to window, container and canvas
    canvas.addEventListener('pointerenter', handlePointerEnter as any);
    canvas.addEventListener('pointermove', handlePointerMove as any);
    canvas.addEventListener('pointerdown', handlePointerDown as any);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove as any, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd as any);

    container.addEventListener('pointerenter', handlePointerEnter as any);
    container.addEventListener('pointermove', handlePointerMove as any);
    container.addEventListener('pointerdown', handlePointerDown as any);
    container.addEventListener('pointerleave', handlePointerLeave);

    const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const handleReduceMotionChange = (e: MediaQueryListEvent) => {
      reducedMotion = e.matches;
      sampleText();
    };
    reduceMotionQuery?.addEventListener('change', handleReduceMotionChange);

    const resizeObserver = new ResizeObserver(queueSample);
    resizeObserver.observe(container);
    sampleText();

    return () => {
      buildId += 1;
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener('scroll', checkViewportVisibility);
      window.removeEventListener('pointermove', onGlobalPointerMove);
      reduceMotionQuery?.removeEventListener('change', handleReduceMotionChange);

      canvas.removeEventListener('pointerenter', handlePointerEnter as any);
      canvas.removeEventListener('pointermove', handlePointerMove as any);
      canvas.removeEventListener('pointerdown', handlePointerDown as any);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('touchstart', handleTouchStart as any);
      canvas.removeEventListener('touchmove', handleTouchMove as any);
      canvas.removeEventListener('touchend', handleTouchEnd as any);

      container.removeEventListener('pointerenter', handlePointerEnter as any);
      container.removeEventListener('pointermove', handlePointerMove as any);
      container.removeEventListener('pointerdown', handlePointerDown as any);
      container.removeEventListener('pointerleave', handlePointerLeave);

      if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    };
  }, [
    text,
    particleSize,
    density,
    color,
    highlightColor,
    scatter,
    gatherDuration,
    stagger,
    pointerRepel,
    repelRadius,
    idleDrift,
    trigger,
    fontSize,
    fontWeight,
    fontFamily,
    glow
  ]);

  return (
    <div
      ref={containerRef}
      className={`particle-text interactive-hover ${className}`}
      style={style}
      aria-label={text}
    >
      <canvas ref={canvasRef} className="particle-text__canvas" aria-hidden="true" />
      <span className="particle-text__sr">{text}</span>
    </div>
  );
};

export default ParticleText;
