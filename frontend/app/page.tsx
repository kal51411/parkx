import { HeroSection } from "@/components/home/HeroSection";
import { MumbaiProblemSection } from "@/components/home/MumbaiProblemSection";
import { LiveNetworkMap } from "@/components/home/LiveNetworkMap";
import { StatsSection } from "@/components/home/StatsSection";
import { ExperiencesSection } from "@/components/home/ExperiencesSection";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-parkx-black text-slate-100 selection:bg-parkx-pink selection:text-white">
      {/* 01 // Asymmetrical Full-Viewport Cinematic Hero */}
      <HeroSection />

      {/* 02 // The Mumbai Parking Crisis & Conceptual Story */}
      <MumbaiProblemSection />

      {/* 03 // Real Interactive Mumbai Map Product Surface */}
      <LiveNetworkMap />

      {/* 04 // Architecture Guarantees & Monolithic Typography Metrics */}
      <StatsSection />

      {/* 05 // Three Deep Interactive Product Experiences */}
      <ExperiencesSection />

      {/* 06 // Dense Architectural Technical Footer */}
      <Footer />
    </div>
  );
}
