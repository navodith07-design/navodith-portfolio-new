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
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  color: string;
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
  text = 'React Bits',
  particleSize = 2.2,
  density = 4,
  color = '#f8fafc',
  highlightColor = '#646365',
  scatter = 190,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 42,
  repelRadius = 120,
  idleDrift = 0.8,
  trigger = 'view',
  fontSize = 'clamp(3rem, 12vw, 8rem)',
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
    let isIntersectingViewport = false;
    let reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const pointer = {
      active: false,
      x: -1000,
      y: -1000,
      smoothX: -1000,
      smoothY: -1000,
      pulseRadius: 0,
      pulseMaxRadius: 0
    };

    const scatterAllParticles = () => {
      if (!particles.length) return;
      const spread = reducedMotion ? 0 : scatter;
      particles.forEach(p => {
        const angle = p.seed * Math.PI * 2;
        const distance = spread * (0.65 + p.depth * 0.85);
        const randOffsetW = (p.seed - 0.5) * (width * 0.75);
        const randOffsetH = (p.depth - 0.5) * (height * 0.8);

        p.startX = p.targetX + Math.cos(angle) * distance + randOffsetW;
        p.startY = p.targetY + Math.sin(angle) * distance + randOffsetH;
        p.x = p.startX;
        p.y = p.startY;
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
          p.delay = reducedMotion ? 0 : p.seed * (stagger * 0.6);
        });
      } else {
        scatterAllParticles();
      }

      gatherStart = now;
      gathering = true;
      hasGathered = true;
    };

    const drawParticle = (particle: Particle, currentSize: number) => {
      ctx.fillStyle = particle.color;

      if (currentSize <= 2.2) {
        ctx.fillRect(particle.x - currentSize / 2, particle.y - currentSize / 2, currentSize, currentSize);
        return;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, currentSize / 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const render = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      if (glow && !reducedMotion) {
        ctx.shadowBlur = particleSize * 3;
        ctx.shadowColor = highlightColor;
      } else {
        ctx.shadowBlur = 0;
      }

      if (pointer.active) {
        pointer.smoothX += (pointer.x - pointer.smoothX) * 0.28;
        pointer.smoothY += (pointer.y - pointer.smoothY) * 0.28;
      }

      let allCompleted = true;
      const currentRepelRadius = pointer.pulseRadius > 0 ? Math.max(repelRadius, pointer.pulseRadius) : repelRadius;

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        let progress = 1;
        let particleCurrentSize = particle.size;

        if (gathering) {
          const local = (now - gatherStart - particle.delay) / Math.max(1, reducedMotion ? 1 : gatherDuration);
          progress = clamp(local, 0, 1);
          const eased = easeOutCubic(progress);
          particle.x = particle.startX + (particle.targetX - particle.startX) * eased;
          particle.y = particle.startY + (particle.targetY - particle.startY) * eased;

          if (progress < 1) allCompleted = false;
        } else if (!hasGathered && trigger === 'view') {
          // Floating scattered state before entering viewport
          const driftTime = now * 0.001;
          particle.x = particle.startX + Math.sin(driftTime * 0.8 + particle.seed * 10) * 14 * particle.depth;
          particle.y = particle.startY + Math.cos(driftTime * 0.65 + particle.depth * 10) * 14 * particle.depth;
          progress = 0.4;
        } else {
          // Formed text with hover repel and smooth attraction back
          let destX = particle.targetX;
          let destY = particle.targetY;

          // Repel from mouse / touch pointer
          if (pointer.active && !reducedMotion && currentRepelRadius > 0) {
            const dx = destX - pointer.smoothX;
            const dy = destY - pointer.smoothY;
            const distance = Math.hypot(dx, dy);

            if (distance < currentRepelRadius && distance > 0) {
              const ratio = 1 - distance / currentRepelRadius;
              const force = Math.pow(ratio, 1.4) * pointerRepel * 2.5;
              const angle = Math.atan2(dy, dx);

              destX += Math.cos(angle) * force;
              destY += Math.sin(angle) * force;

              particleCurrentSize = particle.size * (1 + ratio * 1.6);
            }
          }

          // Smooth attraction toward destX, destY
          const easeSpeed = reducedMotion ? 1 : 0.14;
          particle.x += (destX - particle.x) * easeSpeed;
          particle.y += (destY - particle.y) * easeSpeed;

          // Subtle idle drift when not interacting
          if (idleDrift > 0 && !pointer.active && !reducedMotion) {
            const driftTime = now * 0.001;
            particle.x += Math.sin(driftTime * 0.8 + particle.seed * 10) * idleDrift * 0.25 * particle.depth;
            particle.y += Math.cos(driftTime * 0.65 + particle.depth * 10) * idleDrift * 0.25 * particle.depth;
          }
        }

        ctx.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
        drawParticle(particle, particleCurrentSize);
      }

      // Decay tap pulse
      if (pointer.pulseRadius > 0) {
        pointer.pulseRadius += 6;
        if (pointer.pulseRadius > pointer.pulseMaxRadius) {
          pointer.pulseRadius = 0;
        }
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (gathering && allCompleted) {
        gathering = false;
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const ensureRenderLoop = () => {
      if (animationFrame === null) {
        animationFrame = window.requestAnimationFrame(render);
      }
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

      const maxParticles = Math.max(900, Math.min(5200, Math.floor((width * height) / 90)));
      const stride = Math.max(1, Math.ceil(targets.length / maxParticles));
      const baseRgb = hexToRgb(color);
      const highlightRgb = hexToRgb(highlightColor);
      const selected = targets.filter((_, index) => index % stride === 0);

      particles = selected.map((target, index) => {
        const seed = ((index * 9301 + 49297) % 233280) / 233280;
        const depth = 0.45 + (((index * 233 + 97) % 1000) / 1000) * 0.9;
        const blend = baseRgb && highlightRgb ? clamp(target.x / Math.max(1, width) + (seed - 0.5) * 0.35, 0, 1) : 0;
        const particleColor = baseRgb && highlightRgb ? rgbToCss(mixRgb(baseRgb, highlightRgb, blend)) : color;
        const angle = seed * Math.PI * 2;
        const distance = (reducedMotion ? 0 : scatter) * (0.65 + depth * 0.85);
        const startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * (width * 0.75);
        const startY = target.y + Math.sin(angle) * distance + (depth - 0.5) * (height * 0.8);

        return {
          x: reducedMotion ? target.x : startX,
          y: reducedMotion ? target.y : startY,
          startX,
          startY,
          targetX: target.x,
          targetY: target.y,
          size: Math.max(0.6, particleSize * (0.75 + target.alpha * 0.45)),
          color: particleColor,
          seed,
          depth,
          delay: seed * stagger
        };
      });

      if (reducedMotion) {
        particles.forEach(particle => {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.startX = particle.targetX;
          particle.startY = particle.targetY;
          particle.delay = 0;
        });
        gathering = false;
        hasGathered = true;
      } else if (trigger === 'mount') {
        startGather(false);
      } else if (trigger === 'view') {
        if (isIntersectingViewport) {
          startGather(false);
        } else {
          scatterAllParticles();
          hasGathered = false;
        }
      }

      ensureRenderLoop();
    };

    const queueSample = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(sampleText);
    };

    const updatePointerPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      pointer.x = x;
      pointer.y = y;
      if (!pointer.active || pointer.smoothX === -1000) {
        pointer.smoothX = x;
        pointer.smoothY = y;
      }
      pointer.active = true;
    };

    const handlePointerMove = (event: PointerEvent | MouseEvent) => {
      updatePointerPos(event.clientX, event.clientY);
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };

    const handlePointerEnter = (event: PointerEvent | MouseEvent) => {
      updatePointerPos(event.clientX, event.clientY);
    };

    const triggerTapPulse = (clientX: number, clientY: number) => {
      updatePointerPos(clientX, clientY);
      pointer.pulseRadius = 20;
      pointer.pulseMaxRadius = repelRadius * 1.8;
    };

    const handlePointerDown = (event: PointerEvent | MouseEvent) => {
      triggerTapPulse(event.clientX, event.clientY);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        triggerTapPulse(touch.clientX, touch.clientY);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        updatePointerPos(touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => {
      pointer.active = false;
    };

    // IntersectionObserver to trigger gathering on scroll into viewport
    let intersectionObserver: IntersectionObserver | null = null;
    if (trigger === 'view' && typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            isIntersectingViewport = entry.isIntersecting;
            if (entry.isIntersecting) {
              if (!hasGathered && particles.length > 0) {
                startGather(false);
              }
            } else {
              // When completely out of view, reset state so re-entry starts scattered and gathers again
              hasGathered = false;
              gathering = false;
              if (particles.length > 0) {
                scatterAllParticles();
              }
            }
          });
        },
        { threshold: 0.08 }
      );
      intersectionObserver.observe(container);
    }

    const reduceMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const handleReduceMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      sampleText();
    };

    reduceMotionQuery?.addEventListener('change', handleReduceMotionChange);
    canvas.addEventListener('pointerenter', handlePointerEnter as any);
    canvas.addEventListener('pointermove', handlePointerMove as any);
    canvas.addEventListener('pointerdown', handlePointerDown as any);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('touchstart', handleTouchStart as any, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove as any, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd as any);
    canvas.addEventListener('touchcancel', handleTouchEnd as any);

    const resizeObserver = new ResizeObserver(queueSample);
    resizeObserver.observe(container);
    sampleText();

    return () => {
      buildId += 1;
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      reduceMotionQuery?.removeEventListener('change', handleReduceMotionChange);
      canvas.removeEventListener('pointerenter', handlePointerEnter as any);
      canvas.removeEventListener('pointermove', handlePointerMove as any);
      canvas.removeEventListener('pointerdown', handlePointerDown as any);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('touchstart', handleTouchStart as any);
      canvas.removeEventListener('touchmove', handleTouchMove as any);
      canvas.removeEventListener('touchend', handleTouchEnd as any);
      canvas.removeEventListener('touchcancel', handleTouchEnd as any);

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
    <div ref={containerRef} className={`particle-text ${className}`} style={style} aria-label={text}>
      <canvas ref={canvasRef} className="particle-text__canvas" aria-hidden="true" />
      <span className="particle-text__sr">{text}</span>
    </div>
  );
};

export default ParticleText;
