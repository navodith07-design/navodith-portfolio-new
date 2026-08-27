import React, { useRef, useState, useCallback, useEffect } from "react";
import "./OptionWheel.css";
import { isMuted } from "../utils/sound";

// High-precision Web Audio Synthesizer for tactile rotary scroll clicks
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playTactileClick(volume: number = 0.5, pitchRatio: number = 1.0) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;
    
    // Snappy tactile click transient (high-frequency mechanical snap)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1800 * pitchRatio, t);
    osc.frequency.exponentialRampToValueAtTime(150 * pitchRatio, t + 0.014);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2600, t);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.4, t + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.016);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.02);

    // Warm mechanical resonance body for depth
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(360 * pitchRatio, t);
    subOsc.frequency.exponentialRampToValueAtTime(70, t + 0.022);

    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(Math.min(volume, 1) * 0.28, t + 0.001);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);

    subOsc.start(t);
    subOsc.stop(t + 0.028);
  } catch (e) {
    // Ignore audio policy errors gracefully
  }
}

const DEFAULT_ITEMS = [
  "Ambient",
  "House",
  "Techno",
  "Jazz",
  "Lo-Fi",
  "Synthwave",
  "Trance",
  "Funk",
  "Disco",
  "Hip-Hop",
  "Chillwave",
  "Drum & Bass"
];

export interface OptionWheelProps {
  items?: string[];
  defaultSelected?: number;
  selectedIndex?: number;
  onChange?: (index: number, item: string) => void;
  textColor?: string;
  activeColor?: string;
  side?: "left" | "right";
  fontSize?: number;
  spacing?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: number;
  loop?: boolean;
  draggable?: boolean;
  enableWheel?: boolean;
  enableSound?: boolean;
  soundUrl?: string;
  soundVolume?: number;
  className?: string;
}

