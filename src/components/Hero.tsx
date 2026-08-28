import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, Cpu, MoveRight } from "lucide-react";
import navoImg from "../navo.webp";
import { playMarqueeTone, playLiquidSplash, playHoverTick, playClickPop } from "../utils/sound";

// Helper function to draw image with object-fit: cover on canvas
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number
) {
  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;
  if (!imgW || !imgH) return;

  const imgRatio = imgW / imgH;
  const canvasRatio = w / h;

  let sx = 0, sy = 0, sWidth = imgW, sHeight = imgH;

  if (imgRatio > canvasRatio) {
    // Image is wider than canvas -> crop sides
    sWidth = imgH * canvasRatio;
    sx = (imgW - sWidth) / 2;
  } else {
    // Image is taller than canvas -> crop top/bottom
    sHeight = imgW / canvasRatio;
    sy = (imgH - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, w, h);
}

interface MarqueeRowConfig {
  id: string;
  word: string;
  direction: "left" | "right";
  duration: number;
}

const HERO_ROWS: MarqueeRowConfig[] = [
  { id: "row-1", word: "FRONTEND DEVELOPER", direction: "left", duration: 38 },
  { id: "row-2", word: "UI/UX DESIGNER", direction: "right", duration: 44 },
  { id: "row-3", word: "CREATIVE", direction: "left", duration: 35 },
  { id: "row-4", word: "RESPONSIVE DESIGN", direction: "right", duration: 46 },
  { id: "row-5", word: "PROTOTYPING", direction: "left", duration: 37 },
  { id: "row-6", word: "INTERACTION DESIGN", direction: "right", duration: 42 },
];

interface HeroProps {
  isParentLoading?: boolean;
  revealHero?: boolean;
}

function HeroComponent({ isParentLoading = true, revealHero = false }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const showreelCardRef = useRef<HTMLDivElement>(null);
  const showreelInnerRef = useRef<HTMLDivElement>(null);
  const parallaxWrapperRef = useRef<HTMLDivElement>(null);
  const marqueesContainerRef = useRef<HTMLDivElement>(null);
  const metadataRef = useRef<HTMLDivElement>(null);

  // References for liquid reveal effect
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const trailRef = useRef<{
    x: number;
    y: number;
    radius: number;
    life: number;
    decay: number;
    vx: number;
    vy: number;
  }[]>([]);
  const animFrameIdRef = useRef<number>(0);
  const isCardLoopRunningRef = useRef<boolean>(false);
  const fullRevealUntilRef = useRef<number>(0);
  
  // Refs for infinite slide loops of all rows
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const loopTweensRef = useRef<(gsap.core.Tween | null)[]>([]);
  const hoveredRowsRef = useRef<boolean[]>(new Array(HERO_ROWS.length).fill(false));

  // Cached layout dimensions and bounding rects to completely prevent layout thrashing
  const containerSizeRef = useRef({ w: 0, h: 0 });
  const containerRectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const cardRectRef = useRef({ left: 0, top: 0, width: 0, height: 0 });
  const cardCanvasSizeRef = useRef({ w: 0, h: 0 });
  const lastPointerPushRef = useRef(0);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Measure and cache sizes on resize / mount (removed scroll listener to prevent reflow thrashing)
  useEffect(() => {
    const updateSizes = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        containerRectRef.current = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
        containerSizeRef.current = {
          w: Math.floor(containerRef.current.offsetWidth || rect.width || window.innerWidth),
          h: Math.floor(containerRef.current.offsetHeight || rect.height || window.innerHeight),
        };
      }
      if (showreelCardRef.current && canvasRef.current) {
        const cardEl = showreelCardRef.current;
        const rect = cardEl.getBoundingClientRect();
        cardRectRef.current = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        };
        // Use true unscaled layout dimensions for the canvas buffer to prevent distortion
        const layoutW = cardEl.offsetWidth || canvasRef.current.clientWidth || 400;
        const layoutH = cardEl.offsetHeight || canvasRef.current.clientHeight || 550;
        cardCanvasSizeRef.current = {
          w: layoutW,
          h: layoutH,
        };
      }
    };

    updateSizes();
    window.addEventListener("resize", updateSizes, { passive: true });
    return () => {
      window.removeEventListener("resize", updateSizes);
    };
  }, []);

  // Demand-driven card canvas animation loop
  const startCardLoop = () => {
    if (isCardLoopRunningRef.current) return;
    isCardLoopRunningRef.current = true;

    const animateCard = () => {
      const canvas = canvasRef.current;
      const ctxCanvas = canvas?.getContext("2d");
      const img = imageRef.current;

      if (!canvas || !ctxCanvas || !img) {
        isCardLoopRunningRef.current = false;
        return;
      }

      const cardEl = showreelCardRef.current;
      const w = cardEl?.offsetWidth || canvas.clientWidth || cardCanvasSizeRef.current.w || 400;
      const h = cardEl?.offsetHeight || canvas.clientHeight || cardCanvasSizeRef.current.h || 550;

      if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
        canvas.width = w;
        canvas.height = h;
      }

      ctxCanvas.clearRect(0, 0, w, h);

      const now = Date.now();
      const fullRevealRemaining = fullRevealUntilRef.current - now;

      if (fullRevealRemaining > 0) {
        ctxCanvas.save();
        let alpha = 1;
        if (fullRevealRemaining < 1000) {
          alpha = fullRevealRemaining / 1000;
        }
        ctxCanvas.globalAlpha = alpha;
        drawImageCover(ctxCanvas, img, w, h);
        ctxCanvas.restore();
      }

      // Update trail points
      trailRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.radius += 0.5;
      });

      // Remove dead points
      trailRef.current = trailRef.current.filter((p) => p.life > 0);
      if (trailRef.current.length > 30) {
        trailRef.current.splice(0, trailRef.current.length - 30);
      }

      if (trailRef.current.length > 0) {
        ctxCanvas.save();

        trailRef.current.forEach((p) => {
          const grad = ctxCanvas.createRadialGradient(p.x, p.y, p.radius * 0.1, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(0, 0, 0, ${p.life})`);
          grad.addColorStop(0.5, `rgba(0, 0, 0, ${p.life * 0.4})`);
          grad.addColorStop(1, "rgba(0, 0, 0, 0)");

          ctxCanvas.fillStyle = grad;
          ctxCanvas.beginPath();
          ctxCanvas.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctxCanvas.fill();
        });

        ctxCanvas.globalCompositeOperation = "source-in";
        drawImageCover(ctxCanvas, img, w, h);
        ctxCanvas.restore();
      }

      // If no active points and no full reveal remaining, sleep loop
      if (trailRef.current.length === 0 && fullRevealRemaining <= 0) {
        ctxCanvas.clearRect(0, 0, w, h);
        isCardLoopRunningRef.current = false;
        return;
      }

      animFrameIdRef.current = requestAnimationFrame(animateCard);
    };

    animFrameIdRef.current = requestAnimationFrame(animateCard);
  };

  // Track pointer movement over the card for the interactive showreel reveal
  useEffect(() => {
    if (!revealHero) return;

    const processPointer = (clientX: number, clientY: number) => {
      const cardRect = cardRectRef.current;
      if (cardRect.width <= 0) return;

      const cx = clientX - cardRect.left;
      const cy = clientY - cardRect.top;

      if (
        cx >= -30 &&
        cx <= cardRect.width + 30 &&
        cy >= -30 &&
        cy <= cardRect.height + 30
      ) {
        const now = performance.now();
        if (now - lastPointerPushRef.current > 25) {
          lastPointerPushRef.current = now;
          startCardLoop();
          if (trailRef.current.length < 25) {
            trailRef.current.push({
              x: cx + (Math.random() - 0.5) * 12,
              y: cy + (Math.random() - 0.5) * 12,
              radius: Math.random() * 25 + 90,
              life: 1.0,
              decay: 0.015,
              vx: (Math.random() - 0.5) * 1.0,
              vy: (Math.random() - 0.5) * 1.0,
            });
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      processPointer(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        processPointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("touchmove", handleTouchMove);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [revealHero]);

  // Touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      (window.matchMedia && window.matchMedia("(any-pointer: coarse)").matches)
    );
  });

  useEffect(() => {
    const checkTouch = () => {
      const hasTouch = 
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(any-pointer: coarse)").matches);
      setIsTouchDevice(hasTouch);
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  // Handlers for individual marquee hovers & touch: gradually slow down to a stop on hover, gently resume on leave
  const handleRowEnter = (index: number) => {
    hoveredRowsRef.current[index] = true;
    playMarqueeTone(index, 0.18);
    const tween = loopTweensRef.current[index];
    if (tween) {
      gsap.to(tween, {
        timeScale: 0,
        duration: 1.4,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleRowLeave = (index: number) => {
    hoveredRowsRef.current[index] = false;
    const tween = loopTweensRef.current[index];
    if (tween) {
      gsap.to(tween, {
        timeScale: 1,
        duration: 1.6,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  // Entry animation for the image card and the background marquees
  useEffect(() => {
    const marquees = marqueesContainerRef.current;
    const card = showreelCardRef.current;
    const metadata = metadataRef.current;

    if (!marquees || !card || !metadata) return;

    if (!revealHero) {
      // Set initial state: hide completely and shift
      gsap.set(marquees, { opacity: 0, scale: 0.9, y: 35 });
      gsap.set(card, { 
        opacity: 0, 
        scale: 0.75, 
        y: 100, 
        rotateX: 15, 
        transformPerspective: 1000 
      });
      gsap.set(metadata, { opacity: 0 });
    } else {
      // Bring in the background marquees and central showreel card majestically
      const tl = gsap.timeline();

      tl.to(marquees, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 2.2,
        ease: "power3.out",
      }, 0.1); 

      tl.to(card, {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        duration: 2.6,
        ease: "power4.out",
        onComplete: () => {
          if (showreelCardRef.current) {
            const rect = showreelCardRef.current.getBoundingClientRect();
            cardRectRef.current = {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            };
            cardCanvasSizeRef.current = {
              w: showreelCardRef.current.offsetWidth,
              h: showreelCardRef.current.offsetHeight,
            };
          }
        },
      }, 0.3); // Stagger card rise slightly for elegant layered timing

      tl.to(metadata, {
        opacity: 1,
        duration: 1.5,
        ease: "power2.out",
      }, 0.6);
    }
  }, [revealHero]);

  // Function to create an expanding fluid ink spread burst that reveals the full-color photo
  const triggerFullRevealBurst = (x?: number, y?: number) => {
    fullRevealUntilRef.current = Date.now() + 5000; // Keep full color revealed for 5 seconds with smooth fade
    startCardLoop();

    const canvas = canvasRef.current;
    if (canvas) {
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 450;

      const centerX = x !== undefined ? x : w / 2;
      const centerY = y !== undefined ? y : h / 2;

      for (let wave = 0; wave < 6; wave++) {
        const count = 12 + wave * 4;
        const baseRadius = wave * 25;
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2 + (wave * 0.15);
          const distance = baseRadius + (Math.random() - 0.5) * 15;
          trailRef.current.push({
            x: centerX + Math.cos(angle) * distance,
            y: centerY + Math.sin(angle) * distance,
            radius: Math.random() * 30 + 40,
            life: 1.0,
            decay: 0.0035, // Smooth decay over ~5s
            vx: Math.cos(angle) * 1.0,
            vy: Math.sin(angle) * 1.0,
          });
        }
      }
    }
  };

  // Shake gesture detection & Gyroscope tilt for mobile devices
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastX = 0, lastY = 0, lastZ = 0;
    let isInitialized = false;
    let lastTime = Date.now();
    let lastShakeTime = 0;
    const SHAKE_COOLDOWN = 4500; // 4.5s cooldown between shakes matching reveal duration

    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      try {
        const acc = (e.acceleration && (e.acceleration.x !== null || e.acceleration.y !== null))
          ? e.acceleration 
          : e.accelerationIncludingGravity;
        if (!acc) return;

        const currentTime = Date.now();
        const diffTime = currentTime - lastTime;

        if (diffTime > 50) {
          lastTime = currentTime;
          const x = acc.x || 0;
          const y = acc.y || 0;
          const z = acc.z || 0;

          if (!isInitialized) {
            lastX = x;
            lastY = y;
            lastZ = z;
            isInitialized = true;
            return;
          }

          const deltaX = Math.abs(x - lastX);
          const deltaY = Math.abs(y - lastY);
          const deltaZ = Math.abs(z - lastZ);
          const totalMovement = deltaX + deltaY + deltaZ;

          // Responsive shake detection with cooldown
          if (totalMovement > 8.5 && currentTime - lastShakeTime > SHAKE_COOLDOWN) {
            lastShakeTime = currentTime;
            playLiquidSplash(0.45);
            triggerFullRevealBurst();
          }

          lastX = x;
          lastY = y;
          lastZ = z;
        }
      } catch {
        // Silently catch motion errors
      }
    };

    // Gyroscope tilt interaction on mobile (mirroring mousemove tilt & liquid cursor)
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      const innerElement = showreelInnerRef.current;
      if (!innerElement) return;

      const gamma = e.gamma ?? 0; // Left-to-Right (-90 to 90)
      const beta = e.beta ?? 45;  // Front-to-Back (-180 to 180, resting around 40-50 deg)

      // Normalize around normal phone holding angle
      const deltaBeta = Math.max(-35, Math.min(35, beta - 45));
      const clampedGamma = Math.max(-35, Math.min(35, gamma));

      const tiltX = (deltaBeta / 35) * -12;
      const tiltY = (clampedGamma / 35) * 12;

      gsap.to(innerElement, {
        rotateX: tiltX,
        rotateY: tiltY,
        transformPerspective: 1000,
        scale: 1.01,
        duration: 0.35,
        ease: "power2.out",
        overwrite: "auto",
      });

      // Generate subtle fluid ripples from gyro tilt
      const canvas = canvasRef.current;
      if (canvas) {
        const w = cardCanvasSizeRef.current.w || canvas.clientWidth || 300;
        const h = cardCanvasSizeRef.current.h || canvas.clientHeight || 420;
        const cx = (w / 2) + (clampedGamma / 35) * (w * 0.38);
        const cy = (h / 2) + (deltaBeta / 35) * (h * 0.38);

        const now = performance.now();
        if (now - lastPointerPushRef.current > 40) {
          lastPointerPushRef.current = now;
          startCardLoop();
          if (trailRef.current.length < 25) {
            trailRef.current.push({
              x: cx + (Math.random() - 0.5) * 14,
              y: cy + (Math.random() - 0.5) * 14,
              radius: Math.random() * 30 + 80,
              life: 1.0,
              decay: 0.018,
              vx: (Math.random() - 0.5) * 0.8,
              vy: (Math.random() - 0.5) * 0.8,
            });
          }
        }
      }
    };

    let permissionRequested = false;
    const requestSensorPermissions = async () => {
      if (permissionRequested) return;
      permissionRequested = true;

      try {
        if (
          typeof DeviceMotionEvent !== "undefined" &&
          typeof (DeviceMotionEvent as any).requestPermission === "function"
        ) {
          const res = await (DeviceMotionEvent as any).requestPermission();
          if (res === "granted") {
            window.addEventListener("devicemotion", handleDeviceMotion, true);
          }
        } else {
          window.addEventListener("devicemotion", handleDeviceMotion, true);
        }
      } catch {}

      try {
        if (
          typeof DeviceOrientationEvent !== "undefined" &&
          typeof (DeviceOrientationEvent as any).requestPermission === "function"
        ) {
          const res = await (DeviceOrientationEvent as any).requestPermission();
          if (res === "granted") {
            window.addEventListener("deviceorientation", handleDeviceOrientation, true);
          }
        } else {
          window.addEventListener("deviceorientation", handleDeviceOrientation, true);
        }
      } catch {}
    };

    // Attach listeners directly for Android/standard browsers
    try {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof (DeviceMotionEvent as any).requestPermission !== "function"
      ) {
        window.addEventListener("devicemotion", handleDeviceMotion, true);
      }
    } catch {}

    try {
      if (
        typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as any).requestPermission !== "function"
      ) {
        window.addEventListener("deviceorientation", handleDeviceOrientation, true);
      }
    } catch {}

    const handleUserInteraction = () => {
      requestSensorPermissions();
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("touchend", handleUserInteraction);
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("pointerdown", handleUserInteraction);
    };

    window.addEventListener("touchstart", handleUserInteraction, { passive: true });
    window.addEventListener("touchend", handleUserInteraction, { passive: true });
    window.addEventListener("click", handleUserInteraction, { passive: true });
    window.addEventListener("pointerdown", handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion, true);
      window.removeEventListener("deviceorientation", handleDeviceOrientation, true);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("touchend", handleUserInteraction);
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("pointerdown", handleUserInteraction);
    };
  }, [revealHero]);

  useEffect(() => {
    if (!revealHero) return;

    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Background Scroll-Triggered & Continuous Infinite Marquee Animation (Layer 0)
    const ctx = gsap.context(() => {
      HERO_ROWS.forEach((row, i) => {
        const el = rowRefs.current[i];
        if (!el) return;

        if (row.direction === "left") {
          loopTweensRef.current[i] = gsap.to(el, {
            xPercent: -50,
            repeat: -1,
            duration: row.duration,
            ease: "none",
          });
        } else {
          loopTweensRef.current[i] = gsap.fromTo(
            el,
            { xPercent: -50 },
            {
              xPercent: 0,
              repeat: -1,
              duration: row.duration,
              ease: "none",
            }
          );
        }
      });

      // Parallax movement on the centered showreel wrapper relative to scroll
      if (parallaxWrapperRef.current) {
        gsap.fromTo(
          parallaxWrapperRef.current,
          { y: 0 },
          {
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top top",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
            y: -120,
            ease: "none",
          }
        );
      }

      // Parallax movement on the marquees wall relative to scroll
      if (marqueesContainerRef.current) {
        gsap.to(marqueesContainerRef.current, {
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
          y: -40,
          ease: "none",
        });
      }
    }, containerRef);

    // 3D Tilt interaction and Liquid Color Reveal for the center card (Layer 1)
    const cardElement = showreelCardRef.current;
    const innerElement = showreelInnerRef.current;

    if (cardElement && innerElement) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = cardRectRef.current;
        if (rect.width <= 0) return;

        // Calculate coordinate offsets relative to center of card
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        // Tilt bounds: max 12 degrees
        const tiltX = (y / (rect.height / 2)) * -12;
        const tiltY = (x / (rect.width / 2)) * 12;

        gsap.to(innerElement, {
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 1000,
          scale: 1.02,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });

        // Add points to reveal trail
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        startCardLoop();
        for (let i = 0; i < 2; i++) {
          trailRef.current.push({
            x: cx + (Math.random() - 0.5) * 16,
            y: cy + (Math.random() - 0.5) * 16,
            radius: Math.random() * 35 + 100, // Large 100 to 135px radius
            life: 1.0,
            decay: 0.012, // smooth lingering dissolve
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
          });
        }
      };

      const handleMouseLeave = () => {
        gsap.to(innerElement, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      cardElement.addEventListener("mousemove", handleMouseMove, { passive: true });
      cardElement.addEventListener("mouseleave", handleMouseLeave, { passive: true });

      const handleTouchStart = (e: TouchEvent) => {
        if (!e.touches[0]) return;
        const touch = e.touches[0];
        const rect = cardRectRef.current;
        const cx = touch.clientX - rect.left;
        const cy = touch.clientY - rect.top;

        triggerFullRevealBurst(cx, cy);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!e.touches[0]) return;
        const touch = e.touches[0];

        const rect = cardRectRef.current;
        if (rect.width <= 0) return;

        const x = touch.clientX - rect.left - rect.width / 2;
        const y = touch.clientY - rect.top - rect.height / 2;
        const tiltX = (y / (rect.height / 2)) * -10;
        const tiltY = (x / (rect.width / 2)) * 10;

        gsap.to(innerElement, {
          rotateX: tiltX,
          rotateY: tiltY,
          transformPerspective: 1000,
          scale: 1.02,
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });

        const cx = touch.clientX - rect.left;
        const cy = touch.clientY - rect.top;

        startCardLoop();
        if (trailRef.current.length < 30) {
          for (let i = 0; i < 2; i++) {
            trailRef.current.push({
              x: cx + (Math.random() - 0.5) * 16,
              y: cy + (Math.random() - 0.5) * 16,
              radius: Math.random() * 35 + 100, // Broad 100px-135px radius
              life: 1.0,
              decay: 0.012,
              vx: (Math.random() - 0.5) * 1.2,
              vy: (Math.random() - 0.5) * 1.2,
            });
          }
        }
      };

      const handleTouchEnd = () => {
        gsap.to(innerElement, {
          rotateX: 0,
          rotateY: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      cardElement.addEventListener("touchstart", handleTouchStart, { passive: true });
      cardElement.addEventListener("touchmove", handleTouchMove, { passive: true });
      cardElement.addEventListener("touchend", handleTouchEnd, { passive: true });

      // Pause infinite marquee tweens when hero section is not visible
      let observer: IntersectionObserver | null = null;
      if (typeof IntersectionObserver !== "undefined" && containerRef.current) {
        observer = new IntersectionObserver(
          (entries) => {
            const isIntersecting = entries[0]?.isIntersecting ?? true;
            loopTweensRef.current.forEach((t) => {
              if (t) {
                if (isIntersecting) t.resume();
                else t.pause();
              }
            });
          },
          { threshold: 0.05 }
        );
        observer.observe(containerRef.current);
      }

      return () => {
        observer?.disconnect();
        cardElement.removeEventListener("mousemove", handleMouseMove);
        cardElement.removeEventListener("mouseleave", handleMouseLeave);
        cardElement.removeEventListener("touchstart", handleTouchStart);
        cardElement.removeEventListener("touchmove", handleTouchMove);
        cardElement.removeEventListener("touchend", handleTouchEnd);
        if (animFrameIdRef.current) {
          cancelAnimationFrame(animFrameIdRef.current);
        }
        ctx.revert();
      };
    }

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      ctx.revert();
    };
  }, [revealHero]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#0a0a0a] flex items-center justify-center select-none"
    >
      {/* LAYER 0: Clean Full-Height Typography Marquees (Background) */}
      <div 
        ref={marqueesContainerRef}
        className="absolute inset-0 flex flex-col justify-evenly items-center pointer-events-none select-none z-0 py-2 sm:py-4 overflow-hidden h-full will-change-transform"
        style={{ 
          opacity: 0,
        }}
      >
        {HERO_ROWS.map((row, i) => {
          return (
            <div
              key={row.id}
              ref={(el) => { rowContainerRefs.current[i] = el; }}
              className="group w-full overflow-hidden flex flex-row pointer-events-auto cursor-pointer will-change-transform opacity-[0.14] md:opacity-[0.10] hover:opacity-[0.38] md:hover:opacity-[0.25] transition-opacity duration-500"
              onMouseEnter={() => handleRowEnter(i)}
              onMouseLeave={() => handleRowLeave(i)}
              onTouchStart={() => handleRowEnter(i)}
              onTouchEnd={() => handleRowLeave(i)}
            >
              <div
                ref={(el) => { rowRefs.current[i] = el; }}
                className="flex flex-row w-max shrink-0 will-change-transform"
              >
                {/* Block 1 */}
                <div 
                  className="display-heavy whitespace-nowrap text-[8.5vw] sm:text-[5.5vw] md:text-[4vw] lg:text-[3.2vw] tracking-tighter text-[#f5f5f7] flex items-center gap-6 sm:gap-10 pr-6 sm:pr-10 shrink-0 leading-none select-none"
                >
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                </div>
                {/* Block 2 (Exact Duplicate) */}
                <div 
                  className="display-heavy whitespace-nowrap text-[8.5vw] sm:text-[5.5vw] md:text-[4vw] lg:text-[3.2vw] tracking-tighter text-[#f5f5f7] flex items-center gap-6 sm:gap-10 pr-6 sm:pr-10 shrink-0 leading-none select-none"
                  aria-hidden="true"
                >
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                  <span>{row.word}</span>
                  <span className="text-white/25">•</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LAYER 1: Centered fixed-size Design Showreel Canvas (Middle) */}
      <div 
        ref={parallaxWrapperRef}
        className="relative z-10 flex items-center justify-center my-auto mx-auto"
      >
        <div
          ref={showreelCardRef}
          onClick={(e) => {
            playLiquidSplash(0.45);
            const rect = e.currentTarget.getBoundingClientRect();
            triggerFullRevealBurst(e.clientX - rect.left, e.clientY - rect.top);
          }}
          className="relative w-[270px] h-[390px] sm:w-[320px] sm:h-[460px] md:w-[400px] md:h-[550px] cursor-pointer group"
          style={{ perspective: "1000px", opacity: 0 }}
        >
          <div
            ref={showreelInnerRef}
            className="relative w-full h-full bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)] transition-all duration-300 group-hover:border-white/30"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Pure undisturbed card background portrait image */}
            <img
              ref={imageRef}
              src={navoImg}
              alt="Navodith"
              className="w-full h-full object-cover object-center grayscale contrast-[1.15] brightness-[0.85] opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-[1.2s] ease-out"
              referrerPolicy="no-referrer"
            />
            {/* Liquid Reveal Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none z-10 transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
          </div>

          {/* Discreet indicator taking zero layout space - Mobile view only & vertical */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              triggerFullRevealBurst();
            }}
            className="absolute -right-6 sm:-right-8 top-1/2 -translate-y-1/2 md:hidden text-white/35 hover:text-white/80 text-[8px] sm:text-[9px] font-mono tracking-[0.25em] uppercase select-none cursor-pointer transition-colors py-1 whitespace-nowrap z-20"
            style={{ writingMode: 'vertical-rl' }}
          >
            <span>SHAKE OR TAP TO REVEAL</span>
          </div>
        </div>
      </div>

      {/* LAYER 2: Monospace Corner Metadata Elements (Foreground) */}
      <div 
        ref={metadataRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-8 md:p-12 font-mono text-[10px] sm:text-xs tracking-widest text-white/50"
        style={{ opacity: 0 }}
      >
        
        {/* Top edge metadata placeholder to preserve spacing */}
        <div className="h-16 w-full pointer-events-none"></div>

        {/* Bottom edge metadata */}
        <div className="flex justify-between items-end w-full pointer-events-auto">
          {/* Left Metadata info */}
          <div className="flex flex-col gap-0.5 text-left">
            <span>CREATIVE DEVELOPER & DESIGNER</span>
            <span className="text-white/30">EDITION // 2026</span>
          </div>

          {/* Scroll Down Visualizer */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 bg-white/5 animate-bounce">
              <ArrowDown size={14} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(HeroComponent);
