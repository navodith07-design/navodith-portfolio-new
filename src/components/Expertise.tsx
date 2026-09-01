import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  ArrowRight, 
  Command,
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  Layers, 
  Code2, 
  Box,
  Palette
} from "lucide-react";
import OptionWheel, { playTactileClick } from "./OptionWheel";
import ZeroGravityTools from "./ZeroGravityTools";
import { playHoverTick, playClickPop } from "../utils/sound";
import {
  FigmaIcon,
  FigJamIcon,
  FigmaMakeIcon,
  RelumeIcon,
  HtmlIcon,
  CssIcon,
  JsIcon,
  TailwindIcon,
  BootstrapIcon,
  JQueryIcon,
  GitHubIcon,
  GsapIcon,
  SplineIcon,
  CursorIcon,
  GoogleAiStudioIcon,
  GeminiIcon,
  ClaudeIcon,
  PhotoshopIcon,
  IllustratorIcon,
  AfterEffectsIcon
} from "./ToolIcons";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface Skill {
  id: string;
  number: string;
  title: string;
  category: string;
  description: string;
  bullets: string[];
}

export const SKILLS: Skill[] = [
  {
    id: "ux-ui-design",
    number: "01",
    title: "UX/UI Design",
    category: "EXPERIENCE & INTERFACE",
    description:
      "Designing clear, intuitive and responsive digital experiences from structure to final interface.",
    bullets: [
      "Information architecture",
      "Wireframing & UI design",
      "Responsive design",
      "Interaction design"
    ]
  },
  {
    id: "ux-research",
    number: "02",
    title: "UX Research",
    category: "INSIGHTS & WORKFLOWS",
    description:
      "Understanding users, workflows and requirements to guide better design decisions.",
    bullets: [
      "User & requirement analysis",
      "Workflow & journey mapping",
      "Usability evaluation",
      "Insight synthesis"
    ]
  },
  {
    id: "design-systems",
    number: "03",
    title: "Design Systems",
    category: "SCALABILITY & TOKENS",
    description:
      "Creating reusable UI patterns that keep digital products consistent and scalable.",
    bullets: [
      "Reusable component libraries",
      "Color, typography & spacing tokens",
      "Responsive design patterns",
      "Consistent UI foundations"
    ]
  },
  {
    id: "problem-solving",
    number: "04",
    title: "Problem Solving",
    category: "SYSTEMS THINKING",
    description:
      "Breaking complex problems into simple, usable experiences.",
    bullets: [
      "Problem definition",
      "Root-cause analysis",
      "Flow simplification",
      "Constraint-based decision making"
    ]
  },
  {
    id: "product-thinking",
    number: "05",
    title: "Product Thinking",
    category: "PRODUCT & USER VALUE",
    description:
      "Connecting user needs, business requirements and practical solutions.",
    bullets: [
      "Requirement analysis & problem framing",
      "User needs & business goal alignment",
      "Feature prioritization & flow definition",
      "Solution framing under constraints"
    ]
  },
  {
    id: "prototyping",
    number: "06",
    title: "Prototyping",
    category: "INTERACTIVE FLOWS",
    description:
      "Creating interactive prototypes to explore ideas, test flows and communicate product experiences.",
    bullets: [
      "High-fidelity interactive flows",
      "Rapid concept validation",
      "Interaction & motion prototypes",
      "Stakeholder demonstrations"
    ]
  },
  {
    id: "interaction-design",
    number: "07",
    title: "Interaction Design",
    category: "MOTION & RESPONSIVENESS",
    description:
      "Designing clear interactions, transitions and motion that make digital experiences feel intuitive and responsive.",
    bullets: [
      "Micro-interactions & transitions",
      "Interaction states & feedback",
      "Motion-driven UI flows",
      "Responsive interaction patterns"
    ]
  },
  {
    id: "visual-design",
    number: "08",
    title: "Visual Design",
    category: "HIERARCHY & CRAFT",
    description:
      "Creating clear visual hierarchy and polished interfaces through typography, layout, color and composition.",
    bullets: [
      "Typography & visual hierarchy",
      "Grid systems & layout composition",
      "Color & contrast",
      "Visual consistency & refinement"
    ]
  },
  {
    id: "design-to-code",
    number: "09",
    title: "Design-to-Code",
    category: "IMPLEMENTATION & PRECISION",
    description:
      "Translating design decisions into responsive interfaces while maintaining visual and interaction quality.",
    bullets: [
      "Developer-ready UI specifications",
      "HTML, CSS & JavaScript implementation",
      "Responsive layout development",
      "Design QA & production polish"
    ]
  },
  {
    id: "accessibility-aware-design",
    number: "10",
    title: "Accessibility-Aware Design",
    category: "INCLUSIVE INTERFACES",
    description:
      "Designing interfaces with readability, contrast and inclusive interaction patterns in mind.",
    bullets: [
      "Readable visual hierarchy",
      "Contrast-aware UI",
      "Keyboard-friendly interaction patterns",
      "Inclusive interface considerations"
    ]
  },
  {
    id: "ai-workflows",
    number: "11",
    title: "AI Workflows",
    category: "EXPLORATION & SPEED",
    description:
      "Using AI tools to accelerate exploration, prototyping, asset creation and design-to-code workflows.",
    bullets: [
      "AI-assisted ideation & exploration",
      "Prompt-driven workflows",
      "Rapid wireframing & prototyping",
      "Design-to-code exploration"
    ]
  }
];

