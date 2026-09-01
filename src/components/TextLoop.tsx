import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

import './TextLoop.css';

const VIEW_W = 1920;
const VIEW_H = 420;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;
const EDGE_PAD = 6;

export type TextLoopShape = 'wave' | 'circle' | 'infinity' | 'arch' | 'line';

const buildPath = (shape: TextLoopShape | string, curviness: number, ribbonWidth: number): string => {
  const c = Math.max(0, curviness);
  const room = Math.max(20, CY - Math.max(0, ribbonWidth) / 2 - EDGE_PAD);

  switch (shape) {
    case 'circle': {
      const r = Math.min(120 + c * 0.95, room);
      return `M ${CX - r} ${CY} A ${r} ${r} 0 1 1 ${CX + r} ${CY} A ${r} ${r} 0 1 1 ${CX - r} ${CY} Z`;
    }
    case 'infinity': {
      const r = 220 + c * 1.4;
      const h = Math.min(80 + c * 0.95, room);
      return [
        `M ${CX} ${CY}`,
        `C ${CX + r * 0.55} ${CY - h} ${CX + r} ${CY - h} ${CX + r} ${CY}`,
        `C ${CX + r} ${CY + h} ${CX + r * 0.55} ${CY + h} ${CX} ${CY}`,
        `C ${CX - r * 0.55} ${CY - h} ${CX - r} ${CY - h} ${CX - r} ${CY}`,
        `C ${CX - r} ${CY + h} ${CX - r * 0.55} ${CY + h} ${CX} ${CY}`,
        'Z'
      ].join(' ');
    }
    case 'arch': {
      const rise = Math.min(120 + c * 1.1, room * 2);
      return `M -100 ${CY + rise / 2} Q ${CX} ${CY - rise * 1.5} ${VIEW_W + 100} ${CY + rise / 2}`;
    }
    case 'line':
      return `M -400 ${CY} L ${VIEW_W + 400} ${CY}`;
    case 'wave':
    default: {
      const a = Math.min(c * 1.8, room * 1.6);
      return `M -400 ${CY} Q -200 ${CY - a} 0 ${CY} T 400 ${CY} T 800 ${CY} T 1200 ${CY} T 1600 ${CY} T 2000 ${CY} T 2400 ${CY}`;
    }
  }
};

export interface TextLoopProps {
  text?: string;
  shape?: TextLoopShape;
  path?: string;
  speed?: number;
  direction?: 'forward' | 'reverse';
  separator?: string;
  curviness?: number;
  fontSize?: number;
  fontWeight?: number | string;
  letterSpacing?: number;
  uppercase?: boolean;
  color?: string;
  ribbon?: boolean;
  ribbonColor?: string;
  ribbonWidth?: number;
  pauseOnHover?: boolean;
  preserveAspectRatio?: string;
  className?: string;
  style?: React.CSSProperties;
}

