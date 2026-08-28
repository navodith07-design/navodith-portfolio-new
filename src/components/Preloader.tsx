import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { playPreloaderComplete } from "../utils/sound";
import { preloadAllAssets } from "../utils/preloadAssets";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const targetProgressRef = useRef(15);
  const isFinishedRef = useRef(false);

  useEffect(() => {
    let current = 0;
    let isAssetsLoaded = false;
    const minLoadTime = 1200; // minimum duration for aesthetic brand intro
    const startTime = Date.now();

    // Start preloading all video & image assets
    preloadAllAssets((pct) => {
      // Map asset loading from 20% to 100%
      targetProgressRef.current = Math.max(targetProgressRef.current, Math.floor(pct));
    }).then(() => {
      isAssetsLoaded = true;
    });

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      // Gradually increment target progress
      if (!isAssetsLoaded) {
        if (targetProgressRef.current < 90) {
          targetProgressRef.current += Math.floor(Math.random() * 4 + 2);
        }
      } else {
        if (elapsed >= minLoadTime) {
          targetProgressRef.current = 100;
        } else {
          targetProgressRef.current = Math.min(99, Math.floor((elapsed / minLoadTime) * 100));
        }
      }

      // Smooth step towards target
      if (current < targetProgressRef.current) {
        current += Math.max(1, Math.ceil((targetProgressRef.current - current) * 0.35));
        current = Math.min(current, 100);
        setDisplayProgress(current);
      }

      if (current >= 100 && isAssetsLoaded && elapsed >= minLoadTime && !isFinishedRef.current) {
        isFinishedRef.current = true;
        clearInterval(interval);
        playPreloaderComplete(0.35);

        // Exit animation
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({
            onComplete: () => {
              onComplete();
              setTimeout(() => {
                ScrollTrigger.refresh(true);
              }, 150);
            },
          });

          tl.to(textRef.current, {
            opacity: 0,
            y: -40,
            duration: 0.35,
            ease: "power3.in",
          })
          .to(containerRef.current, {
            yPercent: -100,
            duration: 0.65,
            ease: "power4.inOut",
          }, "-=0.1");
        });
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#070707] z-[99999] flex flex-col justify-between p-8 sm:p-12 font-mono select-none"
    >
      {/* Top Header */}
      <div className="flex justify-between items-center text-[10px] tracking-[0.25em] text-white/30 uppercase">
        <span>NAVODITH DESIGN INC.</span>
        <span>© 2026</span>
      </div>

      {/* Center heavy counter */}
      <div ref={textRef} className="flex flex-col items-center justify-center my-auto gap-4">
        <h1 className="font-display text-[22vw] sm:text-[16vw] font-black tracking-tighter leading-none text-white select-none">
          {String(displayProgress).padStart(3, "0")}
        </h1>
        <div className="w-56 h-[2px] bg-white/5 relative overflow-hidden rounded-full">
          <div
            className="h-full bg-white transition-all duration-75 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <span className="text-[8px] tracking-[0.4em] text-white/40 mt-2 uppercase">
          PRE-BUFFERING ASSETS & SCROLL EXPERIENCE
        </span>
      </div>

      {/* Bottom Footer */}
      <div className="flex justify-between items-end text-[10px] tracking-widest text-white/20 uppercase">
        <div className="flex flex-col gap-1">
          <span>PORTFOLIO</span>
          <span>CREATIVE CRAFT</span>
        </div>
        <span>BANGALORE, KA</span>
      </div>
    </div>
  );
}
