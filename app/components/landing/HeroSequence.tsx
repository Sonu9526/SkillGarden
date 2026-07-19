"use client";

import { useRef, useEffect } from "react";
import { useMotionValue } from "framer-motion";
import { Sprout } from "lucide-react";
import { useScrollFrames } from "./useScrollFrames";
import { ScrollFramePlayer } from "./ScrollFramePlayer";
import { QuoteOverlay } from "./QuoteOverlay";

export function HeroSequence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { isLoaded, loadedCount, getClosestLoadedImage } = useScrollFrames(270);
  const scrollYProgress = useMotionValue(0);

  // Scroll listener for direct DOM updates (image frame swaps & Ken Burns scale zoom)
  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      // Calculate scroll progress (0 to 1)
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      
      // Sync Framer Motion Value with raw progress
      scrollYProgress.set(progress);
      
      // 1. Ken Burns Effect: Animate scale continuously from 1.03 to 1.00
      const currentScale = 1.03 - progress * 0.03;
      
      // 2. Final Garden Frame Linger: Reach final frame (269) at 90% scroll (0.90)
      const animationProgress = Math.min(1, progress / 0.90);
      const index = Math.min(269, Math.floor(animationProgress * 270));
      
      const src = getClosestLoadedImage(index);
      
      if (imgRef.current) {
        if (src) {
          imgRef.current.src = src;
        }
        imgRef.current.style.transform = `scale(${currentScale})`;
      }
    };

    // Initialize first frame immediately
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isLoaded, getClosestLoadedImage]);

  return (
    <div ref={containerRef} id="hero-scroll-container" className="relative min-h-[680vh]">
      {/* Premium Preloader state */}
      {!isLoaded && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f8f5ee]">
          <div className="flex flex-col items-center space-y-6 max-w-xs w-full px-4">
            <div className="relative rounded-2xl bg-white p-4 shadow-sm border border-leaf/10">
              <Sprout className="h-10 w-10 text-leaf animate-bounce" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-ink">Preparing SkillGarden</h3>
              <p className="text-xs text-ink/50">Caching experiences...</p>
            </div>

            <div className="w-full space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
                <div 
                  className="h-full bg-leaf transition-all duration-300 rounded-full" 
                  style={{ width: `${Math.round((loadedCount / 270) * 100)}%` }} 
                />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-ink/50">
                <span>{loadedCount} / 270 frames</span>
                <span>{Math.round((loadedCount / 270) * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pinned Sticky container */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#f8f5ee] flex items-center justify-center">
        {/* Frame Player */}
        <ScrollFramePlayer imgRef={imgRef} isLoaded={isLoaded} />

        {/* Subtle dark gradient overlay behind the text to enhance readability */}
        <div 
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.52), rgba(0,0,0,0.20), transparent)"
          }}
        />

        {/* Text Overlay */}
        {isLoaded && <QuoteOverlay progress={scrollYProgress} />}
      </div>
    </div>
  );
}
