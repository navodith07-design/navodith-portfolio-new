import React from "react";
import projectBg from "../project-bg.png";

interface WorksBackgroundProps {
  className?: string;
  intensity?: number;
}

export default function WorksBackground({ className = "" }: WorksBackgroundProps) {
  return (
    <div className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}>
      {/* 1. Exact user-provided dark felt background image */}
      <img
        src={projectBg}
        alt="Texture Background"
        className="w-full h-full object-cover object-center select-none"
        style={{ willChange: "transform" }}
      />
      {/* 2. Soft depth gradient and edge vignetting */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-transparent to-[#0a0a0a]/90 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(0,0,0,0.65)_100%)] pointer-events-none" />
    </div>
  );
}
