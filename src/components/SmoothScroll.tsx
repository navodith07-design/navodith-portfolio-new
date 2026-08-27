import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollProps {
  children: React.ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = 
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
       navigator.maxTouchPoints > 0 ||
       (window.matchMedia && window.matchMedia("(any-pointer: coarse)").matches));

    if (isTouch) {
      // Use native smooth scrolling on mobile/touch to prevent any scroll interception
      return () => {};
    }

    // High-performance smooth desktop Lenis
    const lenis = new Lenis({
      duration: 0.9,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
    });

    lenis.on("scroll", ScrollTrigger.update);

    const rafHandler = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(rafHandler);
    gsap.ticker.lagSmoothing(500, 33);

    const resizeHandler = () => {
      lenis.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", resizeHandler, { passive: true });

    return () => {
      window.removeEventListener("resize", resizeHandler);
      gsap.ticker.remove(rafHandler);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full relative">
      {children}
    </div>
  );
}
