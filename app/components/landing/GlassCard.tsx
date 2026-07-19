"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`rounded-2xl border border-white/70 bg-white/68 shadow-[0_24px_80px_rgba(41,65,47,0.10)] backdrop-blur-xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
