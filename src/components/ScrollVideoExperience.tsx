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

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container) return;

    // Ensure video plays on mobile
    video.play().catch(() => {});

    let duration = video.duration || 7.52;
    const handleLoadedMetadata = () => {
      duration = video.duration || 7.52;
      ScrollTrigger.refresh();
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    let targetTime = 0;
    let currentTime = 0;
    let rafId: number;

    const renderLoop = () => {
      if (video.readyState >= 2) {
        currentTime += (targetTime - currentTime) * 0.1;
        if (Math.abs(currentTime - video.currentTime) > 0.005) {
          video.currentTime = Math.min(Math.max(currentTime, 0), duration - 0.03);
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
      scrub: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
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
    });

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      st.kill();
    };
  }, []);

  const currentData = STAGES[activeStage];

  return (
    <section 
      ref={containerRef} 
      className="relative w-full h-[100dvh] bg-black overflow-hidden select-none"
    >
      <div className="relative w-full h-full">
        {/* Pure 100% Raw Video Frame Scrubber - No overlay filters or transparent background layers */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={cinematicVideo}
            muted
            playsInline
            autoPlay
            loop
            preload="auto"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Minimal cinematic editorial corner metadata with crisp text shadow for readability */}
        <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-6 sm:p-10 md:p-14 font-mono text-xs tracking-widest text-white">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
              <span className="text-white font-mono text-[11px] tracking-[0.25em] uppercase [text-shadow:_0_2px_8px_rgba(0,0,0,0.9),_0_4px_16px_rgba(0,0,0,0.8)]">
                {currentData.prefix}
              </span>
            </div>
            <div className="text-[11px] text-white font-mono tracking-widest [text-shadow:_0_2px_8px_rgba(0,0,0,0.9),_0_4px_16px_rgba(0,0,0,0.8)]">
              0{activeStage + 1} / 03
            </div>
          </div>

          <div className="flex justify-between items-end w-full">
            <p className="text-[11px] sm:text-xs text-white font-mono tracking-wider max-w-xs uppercase [text-shadow:_0_2px_8px_rgba(0,0,0,0.9),_0_4px_16px_rgba(0,0,0,0.8)]">
              {currentData.sub}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 h-[2px] bg-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.9)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-150 ease-out" 
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center Main Stage Single Large Headline with Strong Drop Shadows and Clean Sizing */}
        <div className="relative z-10 w-full h-full flex items-center justify-center pointer-events-none px-4 sm:px-8 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStage}
              className="w-full flex flex-col items-center justify-center text-center overflow-hidden px-2"
            >
              <div className="overflow-hidden py-3 sm:py-4 w-full flex justify-center">
                <motion.h1
                  initial={{ y: "115%", rotateX: -25, opacity: 0 }}
                  animate={{ y: "0%", rotateX: 0, opacity: 1 }}
                  exit={{ y: "-115%", rotateX: 25, opacity: 0 }}
                  transition={{
                    duration: 0.75,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    fontFamily: 'var(--font-display, "Syne", sans-serif)',
                    transformPerspective: 1000,
                  }}
                  className="whitespace-nowrap text-3xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[6vw] font-extrabold tracking-tight text-white uppercase leading-[0.95] select-none [text-shadow:_0_4px_24px_rgba(0,0,0,0.95),_0_12px_48px_rgba(0,0,0,0.9),_0_24px_72px_rgba(0,0,0,0.85)] drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
                >
                  {currentData.title}
                </motion.h1>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
