import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { playPreloaderComplete } from "../utils/sound";

interface PreloaderProps {
  onComplete: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let start = 0;
    const end = 100;
    const duration = 1200; // Fast, lightweight preloader
    const stepTime = 30; // 30ms intervals for smooth, non-blocking rendering
    const increment = Math.ceil(end / (duration / stepTime));

    const timer = setInterval(() => {
      start = Math.min(start + increment, end);
      setProgress(start);

      if (start >= end) {
        clearInterval(timer);
        playPreloaderComplete(0.35);
        
        // Trigger high-end page entry exit animation
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({
            onComplete: onComplete,
          });
          
          tl.to(textRef.current, {
            opacity: 0,
            y: -40,
            duration: 0.4,
            ease: "power3.in",
          })
          .to(containerRef.current, {
            yPercent: -100,
            duration: 0.7,
            ease: "power4.inOut",
          }, "-=0.15");
        });
      }
    }, stepTime);

    return () => clearInterval(timer);
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
          {String(progress).padStart(3, "0")}
        </h1>
        <div className="w-56 h-[2px] bg-white/5 relative overflow-hidden rounded-full">
          <div
            className="h-full bg-white transition-all duration-75 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[8px] tracking-[0.4em] text-white/40 mt-2 uppercase">
          LOADING PORTFOLIO
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