export interface ToolItem {
  name: string;
  category: "design" | "dev" | "motion" | "ai";
  icon: React.FC<{ size?: number }>;
}

export const KNOWN_TOOLS: ToolItem[] = [
  // UI/UX & DESIGN
  { name: "Figma", category: "design", icon: FigmaIcon },
  { name: "FigJam", category: "design", icon: FigJamIcon },
  { name: "Figma Make", category: "design", icon: FigmaMakeIcon },
  { name: "Relume", category: "design", icon: RelumeIcon },

  // FRONTEND & CODE
  { name: "HTML", category: "dev", icon: HtmlIcon },
  { name: "CSS", category: "dev", icon: CssIcon },
  { name: "JavaScript", category: "dev", icon: JsIcon },
  { name: "Tailwind CSS", category: "dev", icon: TailwindIcon },
  { name: "Bootstrap", category: "dev", icon: BootstrapIcon },
  { name: "jQuery", category: "dev", icon: JQueryIcon },
  { name: "GitHub", category: "dev", icon: GitHubIcon },

  // MOTION & 3D
  { name: "GSAP", category: "motion", icon: GsapIcon },
  { name: "Spline", category: "motion", icon: SplineIcon },

  // AI & CREATIVE
  { name: "Cursor", category: "ai", icon: CursorIcon },
  { name: "Google AI Studio", category: "ai", icon: GoogleAiStudioIcon },
  { name: "Gemini", category: "ai", icon: GeminiIcon },
  { name: "Claude", category: "ai", icon: ClaudeIcon },
  { name: "Photoshop", category: "ai", icon: PhotoshopIcon },
  { name: "Illustrator", category: "ai", icon: IllustratorIcon },
  { name: "After Effects", category: "ai", icon: AfterEffectsIcon }
];

