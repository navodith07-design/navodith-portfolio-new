import React, { useRef } from "react";
import { motion } from "motion/react";
import { 
  ArrowUpRight
} from "lucide-react";
import { Project } from "../types";
import { 
  playKineticWhoosh, 
  playAirDisplacement, 
  playTactileLensClick 
} from "../utils/sound";
import projectBg from "../project-bg.png";
import worksImg from "../WORKS.png";
import selectedProjectsImg from "../Selected projects.png";
import farinaCoverImg from "../Farina&fuoco-img.png";
import farinaVideo from "../Recording 2026-08-20 161137 (1) (1).mp4";
import lawCardImg from "../law-card-img.png";
import lawSiteVid from "../law-site-vid.mp4";
import salletImg from "../Sallet-img.png";
import salletVideo from "../sallet-al-sayad-vid (1) (1).mp4";

const PROJECTS: Project[] = [
  {
    id: "proj-1",
    title: "FARINA & FUOCO",
    category: "Artisanal Pizzeria & Digital Experience",
    year: "2026",
    image: farinaCoverImg,
    video: farinaVideo,
    tags: ["BRAND IDENTITY", "REACT & FRAMER", "E-COMMERCE"],
    link: "https://farina-fuoco.ai.studio/"
  },
  {
    id: "proj-2",
    title: "CARTER LEGAL",
    category: "Corporate & Commercial Law Firm",
    year: "2026",
    image: lawCardImg,
    video: lawSiteVid,
    tags: ["LEGAL ARCHITECTURE", "EDITORIAL DESIGN", "WEB EXPERIENCE"],
    link: "https://lawsamplesite.netlify.app/"
  },
  {
    id: "proj-3",
    title: "SALLET AL SAYAD",
    category: "Culinary & Seafood Dining Experience",
    year: "2026",
    image: salletImg,
    video: salletVideo,
    tags: ["SEAFOOD CUISINE", "WEB EXPERIENCE", "INTERACTIVE MENU"],
    link: "https://navodith07-design.github.io/sallet-al-sayad-live/"
  },
  {
    id: "proj-4",
    title: "SYNAPSE CANVAS",
    category: "Cognitive Neural Mapper",
    year: "2024",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1400&q=85",
    tags: ["SPATIAL UI", "AI WORKFLOW"],
    link: "#"
  }
];

interface ProjectCardProps {
  project: Project;
  idx: number;
}