export const OptionWheel: React.FC<OptionWheelProps> = ({
  items = DEFAULT_ITEMS,
  defaultSelected = 0,
  selectedIndex: externalSelectedIndex,
  onChange,
  textColor = "#777777",
  activeColor = "#0f0f0f",
  side = "left",
  fontSize = 1.75,
  spacing = 1.4,
  curve = 1,
  tilt = 6,
  blur = 2,
  fade = 0.25,
  minOpacity = 0.05,
  smoothing = 200,
  inset = 20,
  loop = false,
  draggable = true,
  enableWheel = true,
  enableSound = true,
  soundUrl = "",
  soundVolume = 0.5,
  className = ""
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const initialIdx = externalSelectedIndex ?? defaultSelected;
  const posRef = useRef<number>(initialIdx);
  const targetRef = useRef<number>(initialIdx);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const cfgRef = useRef<any>({});
  const onChangeRef = useRef(onChange);
  const selectedRef = useRef<number>(initialIdx);
  const wheelTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragRef = useRef<{ y: number; start: number; id: number } | null>(null);
  const dragMovedRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string>("");
  const lastTickRef = useRef<number>(0);
  const lastCrossedIdxRef = useRef<number>(initialIdx);

  const [selectedIndex, setSelectedIndex] = useState<number>(initialIdx);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const remPx =
    typeof window !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;

  onChangeRef.current = onChange;
  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(fontSize * spacing * remPx, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    loop,
    smoothing,
    draggable,
    enableWheel,
    enableSound,
    soundUrl,
    soundVolume
  };

  // Tactile click sound trigger
  const playTick = useCallback((pitchFactor: number = 1.0) => {
    if (isMuted()) return;
    const { enableSound = true, soundUrl, soundVolume = 0.5 } = cfgRef.current;
    if (!enableSound) return;
    const now = performance.now();
    if (now - lastTickRef.current < 40) return; // allows smooth rapid ticking up to 25 ticks/sec
    lastTickRef.current = now;

    if (soundUrl) {
      if (!audioRef.current || audioUrlRef.current !== soundUrl) {
        audioRef.current = new Audio(soundUrl);
        audioRef.current.preload = "auto";
        audioUrlRef.current = soundUrl;
      }
      const audio = audioRef.current;
      audio.volume = Math.min(Math.max(soundVolume, 0), 1);
      audio.currentTime = 0;
      audio.play()?.catch(() => {});
    } else {
      playTactileClick(soundVolume, pitchFactor);
    }
  }, []);

  // Single rAF loop that eases the wheel position toward its target with
  // frame-rate independent exponential smoothing
  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current;
    const tau = Math.max(cfg.smoothing, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    const target = targetRef.current;
    const cur = posRef.current;
    let next = cur + (target - cur) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    posRef.current = next;

    // Check if crossing a new item slot boundary for continuous haptic ticking
    const currentRounded = Math.round(next);
    if (currentRounded !== lastCrossedIdxRef.current) {
      lastCrossedIdxRef.current = currentRounded;
      playTick();
    }

    const els = itemRefs.current;
    const n = cfg.count;
    const mirror = cfg.side === "right" ? -1 : 1;

    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (!el) continue;
      let d = i - next;
      if (cfg.loop && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(cfg.minOpacity, 1 - dist * cfg.fade));
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : "none";
      el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    rafRef.current = settled ? null : requestAnimationFrame(runFrame);
  }, [playTick]);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const applyTarget = useCallback(
    (value: number, snap: boolean) => {
      const cfg = cfgRef.current;
      let v = value;
      if (!cfg.loop) v = Math.min(Math.max(v, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      targetRef.current = v;
      const idx = ((Math.round(v) % cfg.count) + cfg.count) % cfg.count;
      if (idx !== selectedRef.current) {
        selectedRef.current = idx;
        setSelectedIndex(idx);
        onChangeRef.current?.(idx, cfg.items[idx]);
        playTick();
      }
      startLoop();
    },
    [startLoop, playTick]
  );

  // Sync with externalSelectedIndex if provided
  useEffect(() => {
    if (externalSelectedIndex !== undefined && externalSelectedIndex !== selectedRef.current) {
      applyTarget(externalSelectedIndex, true);
    }
  }, [externalSelectedIndex, applyTarget]);

  // Wheel / touchpad scrolling (active when enableWheel is true)
  useEffect(() => {
    if (!enableWheel) return;
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const cfg = cfgRef.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      const step = Math.max(-1.5, Math.min(1.5, delta / (cfg.rowH * 0.8)));
      applyTarget(targetRef.current + step, false);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 120);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [enableWheel, applyTarget]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!cfgRef.current.draggable) return;
    dragRef.current = { y: e.clientY, start: targetRef.current, id: e.pointerId };
    dragMovedRef.current = false;
    setIsDragging(true);
    getAudioContext(); // Pre-warm audio context on user interaction
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!dragMovedRef.current && Math.abs(dy) > 4) {
        dragMovedRef.current = true;
        rootRef.current?.setPointerCapture(drag.id);
      }
      if (dragMovedRef.current) {
        applyTarget(drag.start - dy / cfgRef.current.rowH, false);
      }
    },
    [applyTarget]
  );

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) applyTarget(targetRef.current, true);
  }, [applyTarget]);

  const handleItemClick = useCallback(
    (index: number) => {
      if (dragMovedRef.current) return;
      const cfg = cfgRef.current;
      const cur = targetRef.current;
      let d = index - (((cur % cfg.count) + cfg.count) % cfg.count);
      if (cfg.loop && cfg.count > 1) {
        if (d > cfg.count / 2) d -= cfg.count;
        else if (d < -cfg.count / 2) d += cfg.count;
      }
      playTick(1.1);
      applyTarget(cur + d, true);
    },
    [applyTarget, playTick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let delta = null;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") delta = -1;
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") delta = 1;
      if (delta == null) return;
      e.preventDefault();
      playTick();
      applyTarget(Math.round(targetRef.current) + delta, true);
    },
    [applyTarget, playTick]
  );

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [items, fontSize, spacing, curve, tilt, blur, fade, minOpacity, side, loop, smoothing, applyTarget]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      audioRef.current?.pause();
    },
    []
  );

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label="Option wheel"
      data-lenis-prevent="true"
      data-lenis-prevent-wheel="true"
      className={`option-wheel${side === "right" ? " option-wheel--right" : ""}${
        isDragging ? " option-wheel--dragging" : ""
      }${className ? ` ${className}` : ""}`}
      style={
        {
          "--ow-text-color": textColor,
          "--ow-active-color": activeColor,
          "--ow-font-size": `${fontSize}rem`,
          "--ow-inset": `${inset}px`
        } as React.CSSProperties
      }
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onKeyDown={handleKeyDown}
    >
      {items.map((label, index) => (
        <div
          key={`${label}-${index}`}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${
            selectedIndex === index ? " option-wheel__item--selected" : ""
          }`}
          onClick={() => handleItemClick(index)}
        >
          {label}
        </div>
      ))}
    </div>
  );
};

export default OptionWheel;
