"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { 
  Car, 
  Building2, 
  ShieldCheck, 
  QrCode, 
  Zap, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Sparkles, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp,
  Camera,
  Activity,
  Layers,
  Lock,
  Compass
} from "lucide-react";
import { MUMBAI_DEMO_LOCATIONS } from "@/lib/api/client";

export function ExperiencesSection() {
  const [activePersona, setActivePersona] = useState<"driver" | "owner" | "security">("driver");

  // Driver Interactive State
  const [driverDest, setDriverDest] = useState(MUMBAI_DEMO_LOCATIONS[0]);
  const [driverVeh, setDriverVeh] = useState<"CAR" | "SUV" | "TWO_WHEELER" | "EV">("CAR");
  const [driverHours, setDriverHours] = useState(2);
  const [driverPassGenerated, setDriverPassGenerated] = useState(false);

  // Owner Interactive State
  const [peakMultiplier, setPeakMultiplier] = useState(1.25);
  const [aiQuery, setAiQuery] = useState("Show peak hours & optimal rate for BKC");
  const [aiResponse, setAiResponse] = useState(
    "Gemini Operations Telemetry: BKC occupancy hits 92% between 09:00 - 11:30 AM. Recommend applying +25% peak multiplier (₹75/hr) to maximize yields without drop-off."
  );

  // Security Interactive State
  const [secScanState, setSecScanState] = useState<"IDLE" | "SCANNING" | "VERIFIED">("IDLE");
  const [secCheckedIn, setSecCheckedIn] = useState(false);

  const vehMultipliers = { TWO_WHEELER: 0.5, CAR: 1.0, SUV: 1.3, EV: 1.2 };
  const calculatedDriverPrice = Math.round(
    driverDest.base_hourly_price * vehMultipliers[driverVeh] * driverHours
  );

  const handleSimulateScan = () => {
    setSecScanState("SCANNING");
    setTimeout(() => {
      setSecScanState("VERIFIED");
    }, 700);
  };

  return (
    <section
      id="experiences"
      className="relative w-full py-28 px-4 sm:px-6 lg:px-8 bg-parkx-black border-b border-parkx-border overflow-hidden"
    >
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute left-1/4 top-1/2 w-96 h-96 bg-parkx-pink/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Header & Persona Selector */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-parkx-border pb-8">
          <div>
            <span className="text-[11px] font-mono text-parkx-pink uppercase tracking-widest block font-bold">
              04 // PRODUCT ECOSYSTEM
            </span>
            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase mt-2">
              THREE INTERACTIVE SYSTEMS.<br />
              <span className="text-slate-400">ONE UNIFIED NETWORK.</span>
            </h2>
          </div>

          {/* Persona Switcher Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-parkx-surface border border-parkx-border font-mono text-xs">
            <button
              onClick={() => setActivePersona("driver")}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activePersona === "driver"
                  ? "bg-parkx-pink text-white shadow-[0_0_15px_rgba(255,45,120,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Car className="w-4 h-4" />
              <span>01 / DRIVER</span>
            </button>
            <button
              onClick={() => setActivePersona("owner")}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activePersona === "owner"
                  ? "bg-parkx-pink text-white shadow-[0_0_15px_rgba(255,45,120,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>02 / OWNER</span>
            </button>
            <button
              onClick={() => setActivePersona("security")}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                activePersona === "security"
                  ? "bg-parkx-pink text-white shadow-[0_0_15px_rgba(255,45,120,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>03 / SECURITY</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* EXPERIENCE 01: DRIVER TERMINAL */}
        {/* ======================================================== */}
        {activePersona === "driver" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-in fade-in zoom-in-95 duration-300">
            {/* Left 6 cols: Interactive Booking Terminal */}
            <div className="lg:col-span-6 p-8 rounded-3xl bg-parkx-surface/90 border border-parkx-border flex flex-col justify-between space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-parkx-border pb-4">
                  <span className="text-xs font-mono font-bold text-parkx-pink uppercase flex items-center gap-2">
                    <Car className="w-4 h-4 text-parkx-pink" />
                    DRIVER SEARCH &amp; LOCK CONSOLE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    STATUS: READY
                  </span>
                </div>

                {/* Destination Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Select Target Mumbai Destination:
                  </label>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {MUMBAI_DEMO_LOCATIONS.slice(0, 4).map((loc) => (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => {
                          setDriverDest(loc);
                          setDriverPassGenerated(false);
                        }}
                        className={`p-3 rounded-xl border text-left transition ${
                          driverDest.id === loc.id
                            ? "bg-parkx-card border-parkx-pink text-white shadow-[0_0_10px_rgba(255,45,120,0.3)]"
                            : "bg-parkx-black/60 border-parkx-border text-slate-400 hover:text-white"
                        }`}
                      >
                        <div className="font-bold text-xs line-clamp-1">{loc.name.split(" ")[0]} {loc.name.split(" ")[1]}</div>
                        <div className="text-[10px] text-parkx-pink font-bold mt-1">₹{loc.base_hourly_price}/hr &bull; {loc.available_spaces || 20} bays</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vehicle Switcher */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Vehicle Type:
                  </label>
                  <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                    {[
                      { id: "TWO_WHEELER", label: "2-Wheeler" },
                      { id: "CAR", label: "Sedan/Hatch" },
                      { id: "SUV", label: "SUV / 4x4" },
                      { id: "EV", label: "EV ⚡" },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => {
                          setDriverVeh(v.id as any);
                          setDriverPassGenerated(false);
                        }}
                        className={`py-2 rounded-xl border text-center transition font-bold ${
                          driverVeh === v.id
                            ? "bg-parkx-pink text-white border-parkx-pink shadow-sm"
                            : "bg-parkx-black/60 border-parkx-border text-slate-400 hover:text-white"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase">
                    Reservation Window:
                  </label>
                  <div className="grid grid-cols-4 gap-2 font-mono text-xs">
                    {[1, 2, 4, 8].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setDriverHours(h);
                          setDriverPassGenerated(false);
                        }}
                        className={`py-2 rounded-xl border text-center transition font-bold ${
                          driverHours === h
                            ? "bg-parkx-card border-parkx-pink text-white"
                            : "bg-parkx-black/60 border-parkx-border text-slate-400 hover:text-white"
                        }`}
                      >
                        {h} Hour{h > 1 ? "s" : ""}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Breakdown Calculation */}
                <div className="p-4 rounded-2xl bg-parkx-black/80 border border-parkx-border font-mono text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Base Hourly Rate</span>
                    <span>₹{driverDest.base_hourly_price}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Vehicle Multiplier ({driverVeh})</span>
                    <span>{vehMultipliers[driverVeh]}x</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Atomic Lock Hold</span>
                    <span className="text-parkx-green font-bold">8:00 Min Free</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-parkx-border text-sm font-bold text-white">
                    <span>Total Payable</span>
                    <span className="text-parkx-pink text-base font-black">₹{calculatedDriverPrice}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setDriverPassGenerated(true)}
                  className="flex-1 py-3.5 rounded-xl bg-parkx-pink hover:bg-parkx-pink-light text-white font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(255,45,120,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>GENERATE DIGITAL QR PASS</span>
                </button>
                <Link
                  href="/search"
                  className="p-3.5 rounded-xl bg-parkx-black border border-parkx-border text-slate-400 hover:text-white"
                  title="Open Full Driver App"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Right 6 cols: Live Smartphone QR Pass Mockup */}
            <div className="lg:col-span-6 flex flex-col justify-center items-center p-8 rounded-3xl bg-gradient-to-br from-parkx-surface via-parkx-card to-parkx-black border border-parkx-border shadow-2xl relative">
              <div className="w-full max-w-sm rounded-[2.5rem] bg-parkx-black border-4 border-slate-800 p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-5 relative">
                {/* Phone Notch */}
                <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto" />

                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1 text-[10px] font-mono text-parkx-green font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60">
                    <CheckCircle2 className="w-3 h-3" />
                    CONFIRMED &bull; ATOMIC HOLD
                  </div>
                  <h4 className="text-lg font-black text-white font-mono">
                    PKX-2026-MUMBAI-01
                  </h4>
                  <p className="text-[11px] font-mono text-slate-400 line-clamp-1">
                    {driverDest.name}
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-lg">
                  <QRCodeSVG
                    value={`PKX_DRIVER_PASS_${driverDest.id}_${driverVeh}_${Date.now()}`}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                  <span className="text-[9px] font-mono text-slate-500 mt-1 font-bold">
                    SCAN AT GATE FOR &lt;15s CLEARANCE
                  </span>
                </div>

                {/* Bay & Vehicle Details */}
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-parkx-surface border border-parkx-border">
                    <span className="text-[10px] text-slate-500 uppercase block">Bay Allocated</span>
                    <span className="font-black text-parkx-pink text-sm">BAY A-04</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-parkx-surface border border-parkx-border">
                    <span className="text-[10px] text-slate-500 uppercase block">Plate Number</span>
                    <span className="font-bold text-white text-sm">MH 02 CZ 9021</span>
                  </div>
                </div>

                <Link
                  href="/search"
                  className="w-full py-2.5 rounded-xl bg-parkx-surface hover:bg-parkx-border text-slate-200 text-xs font-mono font-bold text-center block transition"
                >
                  Launch Full Driver Search Flow →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 02: OWNER & HOUSING SOCIETY MATRIX */}
        {/* ======================================================== */}
        {activePersona === "owner" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-in fade-in zoom-in-95 duration-300">
            {/* Left 6 cols: Live Dashboard Telemetry Preview */}
            <div className="lg:col-span-6 p-8 rounded-3xl bg-parkx-surface/90 border border-parkx-border flex flex-col justify-between space-y-6 backdrop-blur-xl shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-parkx-border pb-4">
                  <span className="text-xs font-mono font-bold text-parkx-amber uppercase flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-parkx-amber" />
                    SOCIETY &amp; BAY OPERATING MATRIX
                  </span>
                  <span className="text-[10px] font-mono text-parkx-green font-bold">
                    PORTFOLIO: 60 BAYS
                  </span>
                </div>

                {/* Live Real Metrics */}
                <div className="grid grid-cols-3 gap-3 font-mono">
                  <div className="p-4 rounded-2xl bg-parkx-black/70 border border-parkx-border">
                    <span className="text-[10px] text-slate-400 uppercase block">Today&apos;s Revenue</span>
                    <div className="text-2xl font-black text-parkx-green mt-1">₹3,420</div>
                    <span className="text-[10px] text-slate-500">18 Bookings</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-parkx-black/70 border border-parkx-border">
                    <span className="text-[10px] text-slate-400 uppercase block">Live Occupancy</span>
                    <div className="text-2xl font-black text-parkx-pink mt-1">70%</div>
                    <span className="text-[10px] text-slate-500">42 / 60 Bays</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-parkx-black/70 border border-parkx-border">
                    <span className="text-[10px] text-slate-400 uppercase block">Monthly Yield</span>
                    <div className="text-2xl font-black text-white mt-1">₹84,200</div>
                    <span className="text-[10px] text-slate-500">384 Trans.</span>
                  </div>
                </div>

                {/* Peak Multiplier Rule Simulator */}
                <div className="p-4 rounded-2xl bg-parkx-black/60 border border-parkx-border space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold uppercase">Peak Hour Dynamic Pricing Rule</span>
                    <span className="text-parkx-amber font-black">{peakMultiplier}x Multiplier</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={peakMultiplier}
                    onChange={(e) => setPeakMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-parkx-pink cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>1.0x (Standard ₹60/h)</span>
                    <span className="text-parkx-pink font-bold">Current: ₹{Math.round(60 * peakMultiplier)}/h</span>
                    <span>2.0x (Max ₹120/h)</span>
                  </div>
                </div>

                {/* Gemini AI Advisor Interactive Preview */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-parkx-surface to-parkx-card border border-parkx-border space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-parkx-cyan font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    Gemini SQL Yield Advisor (Verified Telemetry)
                  </div>
                  <p className="text-xs text-slate-300 font-mono leading-relaxed bg-parkx-black/60 p-3 rounded-xl border border-parkx-border">
                    {aiResponse}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Link
                  href="/owner/dashboard"
                  className="flex-1 py-3.5 rounded-xl bg-parkx-pink hover:bg-parkx-pink-light text-white font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(255,45,120,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  <span>OPEN FULL OWNER DASHBOARD →</span>
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-3.5 rounded-xl bg-parkx-black border border-parkx-border text-slate-300 hover:text-white font-mono text-xs font-bold"
                >
                  List Society Bays
                </Link>
              </div>
            </div>

            {/* Right 6 cols: Live Bay Grid Map */}
            <div className="lg:col-span-6 flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-parkx-surface via-parkx-card to-parkx-black border border-parkx-border shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-parkx-border pb-4">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                  BKC DIAMOND BOURSE &bull; BASEMENT 1 BAY MATRIX
                </span>
                <span className="text-[10px] font-mono text-parkx-green font-bold">
                  18 BAYS AVAILABLE
                </span>
              </div>

              {/* Visual 24 Bay Grid */}
              <div className="grid grid-cols-6 gap-2 font-mono text-xs my-auto">
                {Array.from({ length: 24 }).map((_, i) => {
                  const isOccupied = i % 3 === 0 || i % 5 === 0;
                  const isEv = i === 2 || i === 7 || i === 14;
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-between h-16 ${
                        isOccupied
                          ? "bg-parkx-black/80 border-slate-800 text-slate-600"
                          : "bg-emerald-950/30 border-emerald-700/60 text-emerald-300 shadow-[0_0_10px_rgba(0,255,135,0.1)]"
                      }`}
                    >
                      <span className="text-[10px] font-bold">A-{i + 1 < 10 ? `0${i + 1}` : i + 1}</span>
                      <span className="text-[9px]">
                        {isOccupied ? "HELD" : isEv ? "⚡ FREE" : "FREE"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-parkx-border pt-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-parkx-green" /> Free Bay
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-700" /> Occupied
                  </span>
                  <span className="flex items-center gap-1 text-parkx-cyan">
                    <span>⚡</span> EV Port
                  </span>
                </div>
                <span className="text-slate-500 text-[10px]">AUTO-BALANCED</span>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* EXPERIENCE 03: SECURITY & VALET GATE SCANNER */}
        {/* ======================================================== */}
        {activePersona === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-in fade-in zoom-in-95 duration-300">
            {/* Left 6 cols: Optical Scanner Viewfinder HUD */}
            <div className="lg:col-span-6 p-8 rounded-3xl bg-parkx-surface/90 border border-parkx-border flex flex-col justify-between items-center text-center relative overflow-hidden backdrop-blur-xl shadow-2xl space-y-6">
              <div className="w-full flex justify-between items-center text-xs font-mono text-slate-400 border-b border-parkx-border pb-4">
                <div className="flex items-center gap-1.5 text-parkx-green font-bold">
                  <Camera className="w-4 h-4 text-parkx-green" />
                  <span>GATE OPTICAL SCANNER 01</span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-parkx-green animate-pulse" />
                  SENSOR ACTIVE
                </span>
              </div>

              {/* Viewfinder Target */}
              <div className="relative w-56 h-56 rounded-3xl border-2 border-parkx-green/60 p-4 flex flex-col items-center justify-center my-4 bg-parkx-black/80 shadow-[0_0_30px_rgba(0,255,135,0.15)]">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-parkx-green" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-parkx-green" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-parkx-green" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-parkx-green" />

                {secScanState === "SCANNING" ? (
                  <div className="w-full h-1 bg-parkx-pink shadow-[0_0_15px_#ff2d78] animate-bounce my-auto" />
                ) : secScanState === "VERIFIED" ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="w-12 h-12 text-parkx-green mx-auto animate-in zoom-in" />
                    <span className="text-xs font-mono font-bold text-parkx-green block">
                      CLEARANCE GRANTED
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <QrCode className="w-16 h-16 text-slate-600 mx-auto opacity-50" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">
                      ALIGN DRIVER PASS
                    </span>
                  </div>
                )}
              </div>

              {/* Scan Trigger Action */}
              <div className="w-full flex gap-3">
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="flex-1 py-3.5 rounded-xl bg-parkx-green hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,255,135,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>SIMULATE PASS SCAN (&lt;15s)</span>
                </button>
                <Link
                  href="/security/scan"
                  className="px-5 py-3.5 rounded-xl bg-parkx-black border border-parkx-border text-slate-300 hover:text-white font-mono text-xs font-bold"
                >
                  Open Guard App →
                </Link>
              </div>
            </div>

            {/* Right 6 cols: Live Gate Clearance Telemetry */}
            <div className="lg:col-span-6 flex flex-col justify-between p-8 rounded-3xl bg-gradient-to-br from-parkx-surface via-parkx-card to-parkx-black border border-parkx-border shadow-2xl space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-parkx-border pb-4">
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase">
                    DRIVER ENTRY VERIFICATION LOG
                  </span>
                  <span className="text-[10px] font-mono text-parkx-green font-bold">
                    TOKEN: PKX_PASS_BKC_SECURE
                  </span>
                </div>

                {/* Validated Pass HUD */}
                <div className="p-5 rounded-2xl bg-parkx-black/80 border border-parkx-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Vehicle Plate</span>
                      <span className="text-lg font-mono font-black text-white">MH 02 CZ 9021</span>
                      <span className="text-xs text-slate-400 block">Maruti Suzuki Swift &bull; Silver</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Allocated Bay</span>
                      <span className="text-xl font-mono font-black text-parkx-pink">BAY A-01</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-parkx-border font-mono text-xs">
                    <div className="text-slate-400">
                      <span>Status: </span>
                      <span className={secCheckedIn ? "text-parkx-cyan font-bold" : "text-parkx-green font-bold"}>
                        {secCheckedIn ? "CHECKED_IN" : "CONFIRMED"}
                      </span>
                    </div>
                    <div className="text-right text-slate-400">
                      <span>Clearance: </span>
                      <span className="text-parkx-green font-bold">&lt; 0.4s Handshake</span>
                    </div>
                  </div>
                </div>

                {/* Barrier Gate Button */}
                <button
                  type="button"
                  onClick={() => setSecCheckedIn(!secCheckedIn)}
                  className={`w-full py-3 rounded-xl font-mono font-bold text-xs transition flex items-center justify-center gap-2 ${
                    secCheckedIn
                      ? "bg-parkx-card border border-parkx-border text-slate-300"
                      : "bg-parkx-pink hover:bg-parkx-pink-light text-white shadow-[0_0_20px_rgba(255,45,120,0.4)]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{secCheckedIn ? "BAY MARKED OCCUPIED (BARRIER CLOSED)" : "OPEN BARRIER GATE & CHECK-IN DRIVER"}</span>
                </button>
              </div>

              {/* Expected Queue */}
              <div className="border-t border-parkx-border pt-4 font-mono text-xs">
                <div className="flex justify-between text-slate-400 mb-2">
                  <span className="font-bold">EXPECTED ARRIVALS QUEUE</span>
                  <span className="text-parkx-pink">2 Approaching</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between p-2 rounded-lg bg-parkx-black/60 border border-parkx-border text-slate-300 text-[11px]">
                    <span>MH 01 AB 1234 (Honda City)</span>
                    <span className="text-parkx-green font-bold">Bay A-02 &bull; ETA 3m</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-parkx-black/60 border border-parkx-border text-slate-300 text-[11px]">
                    <span>MH 01 EV 8899 (Tata Nexon EV)</span>
                    <span className="text-parkx-cyan font-bold">Bay B-12 ⚡ &bull; ETA 7m</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
