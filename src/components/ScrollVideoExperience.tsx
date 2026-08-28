import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "motion/react";
import cinematicVideo from "../Video_20260826_225908_127.mp4";

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    prefix: "01 // VISION",
    title: "LET'S BUILD",
    sub: "Crafting digital experiences with precision & purpose"
  },
  {
    prefix: "02 // INNOVATION",
    title: "CREATE NEXT",
    sub: "Pushing the boundaries of interactive design"
  },
  {
    prefix: "03 // IMPACT",
    title: "SHAPE TOMORROW",
    sub: "Transforming ambitious ideas into living realities"
  }
];

export default function ScrollVideoExperience() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isVideoLoaded, setIsVideoLoaded] = useState<boolean>(false);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    let duration = 7.52;

    const onReady = () => {
      duration = video.duration || 7.52;
      setIsVideoLoaded(true);
      // Force initial frame decode for mobile
      if (video.currentTime === 0) {
        try {
          video.currentTime = 0.001;
        } catch {}
      }
      ScrollTrigger.refresh();
    };

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("loadeddata", onReady);

    // Initial trigger if cached
    if (video.readyState >= 1) {
      onReady();
    } else {
      video.load();
    }

    let targetTime = 0;
    let currentTime = 0;
    let rafId: number;

    // Ultra-smooth high-performance interpolation for mobile & desktop video scrubbing
    const renderLoop = () => {
      if (video.readyState >= 1) {
        currentTime += (targetTime - currentTime) * 0.18;
        const diff = Math.abs(currentTime - video.currentTime);
        
        // Seek only when difference is perceptible and browser is not actively locked in a seek
        if (diff > 0.003 && !video.seeking) {
          const clamped = Math.min(Math.max(currentTime, 0.001), Math.max(0.001, duration - 0.03));
          if ("fastSeek" in video && typeof (video as any).fastSeek === "function") {
            try {
              (video as any).fastSeek(clamped);
            } catch {
              video.currentTime = clamped;
            }
          } else {
            video.currentTime = clamped;
          }
        }
      }
      rafId = requestAnimationFrame(renderLoop);
    };
    rafId = requestAnimationFrame(renderLoop);

    const st = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "+=300%",
      pin: true,
      pinSpacing: true,
      scrub: 0.6,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = Math.max(0, Math.min(1, self.progress));
        setProgress(p);
        targetTime = p * duration;

        if (p < 0.33) {
          setActiveStage(0);
        } else if (p < 0.67) {
          setActiveStage(1);
        } else {
          setActiveStage(2);
        }
      },
      onLeave: () => {
        targetTime = duration - 0.03;
        setProgress(1);
        setActiveStage(2);
      },
      onEnterBack: () => {
        targetTime = duration - 0.03;
        setProgress(1);
        setActiveStage(2);
      }
    });

    // Handle orientation & resize
    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("loadeddata", onReady);
      st.kill();
    };
  }, []);

  const currentData = STAGES[activeStage];

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-[100dvh] bg-black overflow-hidden select-none transform-gpu"
    >
      <div className="relative w-full h-full">
        {/* Pure 100% Raw Video Frame Scrubber - No overlay filters or transparent background layers */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={cinematicVideo}
            muted
            playsInline
            preload="auto"
            tabIndex={-1}
            aria-hidden="true"
            className="w-full h-full object-cover object-center transform-gpu"
          />
        </div>

        {/* Minimal cinematic editorial corner metadata with safe-zone top padding for mobile navbar */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between pt-24 sm:pt-14 pb-8 sm:pb-12 px-5 sm:px-10 md:px-14 font-mono text-xs tracking-widest text-white">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-white font-mono text-[10px] sm:text-[11px] tracking-[0.2em] sm:tracking-[0.25em] uppercase [text-shadow:_0_2px_8px_rgba(0,0,0,0.9),_0_4px_16px_rgba(0,0,0,0.8)]">
                {currentData.prefix}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-white font-mono tracking-widest [text-shadow:_0_2px_8px_rgba(0,0,0,0.9),_0_4px_16px_rgba(0,0,0,0.8)]">
              0{activeStage + 1} / 03
            </div>
          </div>

          <div className="flex justify-between items-end w-full">
            <p className="text-[10px] sm:text-xs text-white font-mono tracking-wider max-w-[180px] sm:max-w-xs uppercase [text-shadow:_0_2px_8px_rgba(0,0,0,0.9),_0_4px_16px_rgba(0,0,0,0.8)]">
              {currentData.sub}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-20 sm:w-32 h-[2px] bg-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.9)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-150 ease-out" 
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Main Stage Single Large Headline - Responsive fluid typography so text never gets cut off */}
        <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none px-4 sm:px-8 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              className="w-full flex flex-col items-center justify-center text-center overflow-hidden px-2"
            >
              <div className="overflow-hidden py-2 sm:py-4 w-full flex justify-center items-center">
                <motion.h1
                  initial={{ y: "115%", rotateX: -25, opacity: 0 }}
                  animate={{ y: "0%", rotateX: 0, opacity: 1 }}
                  exit={{ y: "-115%", rotateX: 25, opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    fontFamily: 'var(--font-display, "Syne", sans-serif)',
                    transformPerspective: 1000,
                  }}
                  className="text-[clamp(1.75rem,6.4vw,5.5rem)] font-extrabold tracking-tight text-white uppercase leading-none select-none sm:whitespace-nowrap max-w-full [text-shadow:_0_4px_24px_rgba(0,0,0,0.95),_0_12px_48px_rgba(0,0,0,0.9),_0_24px_72px_rgba(0,0,0,0.85)] drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                >
                  {currentData.title}
                </motion.h1>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center gap-1.5 sm:gap-2 text-white select-none">
          <span className="font-mono text-[9px] sm:text-[10px] tracking-[0.25em] sm:tracking-[0.3em] uppercase text-white/90 [text-shadow:_0_2px_8px_rgba(0,0,0,0.95)]">
            SCROLL DOWN
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-4 h-7 sm:w-5 sm:h-9 rounded-full border border-white/60 flex items-start justify-center p-1 shadow-[0_2px_12px_rgba(0,0,0,0.9)] bg-black/30 backdrop-blur-xs"
          >
            <motion.div
              animate={{ y: [0, 8, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-1 h-1.5 sm:w-1 sm:h-2 bg-orange-500 rounded-full shadow-[0_0_6px_rgba(249,115,22,0.9)]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