function ExpertiseComponent() {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const selectedSkill = SKILLS[selectedIndex];
  const itemLabels = SKILLS.map((skill) => skill.title);

  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // GSAP ScrollTrigger for Ultra-Smooth Horizontal Pinning (Desktop) & Scroll-to-Spin (Mobile)
  useEffect(() => {
    if (!sectionRef.current || !trackRef.current) return;

    const ctx = gsap.context(() => {
      const track = trackRef.current;
      if (!track) return;

      const getScrollAmount = () => {
        return track.scrollWidth - window.innerWidth;
      };

      const mobile = window.innerWidth < 768;
      if (mobile) {
        // On mobile, let page scroll naturally through the section; skills wheel is interacted with directly
        return;
      }

      const pinDistance = Math.max(window.innerHeight * 1.4, 1200);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${pinDistance}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            setCurrentSlide(self.progress > 0.5 ? 1 : 0);
          },
        },
      });

      // Buffer at start
      tl.to({}, { duration: 0.15 });

      // Smooth horizontal pan on desktop
      tl.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        force3D: true,
        duration: 0.8,
      });

      // Buffer at end
      tl.to({}, { duration: 0.15 });

    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="expertise"
      ref={sectionRef}
      className="relative w-full min-h-screen bg-[#eae7e1] text-[#0f0f0f] py-6 sm:py-10 border-t border-black/10 select-none overflow-hidden flex flex-col justify-between"
    >
      {/* TOP HEADER & SLIDE INDICATORS */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4 sm:mb-6 shrink-0 z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 bg-black" />
            <span className="font-mono text-xs tracking-[0.25em] text-black/50 uppercase">
              CAPABILITIES & KNOWLEDGE
            </span>
          </div>
          <h2 className="font-sans font-black text-2xl sm:text-4xl md:text-5xl tracking-tighter text-[#0f0f0f] uppercase leading-none">
            CORE EXPERTISE
          </h2>
        </div>

        {/* Horizontal Navigation Indicators (Desktop Only) */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs font-mono">
            <span className={`transition-colors duration-300 ${currentSlide === 0 ? "font-bold text-black" : "text-black/40"}`}>
              01 DISCIPLINES
            </span>
            <span className="text-black/20">•</span>
            <span className={`transition-colors duration-300 ${currentSlide === 1 ? "font-bold text-black" : "text-black/40"}`}>
              02 KNOWN TOOLS
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-black/40">
            <span>SCROLL TO EXPLORE</span>
            <ArrowRight size={13} className="animate-pulse text-black/60" />
          </div>
        </div>
      </div>

      {/* TRACK CONTAINER: Natural vertical flow on mobile, pinned horizontal track on desktop */}
      <div className="w-full md:overflow-hidden flex-1 relative z-10 py-4 sm:py-6 md:py-4 px-0 md:flex md:items-center">
        <div
          ref={trackRef}
          className="flex flex-col md:flex-row md:flex-nowrap w-full md:w-[200vw] md:min-w-[200vw] items-start gap-12 md:gap-0"
          style={{ willChange: "transform" }}
        >
          {/* ========================================================== */}
          {/* SLIDE 1: CORE DISCIPLINES (Option Wheel + Dynamic Details) */}
          {/* ========================================================== */}
          <div className="w-full md:w-[100vw] md:min-w-[100vw] shrink-0 flex flex-col justify-center">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-start">
              
              {/* Left Column: Interactive OptionWheel */}
              <div className="md:col-span-5 flex flex-col items-start w-full gap-2">
                {/* Top Wheel Controller Bar */}
                <div className="flex items-center justify-between text-xs font-mono text-black/50 tracking-wider uppercase px-1 w-full">
                  <span className="flex items-center gap-1.5">
                    <Command size={12} className="text-black/40" />
                    <span>DISCIPLINE SELECTOR</span>
                  </span>
                  <span className="font-semibold text-black/80">
                    {selectedSkill.number} / {SKILLS.length < 10 ? `0${SKILLS.length}` : SKILLS.length}
                  </span>
                </div>

                {/* Option Wheel Outer Glass Frame */}
                <div 
                  data-lenis-prevent="true"
                  data-lenis-prevent-wheel="true"
                  className="relative w-full h-[190px] xs:h-[220px] sm:h-[280px] md:h-[360px] rounded-2xl bg-white/45 backdrop-blur-xl border border-white/80 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),0_10px_35px_-8px_rgba(0,0,0,0.07)] hover:border-white transition-all duration-300 overflow-hidden flex items-center justify-center p-2"
                >
                  {/* Active Selection Indicator Box */}
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-11 sm:h-14 rounded-xl bg-gradient-to-b from-white/80 via-white/55 to-white/70 backdrop-blur-md border border-white/95 shadow-[inset_0_1.5px_2px_rgba(255,255,255,1),0_8px_25px_-5px_rgba(0,0,0,0.08)] pointer-events-none z-0 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-80" />
                  </div>

                  {/* Navigation Arrows */}
                  <div className="absolute right-3 top-3 z-20 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        if (selectedIndex > 0) {
                          playTactileClick(0.5, 1.15);
                          setSelectedIndex(selectedIndex - 1);
                        }
                      }}
                      disabled={selectedIndex === 0}
                      aria-label="Previous skill"
                      className="p-1.5 rounded-lg bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 disabled:opacity-20 text-black/80 shadow-xs transition-all cursor-pointer"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (selectedIndex < SKILLS.length - 1) {
                          playTactileClick(0.5, 0.95);
                          setSelectedIndex(selectedIndex + 1);
                        }
                      }}
                      disabled={selectedIndex === SKILLS.length - 1}
                      aria-label="Next skill"
                      className="p-1.5 rounded-lg bg-white/60 hover:bg-white/90 backdrop-blur-md border border-white/80 disabled:opacity-20 text-black/80 shadow-xs transition-all cursor-pointer"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>

                  {/* React Bits OptionWheel Component */}
                  <OptionWheel
                    items={itemLabels}
                    selectedIndex={selectedIndex}
                    onChange={(idx) => setSelectedIndex(idx)}
                    textColor="#777777"
                    activeColor="#0f0f0f"
                    side="left"
                    fontSize={1.75}
                    spacing={1.3}
                    curve={1.1}
                    tilt={6.5}
                    blur={1.5}
                    fade={0.3}
                    smoothing={180}
                    inset={16}
                    loop={false}
                    draggable={true}
                    enableWheel={true}
                    enableSound={true}
                    soundVolume={0.5}
                    className="z-10"
                  />
                </div>
              </div>

              {/* Right Column: Dynamic Details */}
              <div className="md:col-span-7 w-full h-auto min-h-[260px] sm:min-h-[300px] md:min-h-[360px] flex flex-col justify-between bg-white/45 backdrop-blur-xl rounded-2xl p-4 sm:p-6 md:p-7 border border-white/80 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),0_10px_35px_-8px_rgba(0,0,0,0.07)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedSkill.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col gap-3 sm:gap-4 w-full justify-between h-full"
                  >
                    <div>
                      <span className="font-mono text-[11px] sm:text-xs tracking-[0.2em] text-black/40 uppercase mb-1 block">
                        {selectedSkill.category}
                      </span>
                      <h3 className="font-sans font-black text-xl sm:text-3xl md:text-4xl tracking-tight text-[#0f0f0f] uppercase leading-tight">
                        {selectedSkill.title}
                      </h3>
                    </div>

                    <p className="font-sans font-normal text-xs sm:text-sm md:text-base text-black/80 leading-relaxed">
                      {selectedSkill.description}
                    </p>

                    <div>
                      <h4 className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-black/40 uppercase mb-1.5 sm:mb-2">
                        CORE DELIVERABLES & METHODS
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                        {selectedSkill.bullets.map((bullet, idx) => (
                          <div
                            key={idx}
                            className="p-2 sm:p-2.5 rounded-xl bg-black/[0.03] border border-black/5 hover:border-black/15 transition-all"
                          >
                            <span className="font-sans text-xs sm:text-sm font-medium text-black/85 leading-snug block">
                              {bullet}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs font-mono text-black/50">
                      <div className="flex items-center gap-1.5">
                        {SKILLS.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                              i === selectedIndex
                                ? "w-6 bg-black"
                                : "w-1.5 bg-black/20 hover:bg-black/40"
                            }`}
                            aria-label={`Go to skill ${i + 1}`}
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <span>SKILL MATRIX</span>
                        <ArrowRight size={13} className="text-black/40" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* ========================================================== */}
          {/* SLIDE 2: KNOWN TOOLS (Zero-Gravity Interactive Sandbox) */}
          {/* ========================================================== */}
          <div className="w-full md:w-[100vw] md:min-w-[100vw] shrink-0 flex flex-col justify-center pt-8 md:pt-0 border-t border-black/10 md:border-t-0">
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-12 flex flex-col gap-3">
              
              {/* Subheading */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.2em] text-black/50 uppercase">
                  02 • KNOWN TOOLS & ZERO-G ARSENAL
                </span>
                <span className="font-mono text-[11px] text-black/40 hidden sm:inline">
                  TOUCH / DRAG / FLING TO SCATTER
                </span>
              </div>
              
              {/* Zero Gravity Physics Sandbox */}
              <ZeroGravityTools />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(ExpertiseComponent);

