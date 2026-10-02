"use client";

import { useEffect, useState, useRef } from "react";
import { ShieldCheck, Cpu, Database, QrCode, Zap, Layers, RefreshCw } from "lucide-react";

export function StatsSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    {
      num: "100%",
      label: "GUARANTEED SPACE HOLD",
      desc: "Zero double-booking guarantee backed by Redis distributed atomic locks & 8-minute reservation holds.",
      accent: "text-parkx-pink",
      badge: "ATOMIC LOCK",
      icon: ShieldCheck,
    },
    {
      num: "<15s",
      label: "QR GATE CLEARANCE",
      desc: "Sub-second camera / barcode scanner handshake at security booths. No physical tokens, no manual logs.",
      accent: "text-parkx-green",
      badge: "GATE PROTOCOL",
      icon: QrCode,
    },
    {
      num: "0",
      label: "OVERLAPS / CONFLICTS",
      desc: "ACID-compliant relational schedule leases prevent overlapping booking intervals across all vehicle types.",
      accent: "text-parkx-cyan",
      badge: "CONCURRENCY SAFE",
      icon: Database,
    },
    {
      num: "₹40—₹80",
      label: "AVG HOURLY PRICING",
      desc: "Algorithmic dynamic pricing balancing suburban rates (₹35-₹50) with commercial prime decks (₹60-₹80).",
      accent: "text-parkx-amber",
      badge: "DYNAMIC ENGINE",
      icon: Zap,
    },
  ];

  return (
    <section
      id="stats"
      ref={sectionRef}
      className="relative w-full py-28 px-4 sm:px-6 lg:px-8 bg-parkx-dark border-b border-parkx-border overflow-hidden"
    >
      <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />
      <div className="absolute right-10 top-1/4 w-96 h-96 bg-parkx-pink/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-parkx-border pb-8">
          <div>
            <span className="text-[11px] font-mono text-parkx-pink uppercase tracking-widest block font-bold">
              03 // SYSTEM BENCHMARKS
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase mt-2">
              PLATFORM ARCHITECTURE &amp; METRICS
            </h2>
          </div>
          <div className="text-right text-xs font-mono text-slate-400">
            <span className="text-parkx-green font-bold">VERIFIED PRODUCTION TELEMETRY</span>
            <span className="block text-slate-500">MUMBAI PROTOCOL v2.4</span>
          </div>
        </div>

        {/* Monumental Typographic 4-Grid Composition */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-8 rounded-3xl bg-parkx-surface/80 border border-parkx-border hover:border-parkx-pink/40 transition-all duration-300 flex flex-col justify-between space-y-8 backdrop-blur-md group hover:-translate-y-1 shadow-xl"
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 px-2.5 py-1 rounded bg-parkx-black/60 border border-parkx-border">
                    {stat.badge}
                  </span>
                  <Icon className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                </div>

                {/* Monumental Number */}
                <div className="space-y-2">
                  <div
                    className={`text-5xl sm:text-6xl lg:text-7xl font-black font-mono tracking-tighter ${stat.accent} transition-transform duration-700 ${
                      inView ? "scale-100 opacity-100" : "scale-95 opacity-80"
                    }`}
                  >
                    {stat.num}
                  </div>
                  <div className="text-sm font-black font-mono text-white tracking-wider uppercase">
                    {stat.label}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 font-sans leading-relaxed border-t border-parkx-border/80 pt-4">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
