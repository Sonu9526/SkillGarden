import { motion, MotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import React from "react";

interface QuoteItem {
  percentage: number;
  text: string;
  hasCTA?: boolean;
  index: number;
}

const quotes: Omit<QuoteItem, "index">[] = [
  { percentage: 0.09, text: "Every great journey begins\nwith a single seed." },
  { percentage: 0.225, text: "Plant a dream." },
  { percentage: 0.36, text: "Small steps.\nEvery single day." },
  { percentage: 0.495, text: "Consistency turns effort\ninto growth." },
  { percentage: 0.63, text: "Every completed task\nhelps your garden bloom." },
  { percentage: 0.765, text: "Today, you plant a skill.\nTomorrow, you grow a future." },
  { percentage: 0.90, text: "Grow Skills.\nBloom Daily.", hasCTA: true }
];

interface QuoteOverlayProps {
  progress: MotionValue<number>;
}

export const QuoteOverlay = React.memo(function QuoteOverlay({ progress }: QuoteOverlayProps) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none z-10">
      {quotes.map((quote, idx) => (
        <QuoteText key={quote.text} quote={{ ...quote, index: idx }} progress={progress} />
      ))}
    </div>
  );
});

interface QuoteTextProps {
  quote: QuoteItem;
  progress: MotionValue<number>;
}

const QuoteText = React.memo(function QuoteText({ quote, progress }: QuoteTextProps) {
  const { percentage, text, hasCTA, index } = quote;
  
  const targets = quotes.map(q => q.percentage);
  const T = targets[index];
  const fade = 0.04;
  const solid = 0.015;
  
  let range: number[] = [];
  let opacityOutput: number[] = [];
  let yOutput: number[] = [];

  if (index === 0) {
    // First quote starts visible at 0%, remains solid, and fades out
    range = [0.00, T + solid, T + solid + fade];
    opacityOutput = [1, 1, 0];
    yOutput = [0, 0, -30];
  } else if (index === quotes.length - 1) {
    // Last quote fades in and remains visible
    range = [T - solid - fade, T - solid, 1.00];
    opacityOutput = [0, 1, 1];
    yOutput = [30, 0, 0];
  } else {
    // Middle quotes fade in, stay solid, and fade out before the next one starts
    range = [T - solid - fade, T - solid, T + solid, T + solid + fade];
    opacityOutput = [0, 1, 1, 0];
    yOutput = [30, 0, 0, -30];
  }

  const opacity = useTransform(progress, range, opacityOutput, { clamp: true });
  const y = useTransform(progress, range, yOutput, { clamp: true });

  // Dedicated CTA timeline to fade in slightly after the final text settles
  const ctaOpacity = useTransform(progress, [0.85, 0.90, 1.00], [0, 1, 1], { clamp: true });
  const ctaY = useTransform(progress, [0.85, 0.90, 1.00], [20, 0, 0], { clamp: true });

  const lines = text.split("\n");

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
    >
      <h2 
        className="text-4xl font-bold leading-tight text-[#F8F5EE] sm:text-5xl lg:text-7xl max-w-4xl tracking-tight"
        style={{ textShadow: "0 4px 24px rgba(0, 0, 0, 0.45)" }}
      >
        {lines.map((line, idx) => (
          <span key={idx} className="block">
            {line}
          </span>
        ))}
      </h2>
      
      {hasCTA && (
        <motion.div 
          style={{ opacity: ctaOpacity, y: ctaY }}
          className="mt-8 flex justify-center gap-4 pointer-events-auto"
        >
          <Link
            href="/garden"
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-ink shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:bg-leaf hover:text-white hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            Start Planting
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#F8F5EE]/40 bg-black/20 px-8 py-4 text-base font-bold text-[#F8F5EE] shadow-[0_12px_32px_rgba(0,0,0,0.2)] hover:bg-[#F8F5EE] hover:text-ink hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            Login
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
});
