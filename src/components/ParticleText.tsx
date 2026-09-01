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
  vx: number;
  vy: number;
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
  particleSize = 2,
  density = 4,
  color = '#ffffff',
  highlightColor = '#8b5cf6',
  scatter = 180,
  gatherDuration = 1600,
  stagger = 420,
  pointerRepel = 40,
  repelRadius = 120,
  idleDrift = 0.7,
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
    let reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const pointer = {
      active: false,
      x: 0,
      y: 0,
      smoothX: 0,
      smoothY: 0
    };

    let lastScatterTime = 0;
    const triggerScatterBurst = (originX?: number, originY?: number, intensity = 8.5) => {
      if (reducedMotion || !particles.length) return;
      const now = performance.now();
      if (now - lastScatterTime < 300) return;
      lastScatterTime = now;

      const cx = typeof originX === 'number' ? originX : width / 2;
      const cy = typeof originY === 'number' ? originY : height / 2;

      // If still in gather phase, immediately switch to free physics
      gathering = false;
      hasGathered = true;

      particles.forEach(p => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        const dist = Math.hypot(dx, dy) || 1;

        // Radial outward blast angle with chaotic cosmic swirl
        const angle = Math.atan2(dy, dx) + (p.seed - 0.5) * 1.4;
        const speed = intensity * (0.65 + p.depth * 0.85) * Math.max(0.4, 1 - Math.min(dist / Math.max(width, height), 0.75));

        p.vx += Math.cos(angle) * speed + (p.seed - 0.5) * 7;
        p.vy += Math.sin(angle) * speed + (p.depth - 0.5) * 7;
      });
    };

    const startGather = (fromScatter = true) => {
      if (!particles.length) return;

      const now = performance.now();
      const spread = reducedMotion ? 0 : scatter;

      particles.forEach(particle => {
        if (fromScatter) {
          const angle = particle.seed * Math.PI * 2;
          const distance = spread * (0.5 + particle.depth * 0.9);
          particle.x = particle.targetX + Math.cos(angle) * distance + (particle.depth - 0.5) * spread * 0.8;
          particle.y = particle.targetY + Math.sin(angle) * distance + (particle.seed - 0.5) * spread * 0.8;
        }

        particle.startX = particle.x;
        particle.startY = particle.y;
        particle.vx = 0;
        particle.vy = 0;
        particle.delay = reducedMotion ? 0 : particle.seed * stagger;
      });

      gatherStart = now;
      gathering = true;
      hasGathered = true;
    };

    const drawParticle = (particle: Particle, currentSize: number) => {
      ctx.fillStyle = particle.color;

      if (currentSize <= 2.1) {
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

      pointer.smoothX += (pointer.x - pointer.smoothX) * 0.2;
      pointer.smoothY += (pointer.y - pointer.smoothY) * 0.2;

      let complete = true;

      particles.forEach(particle => {
        let progress = 1;
        let particleCurrentSize = particle.size;

        if (gathering) {
          const local = (now - gatherStart - particle.delay) / Math.max(1, reducedMotion ? 1 : gatherDuration);
          progress = clamp(local, 0, 1);
          const eased = easeOutCubic(progress);
          const baseX = particle.startX + (particle.targetX - particle.startX) * eased;
          const baseY = particle.startY + (particle.targetY - particle.startY) * eased;
          
          particle.x = baseX + particle.vx;
          particle.y = baseY + particle.vy;
          particle.vx *= 0.9;
          particle.vy *= 0.9;

          if (progress < 1) complete = false;
        } else if (!hasGathered && trigger === 'view') {
          // Floating scattered initial position before entering viewport
          const driftTime = now * 0.001;
          particle.x = particle.startX + Math.sin(driftTime * 0.8 + particle.seed * 10) * 12 * particle.depth;
          particle.y = particle.startY + Math.cos(driftTime * 0.65 + particle.depth * 10) * 12 * particle.depth;
          progress = 0.45;
        } else {
          // Assembled text state with smooth spring-physics return for scatter bursts
          if (!reducedMotion) {
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;

            // Spring force + velocity damping for smooth settling within ~1.2 - 1.5s
            const springK = 0.045;
            const damping = 0.87;

            particle.vx += dx * springK;
            particle.vy += dy * springK;
            particle.vx *= damping;
            particle.vy *= damping;

            if (idleDrift > 0 && Math.hypot(particle.vx, particle.vy) < 0.15) {
              const driftTime = now * 0.001;
              particle.vx += Math.sin(driftTime * 0.9 + particle.seed * 10) * idleDrift * 0.04 * particle.depth;
              particle.vy += Math.cos(driftTime * 0.75 + particle.depth * 10) * idleDrift * 0.04 * particle.depth;
            }

            particle.x += particle.vx;
            particle.y += particle.vy;
          } else {
            particle.x = particle.targetX;
            particle.y = particle.targetY;
          }
        }

        // Pointer repel & magnification when near cursor
        if (pointer.active && !reducedMotion && repelRadius > 0) {
          const dx = particle.x - pointer.smoothX;
          const dy = particle.y - pointer.smoothY;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < repelRadius) {
            const mag = Math.pow(1 - distance / repelRadius, 2);
            particleCurrentSize = particle.size * (1 + mag * 1.6);

            if (pointerRepel > 0) {
              const force = mag * pointerRepel * 0.1;
              particle.vx += (dx / distance) * force;
              particle.vy += (dy / distance) * force;
            }
          }
        }

        ctx.globalAlpha = clamp(0.35 + progress * 0.65, 0, 1);
        drawParticle(particle, particleCurrentSize);
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (gathering && complete) {
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
      const maxTextWidth = width * 0.92;
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
        const distance = (reducedMotion ? 0 : scatter) * (0.6 + depth * 0.9);
        const startX = target.x + Math.cos(angle) * distance + (seed - 0.5) * scatter * 0.8;
        const startY = target.y + Math.sin(angle) * distance + (depth - 0.5) * scatter * 0.8;

        return {
          x: reducedMotion ? target.x : startX,
          y: reducedMotion ? target.y : startY,
          vx: 0,
          vy: 0,
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

      pointer.x = width / 2;
      pointer.y = height / 2;
      pointer.smoothX = pointer.x;
      pointer.smoothY = pointer.y;

      if (reducedMotion) {
        particles.forEach(particle => {
          particle.x = particle.targetX;
          particle.y = particle.targetY;
          particle.startX = particle.targetX;
          particle.startY = particle.targetY;
          particle.vx = 0;
          particle.vy = 0;
          particle.delay = 0;
        });
        gathering = false;
        hasGathered = true;
      } else if (trigger === 'mount') {
        startGather(false);
      }

      ensureRenderLoop();
    };

    const queueSample = () => {
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(sampleText);
    };

    const handlePointerMove = (event: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
    };

    const handlePointerEnter = (event: PointerEvent | MouseEvent) => {
      handlePointerMove(event);
      // On desktop hover or entry: trigger scatter burst that smoothly rejoins
      triggerScatterBurst(pointer.x, pointer.y, 7.5);
    };

    const handlePointerDown = (event: PointerEvent | MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      pointer.x = clickX;
      pointer.y = clickY;
      pointer.active = true;
      // On mobile tap or desktop click: trigger energetic scatter burst that smoothly rejoins
      triggerScatterBurst(clickX, clickY, 10.0);
    };

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      triggerScatterBurst(clickX, clickY, 10.0);
    };

    // IntersectionObserver to trigger gathering on scroll into viewport
    let intersectionObserver: IntersectionObserver | null = null;
    if (trigger === 'view' && typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (!hasGathered) {
                startGather(false);
              }
            } else {
              // When completely out of view, reset state so re-entry starts scattered and gathers
              hasGathered = false;
            }
          });
        },
        { threshold: 0.12 }
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
    canvas.addEventListener('click', handleClick);

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
      canvas.removeEventListener('click', handleClick);

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
