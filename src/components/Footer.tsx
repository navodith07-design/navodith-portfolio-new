import React, { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp, Mail, Check, Copy } from "lucide-react";
import { playHarmonicChime, playHoverTick, playWhoosh, playClickPop } from "../utils/sound";
import ParticleText from "./ParticleText";

gsap.registerPlugin(ScrollTrigger);

function FooterComponent() {
  const footerRef = useRef<HTMLElement>(null);
  const emailButtonRef = useRef<HTMLAnchorElement>(null);
  const [copied, setCopied] = useState(false);

  const text = "LET'S CRAFT THE FUTURE";

  const handleCopyEmail = (e: React.MouseEvent) => {
    navigator.clipboard?.writeText("navodith07@gmail.com").catch(() => {});
    setCopied(true);
    playHarmonicChime(0.4);
    setTimeout(() => setCopied(false), 2500);
  };

  // Silky smooth overlapping entrance over the previous section
  useEffect(() => {
    const footerEl = footerRef.current;
    if (!footerEl) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        footerEl,
        { y: 50 },
        {
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: footerEl,
            start: "top 95%",
            end: "top 60%",
            scrub: 0.6,
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, []);

  // Magnetic button effect on the massive email CTA button using GSAP
  useEffect(() => {
    const btn = emailButtonRef.current;
    if (!btn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Attract button coordinates up to 24px towards cursor
      gsap.to(btn, {
        x: x * 0.45,
        y: y * 0.45,
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)",
      });
    };

    btn.addEventListener("mousemove", handleMouseMove);
    btn.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      btn.removeEventListener("mousemove", handleMouseMove);
      btn.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const scrollToTop = () => {
    playWhoosh(0.3);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer
      ref={footerRef}
      id="contact"
      className="relative z-40 w-full min-h-screen bg-[#0a0a0a] text-[#f5f5f7] pt-24 pb-16 px-6 sm:px-8 md:px-12 rounded-t-[36px] sm:rounded-t-[54px] -mt-12 sm:-mt-20 border-t border-white/15 shadow-[0_-40px_120px_rgba(0,0,0,0.98)] flex flex-col justify-between overflow-hidden"
    >
      {/* Specular Ambient Edge Light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-center items-center gap-10 sm:gap-14">
        
        {/* Section Metadata Title */}
        <span className="font-mono text-xs tracking-[0.25em] text-white/40 uppercase self-start">
          CONNECT
        </span>

        {/* Massive Dynamic Contact Callout with ParticleText */}
        <div className="w-full text-center flex flex-col items-center max-w-5xl gap-6 my-auto select-none">
          <h2
            className="w-full flex items-center justify-center cursor-pointer min-h-[180px] sm:min-h-[220px] md:min-h-[260px]"
          >
            <ParticleText
              text={text}
              particleSize={2.2}
              density={4}
              color="#f8fafc"
              highlightColor="#646365"
              scatter={190}
              gatherDuration={1600}
              stagger={420}
              pointerRepel={42}
              repelRadius={120}
              idleDrift={0.8}
              trigger="view"
              fontSize="clamp(2.4rem, 6.2vw, 5.2rem)"
              fontWeight={800}
              fontFamily="inherit"
              glow={true}
              className="w-full h-full min-h-[180px] sm:min-h-[220px] md:min-h-[260px]"
            />
          </h2>
          <p className="font-sans text-sm md:text-base text-white/50 max-w-lg mx-auto -mt-2">
            Seeking collaborations, custom UI/UX design systems, interaction consultations, or advanced digital product engineering.
          </p>

          {/* Magnetic High-Contrast Email CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
            <a
              ref={emailButtonRef}
              href="mailto:navodith07@gmail.com"
              onMouseEnter={() => playHoverTick(0.2, 1.1)}
              onClick={() => playClickPop(0.35, 1.0)}
              className="interactive-hover inline-flex items-center gap-3 bg-white text-[#0a0a0a] font-mono font-bold text-xs uppercase px-8 py-5 rounded-full shadow-2xl transition-all duration-300 hover:shadow-white/10"
            >
              <Mail size={14} />
              <span>navodith07@gmail.com</span>
            </a>
            <button
              onClick={handleCopyEmail}
              onMouseEnter={() => playHoverTick(0.15, 1.2)}
              className="px-5 py-4 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white/70 hover:text-white font-mono text-[11px] uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-amber-400" />
                  <span className="text-amber-400 font-bold">COPIED</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>COPY EMAIL</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Nav & Signature Matrix */}
      <div className="max-w-7xl mx-auto w-full border-t border-white/10 pt-10 mt-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center justify-between font-mono text-[10px] sm:text-xs text-white/40 tracking-wider">
          
          {/* Copyright Signature (Cols 1-6) */}
          <div className="md:col-span-6 flex flex-col gap-1 text-left">
            <span className="font-bold text-white uppercase tracking-widest">NAVODITH DESIGN INC.</span>
            <span>EXPERIENCE CRAFTED IN INDIA // © 2026</span>
          </div>

          {/* Back to top (Cols 7-12) */}
          <div className="md:col-span-6 md:justify-self-end text-left md:text-right">
            <button
              onClick={scrollToTop}
              onMouseEnter={() => playHoverTick(0.18, 1.2)}
              className="interactive-hover group inline-flex items-center gap-2 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <span>BACK TO SUMMIT</span>
              <div className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center text-white/50 group-hover:bg-white group-hover:text-[#0a0a0a] group-hover:border-white transition-all duration-300">
                <ArrowUp size={12} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default React.memo(FooterComponent);
