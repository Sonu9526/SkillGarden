import { HeroOverlay } from "@/app/components/landing/HeroOverlay";
import { LandingNavbar } from "@/app/components/landing/LandingNavbar";

export default function LandingPage() {
  return (
    <main className="text-ink bg-[#f8f5ee]">
      <LandingNavbar />
      <HeroOverlay />
    </main>
  );
}
