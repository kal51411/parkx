"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Zap, Radio, Globe, Navigation } from "lucide-react";

export function Footer() {
  const mumbaiSectors = [
    { name: "Bandra West Promenade", coords: "19.0544° N, 72.8402° E", status: "ONLINE" },
    { name: "BKC Diamond Bourse", coords: "19.0658° N, 72.8695° E", status: "ONLINE" },
    { name: "Andheri Metro Hub", coords: "19.1136° N, 72.8697° E", status: "ONLINE" },
    { name: "Powai Hiranandani Deck", coords: "19.1183° N, 72.9067° E", status: "ONLINE" },
    { name: "Lower Parel Palladium", coords: "18.9971° N, 72.8260° E", status: "ONLINE" },
    { name: "Marine Drive Seafront", coords: "18.9298° N, 72.8235° E", status: "ONLINE" },
    { name: "Vashi Sector 17 Hub", coords: "19.0771° N, 73.0071° E", status: "ONLINE" },
  ];

  return (
    <footer className="relative w-full bg-parkx-black border-t border-parkx-border text-slate-400 font-mono text-xs overflow-hidden">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-10 pointer-events-none" />

      {/* Top Architectural Marquee */}
      <div className="border-b border-parkx-border/80 py-3 overflow-hidden bg-parkx-surface/60">
        <div className="flex whitespace-nowrap animate-marquee gap-8 text-[11px] font-bold text-slate-400">
          <span>PARKX MUMBAI URBAN PARKING GRID</span>
          <span>&bull;</span>
          <span className="text-parkx-pink">100% GUARANTEED BAY HOLD</span>
          <span>&bull;</span>
          <span>&lt;15s QR GATE HANDSHAKE</span>
          <span>&bull;</span>
          <span className="text-parkx-green">POSTGIS GEOSPATIAL SEARCH</span>
          <span>&bull;</span>
          <span>DYNAMIC PRICING ENGINE</span>
          <span>&bull;</span>
          <span className="text-parkx-cyan">ZERO DOUBLE BOOKING LEASE</span>
          <span>&bull;</span>
          <span>PARKX MUMBAI URBAN PARKING GRID</span>
          <span>&bull;</span>
          <span className="text-parkx-pink">100% GUARANTEED BAY HOLD</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Main Grid: Brand statement + Portals + Mumbai Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Col 1: Brand & Identity (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-parkx-pink flex items-center justify-center text-white font-black text-base shadow-[0_0_15px_rgba(255,45,120,0.5)]">
                P
              </div>
              <span className="font-black text-xl tracking-tight text-white">
                PARK<span className="text-parkx-pink">X</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Mumbai&apos;s digital parking infrastructure operating system. 
              Eliminating cruising congestion through atomic bay pre-allocation, 
              monetizing private society bays, and automating security gate clearance.
            </p>

            <div className="p-3.5 rounded-2xl bg-parkx-surface border border-parkx-border space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-300">
                <span>SYSTEM STATUS:</span>
                <span className="text-parkx-green font-bold">● ALL SYSTEMS OPERATIONAL</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>GATEWAY PROTOCOL:</span>
                <span>v2.4.0-MUMBAI-REL</span>
              </div>
            </div>
          </div>

          {/* Col 2: Real Product Portals (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-parkx-border pb-2">
              PRODUCT SURFACES
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/search"
                  className="hover:text-parkx-pink transition flex items-center justify-between group"
                >
                  <span>Driver Search &amp; Reserve</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:text-parkx-pink" />
                </Link>
              </li>
              <li>
                <Link
                  href="/bookings"
                  className="hover:text-parkx-pink transition flex items-center justify-between group"
                >
                  <span>My Active Passes &amp; QR</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:text-parkx-pink" />
                </Link>
              </li>
              <li>
                <Link
                  href="/owner/dashboard"
                  className="hover:text-parkx-pink transition flex items-center justify-between group"
                >
                  <span>Society Owner Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:text-parkx-pink" />
                </Link>
              </li>
              <li>
                <Link
                  href="/owner/listings/new"
                  className="hover:text-parkx-pink transition flex items-center justify-between group"
                >
                  <span>List New Parking Bay</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:text-parkx-pink" />
                </Link>
              </li>
              <li>
                <Link
                  href="/security/scan"
                  className="hover:text-parkx-pink transition flex items-center justify-between group"
                >
                  <span>Gate Security Scanner</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:text-parkx-pink" />
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/dashboard"
                  className="hover:text-parkx-pink transition flex items-center justify-between group"
                >
                  <span>Platform Admin Telemetry</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:text-parkx-pink" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Mumbai Node Coordinates Index (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-parkx-border pb-2 flex items-center justify-between">
              <span>MUMBAI MESH TOPOGRAPHY</span>
              <span className="text-[10px] text-parkx-green">7 ACTIVE HUBS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {mumbaiSectors.map((sec) => (
                <Link
                  key={sec.name}
                  href={`/search?location=${encodeURIComponent(sec.name.split(" ")[0])}`}
                  className="p-2.5 rounded-xl bg-parkx-surface border border-parkx-border hover:border-parkx-pink/50 transition group block"
                >
                  <div className="font-bold text-slate-200 group-hover:text-parkx-pink transition-colors">
                    {sec.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{sec.coords}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Metadata & Copyright */}
        <div className="pt-8 border-t border-parkx-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-4">
            <span>© 2026 PARKX TECHNOLOGIES INC.</span>
            <span>&bull;</span>
            <span>MUMBAI, INDIA</span>
          </div>

          <div className="flex items-center gap-6">
            <span>COORDINATES: 19.0760° N, 72.8777° E</span>
            <a href="#network" className="text-slate-400 hover:text-white transition">
              BACK TO TOP ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