const TextLoop: React.FC<TextLoopProps> = ({
  text = 'React ✦ Bits',
  shape = 'wave',
  path,
  speed = 90,
  direction = 'forward',
  separator = '✦',
  curviness = 90,
  fontSize = 46,
  fontWeight = 800,
  letterSpacing = 2,
  uppercase = true,
  color = '#ffffff',
  ribbon = true,
  ribbonColor = '#5227FF',
  ribbonWidth = 86,
  pauseOnHover = true,
  preserveAspectRatio = 'none',
  className = '',
  style = {}
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);

  const [metrics, setMetrics] = useState<{ length: number; unitWidth: number; reps: number }>({
    length: 3000,
    unitWidth: 550,
    reps: 12
  });

  const rawId = useId();
  const pathId = `text-loop-${rawId.replace(/:/g, '')}`;

  const d = useMemo(() => path || buildPath(shape, curviness, ribbonWidth), [path, shape, curviness, ribbonWidth]);

  const unit = useMemo(() => {
    const base = uppercase ? String(text).toUpperCase() : String(text);
    const gap = separator ? `\u00A0${separator}\u00A0` : '\u00A0\u00A0\u00A0';
    return `${base}${gap}`;
  }, [text, separator, uppercase]);

  const textStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`,
      fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif"
    }),
    [fontSize, fontWeight, letterSpacing]
  );

  useLayoutEffect(() => {
    const pathEl = pathRef.current;
    const measureEl = measureRef.current;
    if (!pathEl || !measureEl) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      let pathLen = 0;
      let textUnitWidth = 0;
      try {
        pathLen = pathEl.getTotalLength();
        textUnitWidth = measureEl.getComputedTextLength();
      } catch {
        pathLen = 3000;
        textUnitWidth = fontSize * (unit.length || 20) * 0.6;
      }
      if (!pathLen || pathLen <= 0) {
        pathLen = 3000;
      }
      if (!textUnitWidth || textUnitWidth <= 0) {
        textUnitWidth = Math.max(120, fontSize * (unit.length || 20) * 0.6);
      }

      // We need enough copies so that repeating unit fits at least twice the entire curve length + buffer
      const reps = Math.max(12, Math.ceil((pathLen * 3) / textUnitWidth));
      setMetrics(prev =>
        prev.length === pathLen && Math.abs(prev.unitWidth - textUnitWidth) < 2 && prev.reps === reps
          ? prev
          : { length: pathLen, unitWidth: textUnitWidth, reps }
      );
    };

    measure();

    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 200);

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {});
    }

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [d, unit, fontSize, fontWeight, letterSpacing]);

  // Infinite Animation Loop: Calculate SMIL & dynamic offsets
  const unitWidth = metrics.unitWidth || 550;
  const baseOffset = -unitWidth * 3;
  const targetOffset = direction === 'reverse' ? baseOffset + unitWidth : baseOffset - unitWidth;
  const duration = Math.max(1, unitWidth / Math.max(10, speed));

  // JS Ticker fallback for instant frame-by-frame rendering
  useEffect(() => {
    const textPath = textPathRef.current;
    if (!textPath || unitWidth <= 0) return undefined;

    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || speed <= 0) return undefined;

    let isPaused = false;
    let animFrameId: number;
    let lastTime = performance.now();
    let currentOffset = baseOffset;

    // Movement direction: forward moves text forward along the path
    const dirMultiplier = direction === 'reverse' ? 1 : -1;

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!isPaused && delta > 0 && delta < 0.2) {
        currentOffset += speed * dirMultiplier * delta;

        // Seamless modulus wrapping around unitWidth
        if (dirMultiplier < 0 && currentOffset <= baseOffset - unitWidth) {
          currentOffset += unitWidth;
        } else if (dirMultiplier > 0 && currentOffset >= baseOffset + unitWidth) {
          currentOffset -= unitWidth;
        }

        // Set startOffset value across all SVG attribute & property APIs
        const offsetVal = currentOffset.toFixed(1);
        textPath.setAttribute('startOffset', offsetVal);
        if (textPath.startOffset && textPath.startOffset.baseVal) {
          textPath.startOffset.baseVal.value = currentOffset;
        }
      }

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);

    const root = rootRef.current;
    const pause = () => {
      if (pauseOnHover) {
        isPaused = true;
        svgRef.current?.pauseAnimations?.();
      }
    };
    const resume = () => {
      if (pauseOnHover) {
        lastTime = performance.now();
        isPaused = false;
        svgRef.current?.unpauseAnimations?.();
      }
    };

    if (pauseOnHover && root) {
      root.addEventListener('pointerenter', pause);
      root.addEventListener('pointerleave', resume);
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      if (pauseOnHover && root) {
        root.removeEventListener('pointerenter', pause);
        root.removeEventListener('pointerleave', resume);
      }
    };
  }, [metrics, speed, direction, pauseOnHover, baseOffset, unitWidth]);

  const loopText = useMemo(() => unit.repeat(metrics.reps), [unit, metrics.reps]);

  return (
    <div ref={rootRef} className={`text-loop ${className}`.trim()} style={style}>
      <svg
        ref={svgRef}
        className="text-loop-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio={preserveAspectRatio}
        role="img"
        aria-label={text}
      >
        <path
          ref={pathRef}
          id={pathId}
          d={d}
          fill="none"
          stroke={ribbon ? ribbonColor : 'none'}
          strokeWidth={ribbon ? ribbonWidth : 0}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <text ref={measureRef} className="text-loop-measure" style={textStyle} aria-hidden="true">
          {unit}
        </text>

        <text
          className="text-loop-text"
          style={textStyle}
          fill={color}
          dominantBaseline="central"
          alignmentBaseline="central"
          aria-hidden="true"
        >
          <textPath
            ref={textPathRef}
            href={`#${pathId}`}
            xlinkHref={`#${pathId}`}
            startOffset={baseOffset}
          >
            {loopText}
            <animate
              attributeName="startOffset"
              from={baseOffset}
              to={targetOffset}
              dur={`${duration}s`}
              repeatCount="indefinite"
            />
          </textPath>
        </text>
      </svg>
    </div>
  );
};

export default TextLoop;
