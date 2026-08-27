import React, { useEffect, useState, useRef, memo } from "react";
import { gsap } from "gsap";
import { Menu, X, ArrowUpRight, Compass, Eye, Sparkles, Globe, Clock, MessageSquare, Volume2, VolumeX } from "lucide-react";
import { playHoverTick, playClickPop, playMenuOpen, playMenuClose, isMuted, toggleMute } from "../utils/sound";

interface NavigationProps {
  isParentLoading?: boolean;
  onLogoGlideStart?: () => void;
  onLogoGlideComplete?: () => void;
}

// Isolated lightweight live clock component so Navigation never re-renders every 1s
const NavLiveClock = memo(function NavLiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      };
      setTime(new Intl.DateTimeFormat("en-US", options).format(new Date()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{time}</>;
});

export default function Navigation({ isParentLoading = true, onLogoGlideStart, onLogoGlideComplete }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRightRef = useRef<HTMLDivElement>(null);

  // Sync initial mute state
  useEffect(() => {
    setSoundMuted(isMuted());
  }, []);

  const handleSoundToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = toggleMute();
    setSoundMuted(nextMuted);
    if (!nextMuted) {
      playClickPop(0.4, 1.2);
    }
  };

  // Logo centering and entry animation sequence after preloader finishes
  useEffect(() => {
    const logo = logoRef.current;
    const rightSide = navRightRef.current;

    if (!logo || !rightSide) return;

    if (isParentLoading) {
      // Hide logo and menu triggers initially during the loading screen
      gsap.set(rightSide, { opacity: 0 });
      gsap.set(logo, { opacity: 0 });
    } else {
      // Small timeout to ensure document is fully parsed and rendered to avoid layout shifts
      const initAnim = () => {
        // Temporarily reset position to get its original/intended top-left header position
        gsap.set(logo, { x: 0, y: 0, scale: 1, opacity: 0 });
        
        const rect = logo.getBoundingClientRect();
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Calculate the vector offsets from the natural header position to screen center
        const logoCenterX = rect.left + rect.width / 2;
        const logoCenterY = rect.top + rect.height / 2;
        
        const offsetX = centerX - logoCenterX;
        const offsetY = centerY - logoCenterY;

        const isMobile = window.innerWidth < 640;
        const initialScale = isMobile ? 1.6 : 2.8;

        // Position the logo in the exact center, scale it appropriately so it fits nicely
        gsap.set(logo, {
          x: offsetX,
          y: offsetY,
          scale: initialScale,
          opacity: 0,
        });

        const tl = gsap.timeline();

        // 1. Smoothly fade in the centered, enlarged logo
        tl.to(logo, {
          opacity: 1,
          duration: 0.9,
          ease: "power2.out",
        })
        // 2. Short dramatic holding pause
        .to({}, { duration: 0.5 })
        // 3. Majestically glide up and scale down back into the natural header position
        .to(logo, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.3,
          ease: "power4.inOut",
          onStart: () => {
            if (onLogoGlideStart) {
              onLogoGlideStart();
            }
          },
          onComplete: () => {
            if (onLogoGlideComplete) {
              onLogoGlideComplete();
            }
          }
        })
        // 4. Stagger fade-in the navigation links & Index trigger button
        .to(rightSide, {
          opacity: 1,
          duration: 0.8,
          ease: "power2.out",
        }, "-=0.25");
      };

      // Run animation on next frame to guarantee perfect client bounds calculation
      requestAnimationFrame(initAnim);
    }
  }, [isParentLoading]);

  // GSAP animation for opening and closing overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    if (isOpen) {
      // Open Animation
      gsap.killTweensOf(overlay);
      gsap.fromTo(
        overlay,
        { yPercent: -100, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power4.out",
          onStart: () => {
            overlay.style.visibility = "visible";
          },
        }
      );

      // Stagger items
      if (menuItemsRef.current) {
        const items = menuItemsRef.current.querySelectorAll(".menu-item-anim");
        gsap.killTweensOf(items);
        gsap.fromTo(
          items,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.08,
            ease: "power3.out",
            delay: 0.3,
          }
        );
      }
    } else {
      // Close Animation
      gsap.killTweensOf(overlay);
      gsap.to(overlay, {
        yPercent: -100,
        opacity: 0,
        duration: 0.75,
        ease: "power4.inOut",
        onComplete: () => {
          overlay.style.visibility = "hidden";
        },
      });
    }
  }, [isOpen]);

  const toggleMenu = () => {
    if (!isOpen) {
      playMenuOpen(0.35);
    } else {
      playMenuClose(0.28);
    }
    setIsOpen(!isOpen);
  };

  const handleLinkClick = (id: string) => {
    playClickPop(0.35, 1.1);
    if (isOpen) {
      playMenuClose(0.25);
    }
    setIsOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }, 400); // Wait for close animation
  };

  const menuLinks = [
    { number: "01", label: "HOME", id: "hero", desc: "Digital Showreel & Matrix" },
    { number: "02", label: "PHILOSOPHY", id: "about", desc: "Core Values & Capability Sheet" },
    { number: "03", label: "SELECTED CRAFT", id: "works", desc: "High-Discipline Products Archive" },
    { number: "04", label: "CONNECT", id: "contact", desc: "Let's Craft the Future" },
  ];

  return (
    <>
      {/* ========================================================== */}
      {/* HEADER BAR: Sleek, Floating Minimalist Navigation */}
      {/* ========================================================== */}
      <header className="fixed top-0 left-0 w-full z-[9800] px-6 sm:px-8 md:px-12 py-6 sm:py-8 flex justify-between items-center bg-gradient-to-b from-[#0a0a0a]/85 to-transparent backdrop-blur-[2px] transition-all duration-300">
        {/* Left Side: Logo */}
        <a 
          ref={logoRef}
          href="#hero" 
          onMouseEnter={() => playHoverTick(0.18, 1.2)}
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick("hero");
          }}
          className="font-display font-black text-lg sm:text-xl text-white tracking-tight flex items-center gap-1 group relative z-[9905]"
          style={{ opacity: 0 }}
        >
          <span>NAVODITH</span>
          <span className="w-1.5 h-1.5 bg-white rounded-full translate-y-1 transition-transform duration-300 group-hover:scale-150 group-hover:bg-amber-400" />
        </a>

        {/* Right Side: Navigation links, Sound control, and mobile INDEX trigger */}
        <div ref={navRightRef} className="flex items-center gap-6 sm:gap-8 relative z-[9905]" style={{ opacity: 0 }}>
          {/* Desktop navigation links */}
          <nav className="hidden md:flex items-center gap-10 font-mono text-[10px] tracking-widest text-white/45 uppercase">
            <button 
              onMouseEnter={() => playHoverTick(0.15, 1.0)}
              onClick={() => handleLinkClick("about")} 
              className="hover:text-white transition-colors duration-300 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
            >
              Philosophy
            </button>
            <button 
              onMouseEnter={() => playHoverTick(0.15, 1.05)}
              onClick={() => handleLinkClick("works")} 
              className="hover:text-white transition-colors duration-300 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
            >
              Selected Craft
            </button>
            <button 
              onMouseEnter={() => playHoverTick(0.15, 1.1)}
              onClick={() => handleLinkClick("contact")} 
              className="hover:text-white transition-colors duration-300 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-white hover:after:w-full after:transition-all after:duration-300 cursor-pointer"
            >
              Connect
            </button>
          </nav>

          {/* Global Sound FX Toggle Button with Animated Waveform */}
          <button
            onClick={handleSoundToggle}
            onMouseEnter={() => playHoverTick(0.15, 1.2)}
            title={soundMuted ? "Unmute Audio Effects" : "Mute Audio Effects"}
            aria-label={soundMuted ? "Unmute sound effects" : "Mute sound effects"}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-300 font-mono text-[9px] tracking-widest uppercase cursor-pointer"
          >
            {soundMuted ? (
              <>
                <VolumeX size={12} className="text-white/40" />
                <span className="hidden sm:inline text-white/40">MUTED</span>
              </>
            ) : (
              <>
                <div className="flex items-end gap-[2px] h-3 w-3.5">
                  <span className="w-[2px] h-full bg-amber-400/90 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
                  <span className="w-[2px] h-2/3 bg-amber-400/90 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.2s]" />
                  <span className="w-[2px] h-4/5 bg-amber-400/90 rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.4s]" />
                  <span className="w-[2px] h-1/2 bg-amber-400/90 rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.1s]" />
                </div>
                <span className="hidden sm:inline text-white/80">SOUND ON</span>
              </>
            )}
          </button>

          {/* Mobile-only INDEX / MENU Trigger */}
          <button
            onClick={toggleMenu}
            onMouseEnter={() => playHoverTick(0.18, 1.15)}
            className="md:hidden interactive-hover h-10 px-5 rounded-md border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 flex items-center gap-3 font-mono text-xs text-white uppercase tracking-wider transition-all duration-300 cursor-pointer"
          >
            <span className="relative overflow-hidden h-4 w-12 hidden sm:inline-block">
              <span className={`absolute left-0 transition-transform duration-500 ease-out ${isOpen ? "-translate-y-full opacity-0" : "translate-y-0"}`}>
                INDEX
              </span>
              <span className={`absolute left-0 transition-transform duration-500 ease-out ${isOpen ? "translate-y-0" : "translate-y-full opacity-0"}`}>
                CLOSE
              </span>
            </span>
            <div className="relative w-4 h-3 flex flex-col justify-between items-end">
              <span className={`h-[1px] bg-white transition-all duration-300 ${isOpen ? "w-4 rotate-45 translate-y-1" : "w-4"}`} />
              <span className={`h-[1px] bg-white transition-all duration-300 ${isOpen ? "w-0 opacity-0" : "w-3"}`} />
              <span className={`h-[1px] bg-white transition-all duration-300 ${isOpen ? "w-4 -rotate-45 -translate-y-1" : "w-2"}`} />
            </div>
          </button>
        </div>
      </header>

      {/* ========================================================== */}
      {/* MENU OVERLAY: Fullscreen Editorial Curtain Drawer */}
      {/* ========================================================== */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9700] w-full h-screen bg-[#0c0c0c] text-white flex flex-col justify-between p-6 sm:p-8 md:p-12 pt-28 sm:pt-36 md:pt-40 select-none overflow-hidden"
        style={{ visibility: "hidden" }}
      >
        {/* Decorative Grid Lines Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="absolute top-1/3 left-0 w-full h-[1px] bg-white/5 pointer-events-none" />
        <div className="absolute left-1/3 top-0 h-full w-[1px] bg-white/5 pointer-events-none hidden lg:block" />

        <div className="max-w-7xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Side: Massive Typographic Menu Links (Cols 1-7) */}
          <div ref={menuItemsRef} className="lg:col-span-7 flex flex-col gap-4 sm:gap-6">
            <span className="font-mono text-[9px] text-white/30 tracking-[0.25em] uppercase border-b border-white/5 pb-2 max-w-xs">
              NAVIGATION MATRIX
            </span>

            <div className="flex flex-col gap-2 sm:gap-4">
              {menuLinks.map((link, idx) => {
                const isHovered = hoveredIdx === idx;
                const isDimmed = hoveredIdx !== null && hoveredIdx !== idx;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link.id)}
                    onMouseEnter={() => {
                      setHoveredIdx(idx);
                      playHoverTick(0.2, 1.0 + idx * 0.1);
                    }}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`menu-item-anim flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-left py-2 group transition-all duration-500 ease-out cursor-pointer ${
                      isDimmed ? "opacity-25 blur-[1px]" : "opacity-100"
                    }`}
                  >
                    {/* Index Code */}
                    <span className="font-mono text-xs text-white/35 group-hover:text-amber-400 transition-colors duration-300">
                      {link.number} //
                    </span>

                    {/* Massive Display Text */}
                    <div className="flex flex-col">
                      <span className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter uppercase leading-none group-hover:translate-x-3 transition-transform duration-300 relative">
                        {link.label}
                        <span className="absolute left-0 bottom-0 h-[2px] bg-white w-0 group-hover:w-full transition-all duration-300" />
                      </span>
                      <span className="font-mono text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest mt-1 sm:mt-2 group-hover:text-white/70 transition-colors duration-300">
                        {link.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Side: Interactive Aesthetic Board (Cols 8-12) */}
          <div className="lg:col-span-5 hidden lg:flex flex-col h-full justify-between border-l border-white/5 pl-12 py-10">
            {/* Live Camera Parallax-inspired interactive display */}
            <div className="relative flex-1 w-full flex items-center justify-center group/panel">
              <div className="absolute w-56 h-56 rounded-full border border-white/5 flex items-center justify-center animate-[spin_50s_linear_infinite] group-hover/panel:border-white/20 transition-colors duration-500">
                <div className="w-48 h-48 rounded-full border border-dashed border-white/5" />
                <Compass className="absolute text-white/5 group-hover/panel:text-white/25 transition-all duration-500 group-hover/panel:scale-110" size={32} />
              </div>

              {/* Holographic Wireframe Grid Box */}
              <div className="w-40 h-40 border border-white/10 relative overflow-hidden bg-white/[0.01] rounded shadow-2xl backdrop-blur-md flex flex-col justify-between p-4 group-hover/panel:border-white/30 transition-all duration-500">
                <div className="flex justify-between text-[8px] font-mono text-white/30">
                  <span>SYSTEM_MTRX</span>
                  <span>v1.08</span>
                </div>
                <div className="my-auto flex flex-col gap-1 items-center">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                    <span className="w-1.5 h-1.5 bg-white/20 rounded-full" />
                  </div>
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">ALIGNMENT OK</span>
                </div>
                <div className="flex justify-between items-baseline text-[8px] font-mono text-white/30">
                  <span>SYS_ID: 914E</span>
                  <span>IST // <NavLiveClock /></span>
                </div>
              </div>
            </div>

            {/* Micro Details and Info Grid */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5 font-mono text-[10px] text-white/40 tracking-wider">
              <div className="flex flex-col gap-1.5">
                <span className="text-white/20 uppercase text-[9px] tracking-widest">COORDINATES</span>
                <span className="text-white/70 flex items-center gap-1">
                  <Globe size={10} className="text-emerald-500" />
                  12.9716° N, 77.5946° E
                </span>
                <span className="text-white/50">BANGALORE, INDIA</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-white/20 uppercase text-[9px] tracking-widest">LOCAL TIME</span>
                <span className="text-white/70 flex items-center gap-1">
                  <Clock size={10} className="text-amber-400" />
                  <NavLiveClock /> IST
                </span>
                <span className="text-white/50">REAL-TIME TELEMETRY</span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer Area of Overlay Menu */}
        <div className="max-w-7xl mx-auto w-full border-t border-white/10 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 font-mono text-[10px] tracking-widest text-white/35 uppercase">
          <div className="flex gap-8">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
              LINKEDIN
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
              TWITTER
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200">
              GITHUB
            </a>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={10} className="text-white/30" />
            <span>NAVODITH © 2026 • DESIGNED FOR INTEGRATION</span>
          </div>
        </div>
      </div>
    </>
  );
}
