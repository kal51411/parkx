"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowUpRight, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Car, 
  Sparkles, 
  Layers, 
  Compass, 
  ChevronRight,
  Crosshair,
  Lock
} from "lucide-react";
import { MUMBAI_DEMO_LOCATIONS } from "@/lib/api/client";
import { ParkingLocation } from "@/lib/api/types";

export function HeroSection() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredNode, setHoveredNode] = useState<ParkingLocation | null>(null);
  const [selectedNode, setSelectedNode] = useState<ParkingLocation | null>(MUMBAI_DEMO_LOCATIONS[0]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Map nodes mapped to relative normalized positions on canvas
  const networkNodes = [
    { loc: MUMBAI_DEMO_LOCATIONS[0], name: "BKC", x: 0.62, y: 0.44, rate: 60, status: "AVAILABLE", free: 24 },
    { loc: MUMBAI_DEMO_LOCATIONS[1], name: "Bandra W", x: 0.48, y: 0.50, rate: 50, status: "AVAILABLE", free: 11 },
    { loc: MUMBAI_DEMO_LOCATIONS[2], name: "Carter Rd", x: 0.42, y: 0.54, rate: 40, status: "AVAILABLE", free: 8 },
    { loc: MUMBAI_DEMO_LOCATIONS[3], name: "Andheri E", x: 0.64, y: 0.30, rate: 45, status: "AVAILABLE", free: 37 },
    { loc: MUMBAI_DEMO_LOCATIONS[4], name: "Powai", x: 0.76, y: 0.28, rate: 55, status: "AVAILABLE", free: 19 },
    { loc: MUMBAI_DEMO_LOCATIONS[5], name: "Lower Parel", x: 0.44, y: 0.68, rate: 75, status: "AVAILABLE", free: 42 },
    { loc: MUMBAI_DEMO_LOCATIONS[6], name: "Marine Drive", x: 0.40, y: 0.82, rate: 80, status: "AVAILABLE", free: 15 },
    { loc: MUMBAI_DEMO_LOCATIONS[7], name: "Vashi Hub", x: 0.84, y: 0.48, rate: 35, status: "AVAILABLE", free: 55 },
  ];

  // Interactive Particle & Transit Network Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Vehicle packets moving between nodes
    const packets = [
      { from: 0, to: 1, progress: 0.1, speed: 0.003, color: "#FF2D78" },
      { from: 1, to: 2, progress: 0.4, speed: 0.004, color: "#00FF87" },
      { from: 3, to: 0, progress: 0.7, speed: 0.0035, color: "#38BDF8" },
      { from: 4, to: 3, progress: 0.2, speed: 0.0025, color: "#FF2D78" },
      { from: 1, to: 5, progress: 0.5, speed: 0.0045, color: "#00FF87" },
      { from: 5, to: 6, progress: 0.8, speed: 0.003, color: "#FFB800" },
      { from: 0, to: 7, progress: 0.3, speed: 0.002, color: "#FF2D78" },
    ];

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // Parallax offset
      const pX = (mousePos.x / width - 0.5) * 20;
      const pY = (mousePos.y / height - 0.5) * 20;

      // Draw subtle topographic grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.025)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x + pX * 0.2, 0);
        ctx.lineTo(x + pX * 0.2, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y + pY * 0.2);
        ctx.lineTo(width, y + pY * 0.2);
        ctx.stroke();
      }

      // Draw network connection lines between adjacent Mumbai nodes
      const connections = [
        [0, 1], [1, 2], [3, 0], [4, 3], [1, 5], [5, 6], [0, 7], [4, 7]
      ];

      connections.forEach(([i, j]) => {
        const n1 = networkNodes[i];
        const n2 = networkNodes[j];
        if (!n1 || !n2) return;

        const x1 = n1.x * width + pX;
        const y1 = n1.y * height + pY;
        const x2 = n2.x * width + pX;
        const y2 = n2.y * height + pY;

        ctx.strokeStyle = "rgba(255, 45, 120, 0.15)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Draw animated packets (simulating moving vehicles / reserved routing)
      packets.forEach((pkt) => {
        pkt.progress += pkt.speed;
        if (pkt.progress > 1) pkt.progress = 0;

        const n1 = networkNodes[pkt.from];
        const n2 = networkNodes[pkt.to];
        if (!n1 || !n2) return;

        const x1 = n1.x * width + pX;
        const y1 = n1.y * height + pY;
        const x2 = n2.x * width + pX;
        const y2 = n2.y * height + pY;

        const currX = x1 + (x2 - x1) * pkt.progress;
        const currY = y1 + (y2 - y1) * pkt.progress;

        // Glowing packet dot
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(currX, currY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw pulsing node waves
      networkNodes.forEach((node, idx) => {
        const nx = node.x * width + pX;
        const ny = node.y * height + pY;
        const pulse = Math.sin(time + idx) * 4 + 6;

        // Outer pulse circle
        ctx.strokeStyle = "rgba(255, 45, 120, 0.3)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(nx, ny, pulse + 6, 0, Math.PI * 2);
        ctx.stroke();

        // Node center
        ctx.fillStyle = "#00FF87";
        ctx.beginPath();
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen w-full flex flex-col justify-between pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-parkx-black overflow-hidden border-b border-parkx-border"
    >
      {/* Background Interactive Topology Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none opacity-80"
      />

      {/* Atmospheric Vignette & Grid */}
      <div className="absolute inset-0 z-0 bg-tech-grid opacity-30 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-parkx-black via-transparent to-parkx-black/60 pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-parkx-pink/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Telemetry & Status Bar */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-4 pt-4 text-[11px] font-mono border-b border-parkx-border/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-parkx-surface border border-parkx-border text-slate-300">
            <span className="w-2 h-2 rounded-full bg-parkx-green animate-pulse" />
            <span className="font-bold text-white">MUMBAI MESH</span>
            <span className="text-slate-500">::</span>
            <span className="text-parkx-green">100% ONLINE</span>
          </div>
          <span className="hidden sm:inline text-slate-500">
            LAT: 19°03&apos;N / LNG: 72°52&apos;E
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">PROTOCOL:</span>
            <span className="text-slate-300 font-bold">ATOMIC-LOCK-v2</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">GATE CLEARANCE:</span>
            <span className="text-parkx-pink font-bold">&lt;15s QR</span>
          </div>
        </div>
      </div>

      {/* Main Asymmetrical Editorial Composition */}
      <div className="relative z-10 max-w-7xl mx-auto w-full my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
        {/* Left Column: Oversized Editorial Statement */}
        <div className="lg:col-span-8 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-parkx-surface border border-parkx-border/90 text-slate-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-parkx-pink" />
            <span>REAL-TIME MUMBAI PARKING INFRASTRUCTURE</span>
          </div>

          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black text-white tracking-tighter leading-[0.88] uppercase select-none">
            PARK<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500">
              WITHOUT
            </span><br />
            <span className="text-parkx-pink text-glow-pink">THE SEARCH.</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl font-sans leading-relaxed pt-2">
            ParkX connects drivers, verified society bays, and gate security across Mumbai. 
            Guaranteed bay hold, dynamic pricing, and sub-15s digital QR gate clearance.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link
              href="/search"
              className="px-8 py-4 rounded-xl bg-parkx-pink hover:bg-parkx-pink-light text-white font-black font-mono text-sm tracking-wider uppercase shadow-[0_0_30px_rgba(255,45,120,0.5)] transition-all hover:scale-105 flex items-center gap-2.5"
              data-cursor="RESERVE"
            >
              <span>FIND PARKING</span>
              <ArrowUpRight className="w-5 h-5" />
            </Link>

            <Link
              href="/register"
              className="px-8 py-4 rounded-xl bg-parkx-surface hover:bg-parkx-card text-slate-200 hover:text-white border border-parkx-border hover:border-parkx-pink/50 font-bold font-mono text-sm tracking-wider uppercase transition-all flex items-center gap-2"
              data-cursor="MONETIZE"
            >
              <span>LIST YOUR SPACE</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Right Column: Live Interactive Spot Inspector Card */}
        <div className="lg:col-span-4 w-full">
          {selectedNode && (
            <div className="bg-parkx-surface/90 border border-parkx-border/90 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-parkx-pink/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-parkx-green uppercase font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-parkx-green animate-ping" />
                    LIVE TELEMETRY NODE
                  </div>
                  <h3 className="text-xl font-black text-white mt-1 leading-tight">
                    {selectedNode.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {selectedNode.address}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-parkx-pink font-mono leading-none">
                    ₹{selectedNode.base_hourly_price}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">/ HOUR</div>
                </div>
              </div>

              {/* Status and Bays */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-parkx-border font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-parkx-black/60 border border-parkx-border">
                  <span className="text-[10px] text-slate-500 uppercase block">Available Bays</span>
                  <span className="text-base font-black text-parkx-green">
                    {selectedNode.available_spaces || selectedNode.total_spaces} FREE
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-parkx-black/60 border border-parkx-border">
                  <span className="text-[10px] text-slate-500 uppercase block">Bay Type</span>
                  <span className="text-base font-black text-slate-200 capitalize">
                    {selectedNode.parking_type.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Amenities */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                {selectedNode.status === "VERIFIED" && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> VERIFIED
                  </span>
                )}
                {selectedNode.amenities?.ev_charging && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800/60 text-blue-400 text-[10px]">
                    <Zap className="w-3 h-3" /> EV READY
                  </span>
                )}
                {selectedNode.amenities?.valet && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-400 text-[10px]">
                    VALET
                  </span>
                )}
              </div>

              {/* Direct Booking CTA */}
              <Link
                href={`/search?location=${encodeURIComponent(selectedNode.name)}`}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                data-cursor="LOCK"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>RESERVE THIS BAY →</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Interactive Sector Strip */}
      <div className="relative z-10 max-w-7xl mx-auto w-full pt-4 border-t border-parkx-border/60">
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-2">
          <div className="text-[11px] font-mono text-slate-500 uppercase shrink-0">
            ACTIVE MUMBAI HUBS:
          </div>
          <div className="flex items-center gap-2">
            {networkNodes.map((n) => {
              const isSelected = selectedNode?.id === n.loc.id;
              return (
                <button
                  key={n.name}
                  onClick={() => setSelectedNode(n.loc)}
                  onMouseEnter={() => setHoveredNode(n.loc)}
                  onMouseLeave={() => setHoveredNode(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? "bg-parkx-pink text-white shadow-[0_0_15px_rgba(255,45,120,0.5)] scale-105"
                      : "bg-parkx-surface border border-parkx-border text-slate-300 hover:border-slate-500 hover:text-white"
                  }`}
                  data-cursor="INSPECT"
                >
                  <span>{n.name}</span>
                  <span className={`text-[10px] ${isSelected ? "text-white" : "text-parkx-green"}`}>
                    ₹{n.rate}/h
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
