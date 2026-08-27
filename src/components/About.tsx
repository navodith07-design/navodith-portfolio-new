import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import StrokeText from "./StrokeText";

function AboutComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef1 = useRef<HTMLHeadingElement>(null);
  const textRef2 = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const setupTextReveal = (textElement: HTMLElement | null) => {
      if (!textElement) return [];
      const paragraphs = textElement.querySelectorAll("p");
      if (paragraphs.length > 0) {
        const allSpans: HTMLSpanElement[] = [];
        paragraphs.forEach((p) => {
          const words = (p.textContent || "").split(/\s+/).filter(Boolean);
          p.innerHTML = words
            .map((word) => `<span class="inline-block text-black/15 transition-all duration-300 hover:text-[#0f0f0f]">${word}</span>`)
            .join(" ");
          allSpans.push(...Array.from(p.querySelectorAll("span")));
        });
        return allSpans;
      }
      const textContent = textElement.textContent || "";
      const words = textContent.split(/\s+/).filter(Boolean);
      textElement.innerHTML = words
        .map((word) => `<span class="inline-block text-black/15 transition-all duration-300 hover:text-[#0f0f0f]">${word}</span>`)
        .join(" ");
      return Array.from(textElement.querySelectorAll("span"));
    };

    const wordElements1 = setupTextReveal(textRef1.current);
    const wordElements2 = setupTextReveal(textRef2.current);

    const ctx = gsap.context(() => {
      // Reveal words as user scrolls down for paragraph 1
      if (wordElements1.length && textRef1.current) {
        gsap.to(wordElements1, {
          scrollTrigger: {
            trigger: textRef1.current,
            start: "top 85%",
            end: "bottom 60%",
            scrub: 0.5,
          },
          color: "#0f0f0f",
          stagger: 0.05,
        });
      }

      // Reveal words as user scrolls down for paragraph 2
      if (wordElements2.length && textRef2.current) {
        gsap.to(wordElements2, {
          scrollTrigger: {
            trigger: textRef2.current,
            start: "top 85%",
            end: "bottom 60%",
            scrub: 0.5,
          },
          color: "#0f0f0f",
          stagger: 0.05,
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="about"
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#eae7e1] text-[#0f0f0f] py-24 sm:py-32 px-6 sm:px-8 md:px-12 flex flex-col justify-center border-t border-black/10 select-none overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Giant ABOUT heading rendered with animated SVG StrokeText */}
        <div className="relative mt-8 sm:mt-12 mb-6 sm:mb-8 h-[18vw] min-h-[56px] sm:h-[12vw] md:h-[13vw] w-full">
          <StrokeText
            text="ABOUT"
            strokeColor="#0f0f0f"
            fillColor="#0f0f0f"
            strokeWidth={3.5}
            drawDuration={1.4}
            fillDelay={0.15}
            stagger={0.08}
            trigger="scroll"
            fillMode="wipe"
            fontSize={180}
            fontWeight={900}
            letterSpacing={-4}
            preserveAspectRatio="xMinYMid meet"
            className="w-full h-full"
            style={{ '--stroke-text-height': '100%' } as React.CSSProperties}
          />
        </div>

        {/* Small black square bullet */}
        <div className="w-2.5 h-2.5 bg-black mt-6 mb-10 sm:mb-16" />

        {/* First Massive Statement */}
        <div className="w-full mb-10 sm:mb-16">
          <h3
            ref={textRef1}
            className="font-sans font-light text-[32px] sm:text-4xl md:text-5xl lg:text-[4.5vw] leading-[1.18] sm:leading-[1.15] tracking-tight text-black/90"
          >
            I believe great products are built by understanding people, simplifying complexity and designing experiences that create real business impact.
          </h3>
        </div>

        {/* Second Indented Statement */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full">
          <div
            ref={textRef2 as any}
            className="md:col-start-5 md:col-span-8 flex flex-col gap-6 md:gap-8 font-sans font-light text-2xl sm:text-2xl md:text-3xl lg:text-[2.2vw] leading-[1.35] tracking-tight text-[#0f0f0f]"
          >
            <p>
              I have over three years of experience designing enterprise products, improving user experiences and building scalable design systems. I enjoy transforming complex business requirements into intuitive digital products through research, product thinking and thoughtful interaction design.
            </p>
            <p>
              With a strong understanding of front-end development, I collaborate effectively with engineers to create solutions that are both user-friendly and practical to implement. My focus is always on designing products that solve real problems and deliver measurable value for both users and businesses.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(AboutComponent);
