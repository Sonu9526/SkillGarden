"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Flower2 } from "lucide-react";

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!mounted) {
    return (
      <header className="fixed inset-x-0 top-0 z-50 px-4 py-3 sm:px-6">
        <nav className="mx-auto flex max-w-2xl items-center justify-between rounded-2xl border-transparent bg-white/18 backdrop-blur-sm px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ink text-white shadow-lg">
              <Flower2 size={19} />
            </span>
            <span className="text-lg">Bloom</span>
            <span className="hidden rounded-full border border-ink/10 bg-white/60 px-2 py-0.5 text-xs text-ink/55 sm:inline">
              SkillGarden
            </span>
          </Link>


          <div className="flex items-center gap-2">
            <Link
              href="/garden"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-white/70 hover:text-ink sm:inline-flex"
            >
              Login
            </Link>
            <Link
              href="/garden"
              className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(23,33,27,0.24)] transition hover:-translate-y-0.5 hover:bg-leaf"
            >
              Start Planting
            </Link>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 py-3 sm:px-6">
      <nav
        className={`mx-auto flex max-w-2xl items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-300 ${
          scrolled
            ? "border-white/70 bg-white/72 shadow-[0_18px_55px_rgba(32,50,38,0.12)] backdrop-blur-2xl"
            : "border-transparent bg-white/18 backdrop-blur-sm"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ink text-white shadow-lg">
            <Flower2 size={19} />
          </span>
          <span className="text-lg">Bloom</span>
          <span className="hidden rounded-full border border-ink/10 bg-white/60 px-2 py-0.5 text-xs text-ink/55 sm:inline">
            SkillGarden
          </span>
        </Link>


        <div className="flex items-center gap-2">
          <Link
            href="/garden"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-white/70 hover:text-ink sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/garden"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(23,33,27,0.24)] transition hover:-translate-y-0.5 hover:bg-leaf"
          >
            Start Planting
          </Link>
        </div>
      </nav>
    </header>
  );
}
