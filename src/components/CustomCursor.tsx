import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

function CustomCursorComponent() {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isTouch = 
      typeof window !== "undefined" &&
      ("ontouchstart" in window ||
       navigator.maxTouchPoints > 0 ||
       (window.matchMedia && window.matchMedia("(any-pointer: coarse)").matches));

    if (isTouch) return;

    const dot = cursorDotRef.current;
    const ring = cursorRingRef.current;

    if (!dot || !ring) return;

    // Center positions initially
    gsap.set(dot, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    gsap.set(ring, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });

    // High-performance hardware-accelerated quickTo instances
    const dotXTo = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power2.out" });
    const dotYTo = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power2.out" });
    const ringXTo = gsap.quickTo(ring, "x", { duration: 0.25, ease: "power3.out" });
    const ringYTo = gsap.quickTo(ring, "y", { duration: 0.25, ease: "power3.out" });

    const moveCursor = (e: MouseEvent) => {
      dotXTo(e.clientX);
      dotYTo(e.clientY);
      ringXTo(e.clientX);
      ringYTo(e.clientY);
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });

    // Interactive element detection
    let isHoveringInteractive = false;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInteractive = Boolean(
        target.closest("a, button, [role='button'], .interactive-hover")
      );

      if (isInteractive && !isHoveringInteractive) {
        isHoveringInteractive = true;
        gsap.to(ring, {
          scale: 1.8,
          borderColor: "#ffffff",
          backgroundColor: "rgba(255, 255, 255, 0.12)",
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(dot, {
          scale: 0.4,
          backgroundColor: "#ffffff",
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      } else if (!isInteractive && isHoveringInteractive) {
        isHoveringInteractive = false;
        gsap.to(ring, {
          scale: 1,
          borderColor: "rgba(245, 245, 247, 0.35)",
          backgroundColor: "transparent",
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(dot, {
          scale: 1,
          backgroundColor: "#f5f5f7",
          duration: 0.2,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mouseover", handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <>
      {/* Small crisp pointer */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-[#f5f5f7] rounded-full pointer-events-none z-[10000] mix-blend-difference hidden md:block"
        style={{ willChange: "transform" }}
      />
      {/* Sleek follow ring */}
      <div
        ref={cursorRingRef}
        className="fixed top-0 left-0 w-8 h-8 border border-[#f5f5f7]/35 rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{ willChange: "transform" }}
      />
    </>
  );
}

export default React.memo(CustomCursorComponent);
