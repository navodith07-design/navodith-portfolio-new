/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from "react";
import SmoothScroll from "./components/SmoothScroll";
import CustomCursor from "./components/CustomCursor";
import Preloader from "./components/Preloader";
import Navigation from "./components/Navigation";
import Hero from "./components/Hero";
import About from "./components/About";
import Expertise from "./components/Expertise";
import Projects from "./components/Projects";
import ScrollVideoExperience from "./components/ScrollVideoExperience";
import Footer from "./components/Footer";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [logoGlideCompleted, setLogoGlideCompleted] = useState(false);

  const handlePreloaderComplete = useCallback(() => {
    setLoading(false);
  }, []);

  const handleLogoGlideComplete = useCallback(() => {
    setLogoGlideCompleted(true);
  }, []);

  return (
    <SmoothScroll>
      {/* High-end loading animation */}
      {loading && <Preloader onComplete={handlePreloaderComplete} />}

      {/* Precision follow-inertia custom cursor for advanced UI feeling */}
      <CustomCursor />

      {/* Elegant, high-fidelity responsive menu and header */}
      <Navigation isParentLoading={loading} onLogoGlideComplete={handleLogoGlideComplete} />

      {/* High-end photographic grain noise overlay */}
      <div className="noise-overlay" />

      {/* Main Content Sections */}
      <main className="w-full min-h-screen bg-[#0a0a0a] text-[#f5f5f7]">
        {/* Layered graphic typography & center showreel */}
        <Hero isParentLoading={loading} revealHero={logoGlideCompleted} />
        
        {/* Editorial 12-column philosophy transition */}
        <About />

        {/* Interactive Core Expertise Option Wheel */}
        <Expertise />

        {/* Select craft portfolio showcase with floating reveals */}
        <Projects />

        {/* Apple-style frame-by-frame scroll-animated video experience */}
        <ScrollVideoExperience />

        {/* Contact CTA, magnetic components, and index details */}
        <Footer />
      </main>
    </SmoothScroll>
  );
}
