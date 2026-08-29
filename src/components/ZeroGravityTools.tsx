import React, { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Layers, Code2, Box, RefreshCw, Zap } from "lucide-react";
import { ToolItem, KNOWN_TOOLS } from "./Expertise";
import { playHoverTick, playClickPop, playAirDisplacement } from "../utils/sound";

interface PhysicsBody {
  id: string;
  tool: ToolItem;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  radius: number;
  rot: number;
  vRot: number;
  seed: number;
  isDragging: boolean;
  el: HTMLDivElement | null;
}

interface ZeroGravityToolsProps {
  className?: string;
}

export default function ZeroGravityTools({ className = "" }: ZeroGravityToolsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isInteracting, setIsInteracting] = useState(false);
  const bodiesRef = useRef<PhysicsBody[]>([]);
  const pointerRef = useRef<{
    x: number;
    y: number;
    prevX: number;
    prevY: number;
    vx: number;
    vy: number;
    isActive: boolean;
    draggedId: string | null;
    dragOffsetX: number;
    dragOffsetY: number;
    history: { x: number; y: number; t: number }[];
  }>({
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vx: 0,
    vy: 0,
    isActive: false,
    draggedId: null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    history: [],
  });

  const animFrameRef = useRef<number | null>(null);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Initialize physics bodies
  const initBodies = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 420;
    sizeRef.current = { width, height };

    // Approximate pill dimensions before DOM measurement
    const isMobile = width < 640;
    const pillW = isMobile ? 120 : 145;
    const pillH = isMobile ? 42 : 48;
    const radius = Math.max(pillW, pillH) * 0.52;

    const cols = Math.max(3, Math.floor(width / (pillW + 20)));
    const rows = Math.ceil(KNOWN_TOOLS.length / cols);
    const cellW = width / cols;
    const cellH = height / Math.max(1, rows);

    const bodies: PhysicsBody[] = KNOWN_TOOLS.map((tool, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      // Distribute nicely with random jitter across the container
      const startX = cellW * (col + 0.5) + (Math.random() - 0.5) * (cellW * 0.4);
      const startY = cellH * (row + 0.5) + (Math.random() - 0.5) * (cellH * 0.4);

      // Random gentle initial zero-g float velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.8;

      return {
        id: `tool-${tool.name}`,
        tool,
        x: Math.max(radius, Math.min(width - radius, startX)),
        y: Math.max(radius, Math.min(height - radius, startY)),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        width: pillW,
        height: pillH,
        radius,
        rot: (Math.random() - 0.5) * 12,
        vRot: (Math.random() - 0.5) * 0.15,
        seed: Math.random() * 100,
        isDragging: false,
        el: null,
      };
    });

    bodiesRef.current = bodies;
  }, []);

  // Scatter / Zero-G Impulse pulse
  const handleScatter = useCallback(() => {
    playAirDisplacement(0.3);
    const { width, height } = sizeRef.current;
    const cx = width / 2;
    const cy = height / 2;

    bodiesRef.current.forEach((body) => {
      const dx = body.x - cx;
      const dy = body.y - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const pulseSpeed = 4.5 + Math.random() * 3.5;

      body.vx += (dx / dist) * pulseSpeed;
      body.vy += (dy / dist) * pulseSpeed;
      body.vRot += (Math.random() - 0.5) * 1.8;
    });
  }, []);

  // Update actual DOM dimensions of each pill
  const setPillRef = useCallback((idx: number, el: HTMLDivElement | null) => {
    if (bodiesRef.current[idx]) {
      bodiesRef.current[idx].el = el;
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          bodiesRef.current[idx].width = rect.width;
          bodiesRef.current[idx].height = rect.height;
          bodiesRef.current[idx].radius = Math.max(rect.width, rect.height) * 0.5;
        }
      }
    }
  }, []);

  // Main 60FPS Zero-Gravity Physics Loop
  useEffect(() => {
    initBodies();

    const container = containerRef.current;
    if (!container) return;

    // Track resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          sizeRef.current = { width, height };
        }
      }
    });
    resizeObserver.observe(container);

    let lastTime = performance.now();

    const updatePhysics = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap delta time
      lastTime = now;

      const { width, height } = sizeRef.current;
      const bodies = bodiesRef.current;
      const pointer = pointerRef.current;

      if (width <= 0 || height <= 0 || bodies.length === 0) {
        animFrameRef.current = requestAnimationFrame(updatePhysics);
        return;
      }

      // Pointer velocity calculation
      pointer.vx = (pointer.x - pointer.prevX);
      pointer.vy = (pointer.y - pointer.prevY);
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;

      // Clean pointer history older than 100ms
      pointer.history = pointer.history.filter((p) => now - p.t < 100);
      pointer.history.push({ x: pointer.x, y: pointer.y, t: now });

      const timeSec = now * 0.001;

      // 1. Move bodies with zero-g drift and air resistance
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];

        if (b.isDragging) {
          // Direct drag follow
          const targetX = pointer.x - pointer.dragOffsetX;
          const targetY = pointer.y - pointer.dragOffsetY;
          b.vx = (targetX - b.x) * 0.35;
          b.vy = (targetY - b.y) * 0.35;
          b.x = targetX;
          b.y = targetY;
        } else {
          // Continuous micro cosmic drift so zero-g feels active
          const driftX = Math.cos(timeSec * 0.8 + b.seed) * 0.04;
          const driftY = Math.sin(timeSec * 0.7 + b.seed * 1.5) * 0.04;
          b.vx += driftX;
          b.vy += driftY;

          // Zero-g low drag
          b.vx *= 0.993;
          b.vy *= 0.993;
          b.vRot *= 0.985;

          // Speed limit
          const speed = Math.hypot(b.vx, b.vy);
          if (speed > 12) {
            b.vx = (b.vx / speed) * 12;
            b.vy = (b.vy / speed) * 12;
          }

          b.x += b.vx;
          b.y += b.vy;
          b.rot += b.vRot;

          // Gentle rotation restoring force towards 0
          b.rot *= 0.995;

          // Pointer proximity repulsion (interactive wake)
          if (pointer.isActive && !pointer.draggedId) {
            const dx = b.x - pointer.x;
            const dy = b.y - pointer.y;
            const dist = Math.hypot(dx, dy);
            const repelRadius = 140;

            if (dist < repelRadius && dist > 0) {
              const force = Math.pow(1 - dist / repelRadius, 2) * 1.8;
              b.vx += (dx / dist) * force;
              b.vy += (dy / dist) * force;
              b.vRot += (dx > 0 ? 0.05 : -0.05) * force;
            }
          }
        }
      }

      // 2. Strict Multi-Pass Non-Overlapping Collision Resolution
      // Running 6 solver iterations guarantees elements never overlap or penetrate
      const solverIterations = 6;
      for (let iter = 0; iter < solverIterations; iter++) {
        for (let i = 0; i < bodies.length; i++) {
          const a = bodies[i];

          // Collision against walls
          const halfW = a.width / 2;
          const halfH = a.height / 2;
          const padding = 12;

          if (a.x - halfW < padding) {
            a.x = padding + halfW;
            if (a.vx < 0) a.vx = -a.vx * 0.78;
            a.vRot *= -0.8;
          } else if (a.x + halfW > width - padding) {
            a.x = width - padding - halfW;
            if (a.vx > 0) a.vx = -a.vx * 0.78;
            a.vRot *= -0.8;
          }

          if (a.y - halfH < padding) {
            a.y = padding + halfH;
            if (a.vy < 0) a.vy = -a.vy * 0.78;
            a.vRot *= -0.8;
          } else if (a.y + halfH > height - padding) {
            a.y = height - padding - halfH;
            if (a.vy > 0) a.vy = -a.vy * 0.78;
            a.vRot *= -0.8;
          }

          // Pairwise Body-vs-Body Collisions (Rounded capsule / circle distance)
          for (let j = i + 1; j < bodies.length; j++) {
            const b = bodies[j];

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);

            // Calculate minimum non-overlapping distance between rounded pill boundaries
            const minAllowedDist = (a.radius + b.radius) * 0.88 + 8;

            if (dist < minAllowedDist && dist > 0.001) {
              const overlap = minAllowedDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;

              // Separate bodies immediately
              if (a.isDragging) {
                b.x += nx * overlap;
                b.y += ny * overlap;
              } else if (b.isDragging) {
                a.x -= nx * overlap;
                a.y -= ny * overlap;
              } else {
                a.x -= nx * overlap * 0.5;
                a.y -= ny * overlap * 0.5;
                b.x += nx * overlap * 0.5;
                b.y += ny * overlap * 0.5;
              }

              // Elastic momentum impulse exchange
              const relVx = b.vx - a.vx;
              const relVy = b.vy - a.vy;
              const normalVel = relVx * nx + relVy * ny;

              if (normalVel < 0) {
                const restitution = 0.75;
                const impulse = -(1 + restitution) * normalVel * 0.5;

                if (!a.isDragging) {
                  a.vx -= impulse * nx;
                  a.vy -= impulse * ny;
                  a.vRot += (Math.random() - 0.5) * 0.08;
                }
                if (!b.isDragging) {
                  b.vx += impulse * nx;
                  b.vy += impulse * ny;
                  b.vRot += (Math.random() - 0.5) * 0.08;
                }
              }
            }
          }
        }
      }

      // 3. Render directly via hardware-accelerated transform
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.el) {
          const posX = b.x - b.width / 2;
          const posY = b.y - b.height / 2;
          b.el.style.transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, 0px) rotate(${b.rot.toFixed(1)}deg)`;
        }
      }

      animFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    animFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [initBodies]);

  // Pointer event handlers for drag, fling, and hover
  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const body = bodiesRef.current.find((b) => b.id === id);
    if (!body) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    body.isDragging = true;
    body.vx = 0;
    body.vy = 0;

    pointerRef.current.draggedId = id;
    pointerRef.current.dragOffsetX = clientX - body.x;
    pointerRef.current.dragOffsetY = clientY - body.y;
    pointerRef.current.x = clientX;
    pointerRef.current.y = clientY;
    pointerRef.current.prevX = clientX;
    pointerRef.current.prevY = clientY;
    pointerRef.current.history = [{ x: clientX, y: clientY, t: performance.now() }];
    pointerRef.current.isActive = true;

    setIsInteracting(true);
    playClickPop(0.2, 1.2);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    pointerRef.current.x = clientX;
    pointerRef.current.y = clientY;
    pointerRef.current.isActive = true;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const draggedId = pointerRef.current.draggedId;
    if (draggedId) {
      const body = bodiesRef.current.find((b) => b.id === draggedId);
      if (body) {
        body.isDragging = false;

        // Compute throw impulse from pointer history
        const history = pointerRef.current.history;
        if (history.length >= 2) {
          const first = history[0];
          const last = history[history.length - 1];
          const dt = Math.max(1, last.t - first.t) / 1000;
          const flingX = (last.x - first.x) / dt;
          const flingY = (last.y - first.y) / dt;

          body.vx = Math.max(-14, Math.min(14, flingX * 0.016));
          body.vy = Math.max(-14, Math.min(14, flingY * 0.016));
          body.vRot = (Math.random() - 0.5) * 0.4;

          if (Math.hypot(body.vx, body.vy) > 2) {
            playAirDisplacement(0.15);
          }
        }
      }
    }

    pointerRef.current.draggedId = null;
    setIsInteracting(false);
  };

  const handlePointerLeave = () => {
    pointerRef.current.isActive = false;
    if (pointerRef.current.draggedId) {
      const body = bodiesRef.current.find((b) => b.id === pointerRef.current.draggedId);
      if (body) body.isDragging = false;
      pointerRef.current.draggedId = null;
    }
    setIsInteracting(false);
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      
      {/* Zero-G Controller Bar (Filters & Scatter Action) */}
      <div className="flex items-center justify-between gap-3 flex-wrap font-mono text-xs z-20">
        
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => {
              playClickPop(0.3, 1.1);
              setActiveCategory("all");
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer ${
              activeCategory === "all"
                ? "bg-[#0f0f0f] text-white border-black font-semibold shadow-xs"
                : "bg-white/60 text-black/70 border-black/10 hover:border-black/30 hover:bg-white"
            }`}
          >
            ALL ({KNOWN_TOOLS.length})
          </button>
          <button
            onClick={() => {
              playClickPop(0.3, 1.15);
              setActiveCategory("design");
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "design"
                ? "bg-[#0f0f0f] text-white border-black font-semibold shadow-xs"
                : "bg-white/60 text-black/70 border-black/10 hover:border-black/30 hover:bg-white"
            }`}
          >
            <Layers size={13} />
            <span className="hidden sm:inline">UI/UX & DESIGN</span>
            <span className="sm:hidden">DESIGN</span>
          </button>
          <button
            onClick={() => {
              playClickPop(0.3, 1.2);
              setActiveCategory("dev");
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "dev"
                ? "bg-[#0f0f0f] text-white border-black font-semibold shadow-xs"
                : "bg-white/60 text-black/70 border-black/10 hover:border-black/30 hover:bg-white"
            }`}
          >
            <Code2 size={13} />
            <span className="hidden sm:inline">FRONTEND & CODE</span>
            <span className="sm:hidden">CODE</span>
          </button>
          <button
            onClick={() => {
              playClickPop(0.3, 1.25);
              setActiveCategory("motion");
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "motion"
                ? "bg-[#0f0f0f] text-white border-black font-semibold shadow-xs"
                : "bg-white/60 text-black/70 border-black/10 hover:border-black/30 hover:bg-white"
            }`}
          >
            <Box size={13} />
            <span className="hidden sm:inline">MOTION & 3D</span>
            <span className="sm:hidden">MOTION</span>
          </button>
          <button
            onClick={() => {
              playClickPop(0.3, 1.3);
              setActiveCategory("ai");
            }}
            className={`px-3 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              activeCategory === "ai"
                ? "bg-[#0f0f0f] text-white border-black font-semibold shadow-xs"
                : "bg-white/60 text-black/70 border-black/10 hover:border-black/30 hover:bg-white"
            }`}
          >
            <Sparkles size={13} />
            <span className="hidden sm:inline">AI & CREATIVE</span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>

        {/* Zero-G Pulse & Scatter Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleScatter}
            onMouseEnter={() => playHoverTick(0.1, 1.4)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Send an anti-gravity radial pulse to scatter all tools"
          >
            <Zap size={13} className="fill-black text-black" />
            <span>ZERO-G PULSE</span>
          </button>
        </div>
      </div>

      {/* Zero Gravity Physics Sandbox Canvas Frame */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="relative w-full h-[380px] sm:h-[420px] md:h-[450px] rounded-2xl bg-white/40 backdrop-blur-xl border border-white/80 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),0_10px_35px_-8px_rgba(0,0,0,0.07)] overflow-hidden touch-none select-none"
      >
        {/* Subtle Ambient Cosmic Grid & Zero-G Field Watermark */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        {/* Bottom Floating Status Hint */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none font-mono text-[10px] sm:text-[11px] text-black/40 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            ZERO-GRAVITY FIELD ACTIVE • DRAG & TOSS TOOLS
          </span>
          <span className="hidden sm:inline text-black/35">
            COLLISION RESOLVED • ZERO OVERLAP
          </span>
        </div>

        {/* Floating Tool Pills */}
        {KNOWN_TOOLS.map((tool, idx) => {
          const IconComponent = tool.icon;
          const isCategoryMatch = activeCategory === "all" || tool.category === activeCategory;

          return (
            <div
              key={tool.name}
              ref={(el) => setPillRef(idx, el)}
              onPointerDown={(e) => handlePointerDown(`tool-${tool.name}`, e)}
              onMouseEnter={() => playHoverTick(0.08, 1.3)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                willChange: "transform",
                opacity: isCategoryMatch ? 1 : 0.28,
                transformOrigin: "center center",
                zIndex: isCategoryMatch ? 10 : 5,
              }}
              className={`group flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/95 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_12px_28px_-4px_rgba(0,0,0,0.2),inset_0_1.5px_2px_rgba(255,255,255,1)] transition-colors duration-150 cursor-grab active:cursor-grabbing hover:scale-105 select-none`}
            >
              {/* Tool Icon Circle */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/[0.05] group-hover:bg-black/[0.09] flex items-center justify-center shrink-0 transition-colors p-1">
                <IconComponent size={15} />
              </div>

              {/* Tool Name */}
              <span className="font-sans font-bold text-xs sm:text-[13px] text-[#0f0f0f] tracking-tight whitespace-nowrap">
                {tool.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