const CinematicProjectCard: React.FC<ProjectCardProps> = React.memo(({ project, idx }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const isEvenCol = idx % 2 === 0;

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Dynamic aerodynamic motion whoosh on card scale/hover
    playKineticWhoosh('in', 0.22);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Graceful fallback
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    playKineticWhoosh('out', 0.12);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = () => {
    // Tactile lens / shutter click on project launch
    playTactileLensClick(0.28);
  };

  return (
    <motion.a
      initial={{ opacity: 0, x: isEvenCol ? -85 : 85 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.15, margin: "-40px" }}
      transition={{
        duration: 0.85,
        delay: (idx % 2) * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      href={project.link}
      target={project.link?.startsWith("http") ? "_blank" : undefined}
      rel={project.link?.startsWith("http") ? "noopener noreferrer" : undefined}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col rounded-3xl bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-2xl backdrop-saturate-150 border border-white/15 hover:border-white/40 transition-all duration-500 ease-out shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_20px_60px_0_rgba(0,0,0,0.75),inset_0_1px_2px_0_rgba(255,255,255,0.45)] hover:scale-[1.03] overflow-hidden cursor-pointer"
    >
      {/* Specular Liquid Glass Top Rim Light */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none z-30" />

      {/* Ambient Liquid Sheen Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent pointer-events-none z-20 opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Subtle Liquid Prismatic Glow Flare */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-white/10 rounded-full blur-2xl group-hover:scale-150 group-hover:bg-amber-400/10 transition-all duration-700 pointer-events-none" />

      {/* ========================================================================= */}
      {/* MEDIA FRAME (Layered Video + Cover Image + Glass Overlays)                */}
      {/* ========================================================================= */}
      <div className="relative w-[calc(100%-16px)] mx-auto mt-2 aspect-[16/10] overflow-hidden rounded-2xl bg-black/60 border border-white/10 shadow-inner z-10">
        
        {/* BOTTOM LAYER: Video Player (Instant Preload & Zero Latency Playback) */}
        {project.video ? (
          <video
            ref={videoRef}
            src={project.video}
            muted
            loop
            playsInline
            preload="auto"
            className={`absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-500 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
        ) : (
          <div className="absolute inset-0 bg-black/80 z-0" />
        )}

        {/* MIDDLE LAYER: Static Cover Image (Displays in default state, smoothly crossfades on hover) */}
        <img
          src={project.image}
          alt={project.title}
          loading="eager"
          className={`absolute inset-0 w-full h-full object-cover z-10 transition-all duration-500 ease-out pointer-events-none select-none ${
            project.video && isHovered ? "opacity-0 scale-105" : "opacity-100 scale-100"
          }`}
          referrerPolicy="no-referrer"
        />

        {/* Ambient Dark Gradient for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70 group-hover:opacity-40 transition-opacity duration-500 z-15 pointer-events-none" />

        {/* TOP LAYER (UI Controls within media): Liquid Glass Index Badge */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none">
          <span className="font-mono font-bold text-[10px] text-amber-300 bg-black/50 backdrop-blur-xl border border-white/20 px-2.5 py-1 rounded-lg shadow-md">
            0{idx + 1}
          </span>
        </div>

        {/* TOP LAYER: Liquid Glass Floating Action Button (Arrow) */}
        <div 
          onMouseEnter={(e) => {
            e.stopPropagation();
            playAirDisplacement(0.16);
          }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 text-white flex items-center justify-center font-bold text-xs shadow-lg group-hover:bg-amber-400 group-hover:text-black group-hover:rotate-45 transition-all duration-300 z-30"
        >
          <ArrowUpRight size={14} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TOP LAYER: Content UI Layer (Title, Category, Tags)                       */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 flex flex-col gap-2 relative z-30">
        <div className="flex items-center justify-between text-white/55 font-mono text-[11px]">
          <span className="uppercase tracking-wider truncate">{project.category}</span>
          <span className="shrink-0 text-white/40">{project.year}</span>
        </div>

        <h3 className="font-display font-bold text-xl sm:text-2xl text-white group-hover:text-amber-300 transition-colors tracking-tight">
          {project.title}
        </h3>

        {/* Frosted Glass Tag Pills */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {project.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  playAirDisplacement(0.11);
                }}
                className="font-mono text-[9px] bg-white/[0.06] hover:bg-white/[0.15] backdrop-blur-md border border-white/15 hover:border-white/35 text-white/80 hover:text-white px-2.5 py-0.5 rounded-md shadow-sm transition-all duration-200"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.a>
  );
});

function ProjectsComponent() {
  return (
    <section id="projects-section" className="relative w-full z-10 bg-transparent overflow-x-clip">
      {/* Anchor for navigation links */}
      <div id="works" className="absolute -top-20 left-0 pointer-events-none" />

      {/* ========================================================================= */}
      {/* 1. THE PINNED BACKGROUND (Sticky to the screen)                           */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 w-full h-full -z-10">
        <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">
          
          {/* Layer 1: Textured Background Image */}
          <img
            src={projectBg}
            alt="bg"
            className="absolute inset-0 w-full h-full object-cover opacity-80 select-none pointer-events-none filter brightness-95 contrast-105"
          />

          {/* Atmospheric Radial Gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/90 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
          
          {/* Soft Red Atmosphere Glow */}
          <div className="absolute w-[60%] max-w-2xl h-[220px] bg-red-600/15 rounded-full blur-[90px] pointer-events-none" />

          {/* Graphic Typography: WORKS & Selected Projects with Cinematic Entry Motion */}
          <div className="relative w-full max-w-5xl px-4 sm:px-6 flex flex-col items-center justify-center my-auto">
            {/* WORKS large backdrop typography (Scales up & fades in) */}
            <motion.img
              initial={{ opacity: 0, scale: 0.88, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 1.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              src={worksImg}
              alt="Works"
              className="relative z-10 w-[80vw] max-w-5xl select-none pointer-events-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)]"
            />

            {/* Selected Projects red cursive text (Slides in with slight tilt/parallel flourish) */}
            <motion.img
              initial={{ opacity: 0, scale: 0.8, y: 45, rotate: -4 }}
              whileInView={{ opacity: 1, scale: 1, y: 48, rotate: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 1.2,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
              src={selectedProjectsImg}
              alt="Selected"
              className="absolute z-20 w-[40vw] max-w-xl select-none pointer-events-none drop-shadow-[0_6px_25px_rgba(249,43,43,0.5)]"
            />
          </div>

          {/* Bottom Hint */}
          <div className="absolute bottom-8 sm:bottom-12 flex flex-col items-center gap-1 pointer-events-none">
            <span className="font-mono text-[9px] sm:text-[10px] text-white/40 tracking-[0.2em] uppercase">
              SCROLL TO REVEAL WORKS
            </span>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE SCROLLING CARDS OVERLAY (PARALLEL X AXIS ANIMATION ENTRY)          */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full flex flex-col justify-end overflow-x-clip">
        {/* Spacer to reveal the pinned background first */}
        <div className="w-full h-screen bg-transparent pointer-events-none"></div>

        {/* 2-Column Grid Container */}
        <div className="w-full min-h-screen bg-transparent relative z-30 pt-12 pb-32 px-4 sm:px-8 md:px-12">
          <div className="max-w-6xl mx-auto">
            
            {/* 2 Projects Per Row Grid with Parallel X Entry Motion */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {PROJECTS.map((project, idx) => (
                <CinematicProjectCard key={project.id} project={project} idx={idx} />
              ))}
            </div>

            {/* Simple Bottom Archive Note */}
            <div 
              className="flex items-center justify-between w-full pt-16 border-t border-white/10 font-mono text-[10px] text-white/35 hover:text-white/60 transition-colors uppercase tracking-widest mt-16 cursor-default"
            >
              <span>INDEX // 04 PROJECTS</span>
              <span>NAVODITH © 2026</span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(ProjectsComponent);
