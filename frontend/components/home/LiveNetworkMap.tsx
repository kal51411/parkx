"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Navigation, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Car, 
  Star, 
  SlidersHorizontal,
  ChevronRight,
  Lock,
  Layers,
  Sparkles
} from "lucide-react";
import { ParkingMap } from "@/components/map/ParkingMap";
import { MUMBAI_DEMO_LOCATIONS } from "@/lib/api/client";
import { ParkingLocation } from "@/lib/api/types";

const SECTOR_TABS = [
  { id: "all", name: "All Mumbai Sectors", lat: 19.0658, lng: 72.8695 },
  { id: "bkc", name: "BKC Financial District", lat: 19.0658, lng: 72.8695 },
  { id: "bandra", name: "Bandra West Promenade", lat: 19.0544, lng: 72.8402 },
  { id: "andheri", name: "Andheri Metro Hub", lat: 19.1136, lng: 72.8697 },
  { id: "powai", name: "Powai Tech Corridor", lat: 19.1183, lng: 72.9067 },
  { id: "lowerparel", name: "Lower Parel Commercial", lat: 18.9971, lng: 72.8260 },
  { id: "southmumbai", name: "Marine Drive / Fort", lat: 18.9298, lng: 72.8235 },
];

export function LiveNetworkMap() {
  const router = useRouter();
  const [selectedSector, setSelectedSector] = useState(SECTOR_TABS[0]);
  const [selectedSpot, setSelectedSpot] = useState<ParkingLocation | null>(MUMBAI_DEMO_LOCATIONS[0]);
  const [activeFilter, setActiveFilter] = useState<"all" | "ev" | "valet">("all");

  const filteredLocations = MUMBAI_DEMO_LOCATIONS.filter((loc) => {
    if (activeFilter === "ev") return loc.amenities?.ev_charging;
    if (activeFilter === "valet") return loc.amenities?.valet;
    return true;
  });

  const handleSelectSector = (sector: typeof SECTOR_TABS[0]) => {
    setSelectedSector(sector);
    // Find closest spot to this sector
    const match = MUMBAI_DEMO_LOCATIONS.find((l) => 
      Math.abs(l.latitude - sector.lat) < 0.03 && Math.abs(l.longitude - sector.lng) < 0.03
    );
    if (match) setSelectedSpot(match);
  };

  return (
    <section
      id="network"
      className="relative w-full py-24 px-4 sm:px-6 lg:px-8 bg-parkx-black border-b border-parkx-border overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-[11px] font-mono text-parkx-pink uppercase tracking-widest block font-bold">
              02 // LIVE TOPOGRAPHY &amp; TELEMETRY
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase mt-2">
              MUMBAI LIVE PARKING GRID
            </h2>
            <p className="text-sm font-mono text-slate-400 mt-1">
              Active geospatial telemetry powered by OpenStreetMap &amp; PostGIS.
            </p>
          </div>

          {/* Sector Filters & Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg border transition ${
                activeFilter === "all"
                  ? "bg-parkx-pink text-white border-parkx-pink font-bold"
                  : "bg-parkx-surface border-parkx-border text-slate-400 hover:text-white"
              }`}
            >
              ALL BAYS ({MUMBAI_DEMO_LOCATIONS.length})
            </button>
            <button
              onClick={() => setActiveFilter("ev")}
              className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                activeFilter === "ev"
                  ? "bg-parkx-pink text-white border-parkx-pink font-bold"
                  : "bg-parkx-surface border-parkx-border text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-parkx-cyan" />
              EV FAST CHARGERS
            </button>
            <button
              onClick={() => setActiveFilter("valet")}
              className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1 ${
                activeFilter === "valet"
                  ? "bg-parkx-pink text-white border-parkx-pink font-bold"
                  : "bg-parkx-surface border-parkx-border text-slate-400 hover:text-white"
              }`}
            >
              VALET HUBS
            </button>
          </div>
        </div>

        {/* Sector Quick Switcher Strip */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {SECTOR_TABS.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelectSector(s)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition border ${
                selectedSector.id === s.id
                  ? "bg-parkx-surface text-white border-parkx-pink shadow-[0_0_15px_rgba(255,45,120,0.3)]"
                  : "bg-parkx-card/60 border-parkx-border/80 text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Interactive Split View: Real Map Surface + Inspection Terminal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
          {/* Map Surface (7 Cols) */}
          <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-parkx-border bg-parkx-surface relative shadow-2xl min-h-[480px]">
            <ParkingMap
              locations={filteredLocations}
              selectedId={selectedSpot?.id || null}
              onSelect={(loc) => setSelectedSpot(loc)}
              center={{ lat: selectedSector.lat, lng: selectedSector.lng }}
            />
          </div>

          {/* Inspection Terminal (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col justify-between p-6 rounded-3xl bg-parkx-surface/90 border border-parkx-border backdrop-blur-xl shadow-2xl space-y-6">
            {selectedSpot ? (
              <div className="space-y-5">
                {/* Header */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-parkx-green uppercase flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-parkx-green animate-pulse" />
                      LIVE SECURED NODE
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">
                      ID: {selectedSpot.id}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white leading-tight">
                    {selectedSpot.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 flex items-center gap-1 pt-1">
                    <MapPin className="w-3.5 h-3.5 text-parkx-pink shrink-0" />
                    <span>{selectedSpot.address}</span>
                  </p>
                </div>

                {/* Pricing & Free Bays Meter */}
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3.5 rounded-2xl bg-parkx-black/70 border border-parkx-border space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Base Rate</span>
                    <div className="text-2xl font-black text-parkx-pink">
                      ₹{selectedSpot.base_hourly_price}
                      <span className="text-xs font-normal text-slate-400">/hr</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-parkx-black/70 border border-parkx-border space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase">Live Capacity</span>
                    <div className="text-2xl font-black text-parkx-green">
                      {selectedSpot.available_spaces || selectedSpot.total_spaces}
                      <span className="text-xs font-normal text-slate-400"> free</span>
                    </div>
                  </div>
                </div>

                {/* Verified Specs */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1.5 border-b border-parkx-border/80 text-slate-300">
                    <span className="text-slate-500">Facility Type</span>
                    <span className="font-bold capitalize">{selectedSpot.parking_type.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-parkx-border/80 text-slate-300">
                    <span className="text-slate-500">EV Charging Level 2</span>
                    <span className={selectedSpot.amenities?.ev_charging ? "text-parkx-cyan font-bold" : "text-slate-600"}>
                      {selectedSpot.amenities?.ev_charging ? "Available ⚡" : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-parkx-border/80 text-slate-300">
                    <span className="text-slate-500">Valet Assistance</span>
                    <span className={selectedSpot.amenities?.valet ? "text-parkx-pink font-bold" : "text-slate-600"}>
                      {selectedSpot.amenities?.valet ? "On Duty 🚗" : "Self Park"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 text-slate-300">
                    <span className="text-slate-500">Security Guard Desk</span>
                    <span className="text-parkx-green font-bold">24/7 Monitored 🛡️</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 font-sans leading-relaxed p-3 rounded-2xl bg-parkx-black/40 border border-parkx-border">
                  {selectedSpot.description}
                </p>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 font-mono text-xs">
                Select any parking pin on the map to inspect live rates and locks.
              </div>
            )}

            {/* Launch Search Flow */}
            <div className="pt-4 border-t border-parkx-border space-y-2">
              <Link
                href={`/search?location=${encodeURIComponent(selectedSpot?.name || "BKC")}`}
                className="w-full py-3.5 rounded-xl bg-parkx-pink hover:bg-parkx-pink-light text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,45,120,0.4)] transition-all"
                data-cursor="HOLD"
              >
                <Lock className="w-4 h-4" />
                <span>LOCK BAY IN {selectedSpot?.name.split(" ")[0] || "MUMBAI"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
