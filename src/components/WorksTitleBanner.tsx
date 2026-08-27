import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import worksImg from "../WORKS.png";
import selectedProjectsImg from "../Selected projects.png";

interface WorksTitleBannerProps {
  className?: string;
  onEnterCallback?: () => void;
}

export default function WorksTitleBanner({ className = "", onEnterCallback }: WorksTitleBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const worksRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    const worksEl = worksRef.current;
    const scriptEl = scriptRef.current;
    const glowEl = glowRef.current;

    if (!container || !worksEl || !scriptEl) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: "top 80%",
          end: "top 30%",
          toggleActions: "play none none reverse",
          onEnter: () => {
            if (onEnterCallback) onEnterCallback();
          },
        },
      });

      // 1. Initial Hidden States
      gsap.set(worksEl, {
        opacity: 0,
        scale: 1.15,
        y: 35,
        filter: "blur(10px)",
        transformOrigin: "center center",
      });

      gsap.set(scriptEl, {
        opacity: 0,
        scale: 0.88,
        y: 20,
        rotate: -2,
        transformOrigin: "center center",
      });

      if (glowEl) {
        gsap.set(glowEl, { opacity: 0, scale: 0.7 });
      }

      // 2. Multi-Stage Choreographed Reveal
      tl.to(worksEl, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.1,
        ease: "power3.out",
      })
      .to(
        scriptEl,
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotate: 0,
          duration: 0.95,
          ease: "elastic.out(1, 0.7)",
        },
        "-=0.6"
      );

      if (glowEl) {
        tl.to(
          glowEl,
          {
            opacity: 0.5,
            scale: 1,
            duration: 1.3,
            ease: "power2.out",
          },
          "-=1.0"
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [onEnterCallback]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full flex items-center justify-center select-none py-10 sm:py-16 md:py-24 overflow-visible ${className}`}
    >
      {/* Background Subtle Atmosphere Glow */}
      <div
        ref={glowRef}
        className="absolute w-[55%] h-[160px] sm:h-[240px] bg-red-600/10 rounded-full blur-[80px] pointer-events-none -z-10"
      />

      {/* Main Canvas Overlay Wrapper */}
      <div className="relative w-full max-w-5xl px-4 sm:px-8 flex items-center justify-center">
        
        {/* LAYER 1: WORKS Image Asset (src/WORKS.png) */}
        <div
          ref={worksRef}
          className="w-full flex items-center justify-center"
          style={{ willChange: "transform, opacity, filter" }}
        >
          <img
            src={worksImg}
            alt="WORKS"
            className="w-full max-w-4xl h-auto object-contain select-none drop-shadow-[0_15px_40px_rgba(0,0,0,0.9)] pointer-events-none"
          />
        </div>

        {/* LAYER 2: Selected projects Image Asset (src/Selected projects.png) */}
        <div
          ref={scriptRef}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ willChange: "transform, opacity" }}
        >
          <img
            src={selectedProjectsImg}
            alt="Selected projects"
            className="w-[85%] max-w-3xl h-auto object-contain select-none drop-shadow-[0_6px_20px_rgba(249,43,43,0.4)] pointer-events-none"
          />
        </div>

      </div>
    </div>
  );
}
