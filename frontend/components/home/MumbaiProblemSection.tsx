"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Compass, 
  Layers, 
  RefreshCw, 
  ShieldAlert, 
  Zap, 
  Lock
} from "lucide-react";

export function MumbaiProblemSection() {
  const [activeTab, setActiveTab] = useState<"friction" | "solution">("solution");

  const searchSteps = [
    { label: "SEARCH.", sub: "Scan congested streets without visibility" },
    { label: "CIRCLE.", sub: "Repeat loops around packed commercial blocks" },
    { label: "CHECK.", sub: "Encounter full basement gates and informal touts" },
    { label: "DRIVE.", sub: "Miss arrival windows in bumper-to-bumper traffic" },
    { label: "REPEAT.", sub: "Zero guarantee of space upon reaching" },
  ];

  return (
    <section
      id="problem"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 bg-parkx-dark border-b border-parkx-border overflow-hidden"
    >
      {/* Background Decorative Tech Elements */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute -left-20 top-1/3 w-80 h-80 bg-parkx-pink/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-parkx-border pb-8">
          <div>
            <span className="text-[11px] font-mono text-parkx-pink uppercase tracking-widest block font-bold">
              01 // THE URBAN FRICTION
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase mt-2">
              MUMBAI DOES NOT HAVE A PARKING SHORTAGE.<br />
              <span className="text-slate-400">IT HAS A DISCOVERY CRISIS.</span>
            </h2>
          </div>

          <p className="text-sm font-mono text-slate-400 max-w-md">
            Thousands of private society bays and commercial decks sit vacant every minute while drivers circle Mumbai blocks blindly.
          </p>
        </div>

        {/* Kinetic Step Sequence vs Algorithmic Lock */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: The Search Loop Editorial Stack */}
          <div className="lg:col-span-6 flex flex-col justify-between p-8 rounded-3xl bg-parkx-surface/80 border border-parkx-border space-y-8 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-parkx-border pb-4">
              <span className="text-xs font-mono text-slate-400 uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                THE TRADITIONAL CRUISING LOOP
              </span>
              <span className="text-[10px] font-mono text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40">
                UNPREDICTABLE
              </span>
            </div>

            {/* Kinetic Typography Stack */}
            <div className="space-y-3 font-mono">
              {searchSteps.map((step, idx) => (
                <div
                  key={step.label}
                  className="group p-3.5 rounded-2xl bg-parkx-black/60 border border-parkx-border/80 hover:border-rose-500/50 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 font-mono text-xs font-bold">0{idx + 1}</span>
                    <span className="text-xl sm:text-2xl font-black text-slate-300 group-hover:text-rose-400 transition-colors">
                      {step.label}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 text-right line-clamp-1">
                    {step.sub}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs font-mono text-slate-400 border-t border-parkx-border">
              Result: Double parking, blocked lanes, fuel waste, and stressed arrivals.
            </div>
          </div>

          {/* Right Column: The ParkX Atomic Solution */}
          <div className="lg:col-span-6 flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-parkx-surface via-parkx-card to-parkx-black border border-parkx-border space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-parkx-pink/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-parkx-border pb-4">
              <span className="text-xs font-mono text-parkx-green uppercase flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-parkx-green" />
                THE PARKX ATOMIC ENGINE
              </span>
              <span className="text-[10px] font-mono text-parkx-green font-bold px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                GUARANTEED
              </span>
            </div>

            <div className="space-y-4">
              <div className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight leading-tight">
                PARKX FINDS<br />
                <span className="text-parkx-pink text-glow-pink">THE SPACE.</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                ParkX unlocks Mumbai&apos;s dormant parking inventory. Drivers lock exact bays before leaving home, society owners monetize idle capacity, and gate security clears entries in under 15 seconds.
              </p>

              {/* Three Core Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs">
                <div className="p-3.5 rounded-2xl bg-parkx-black/70 border border-parkx-border">
                  <span className="text-parkx-pink font-bold text-lg block">100%</span>
                  <span className="text-slate-400 text-[11px]">Atomic Bay Hold</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-parkx-black/70 border border-parkx-border">
                  <span className="text-parkx-green font-bold text-lg block">&lt;15s</span>
                  <span className="text-slate-400 text-[11px]">QR Gate Pass</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-parkx-black/70 border border-parkx-border">
                  <span className="text-parkx-cyan font-bold text-lg block">0</span>
                  <span className="text-slate-400 text-[11px]">Double Bookings</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-parkx-border">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-parkx-pink hover:text-white transition"
              >
                <span>EXPLORE LIVE MUMBAI MAP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="text-[10px] font-mono text-slate-500">
                SECURED BY POSTGIS + REDIS
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
