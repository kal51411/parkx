"use client";

import { ParkingLocation } from "@/lib/api/types";
import { MapPin, Navigation } from "lucide-react";

interface ParkingMapProps {
  locations: ParkingLocation[];
  selectedId: string | null;
  onSelect: (location: ParkingLocation) => void;
  center: { lat: number; lng: number };
}

export function ParkingMap({
  locations,
  selectedId,
  onSelect,
  center,
}: ParkingMapProps) {
  // Mumbai bounding box approximations for relative canvas rendering
  const minLat = 18.9;
  const maxLat = 19.25;
  const minLng = 72.78;
  const maxLng = 73.05;

  const getPositionStyle = (lat: number, lng: number) => {
    // Relative % calculation for high-fidelity interactive map display
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100;
    return {
      left: `${Math.max(5, Math.min(95, x))}%`,
      top: `${Math.max(5, Math.min(95, y))}%`,
    };
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex flex-col justify-between p-4 select-none">
      {/* Visual background grid depicting Mumbai map terrain */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
      
      {/* Ambient water / Arabian Sea gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-gradient-to-r from-sky-950/40 to-transparent pointer-events-none" />

      {/* Map Header Overlay */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-blue-400" />
          <span>Mumbai Metropolitan Area</span>
        </div>
        <div className="bg-slate-800/90 backdrop-blur px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
          <span className="text-emerald-400 font-bold">{locations.length}</span> verified spots found
        </div>
      </div>

      {/* Interactive Markers Container */}
      <div className="absolute inset-4 z-20 pointer-events-none">
        {locations.map((loc) => {
          const isSelected = selectedId === loc.id;
          const pos = getPositionStyle(loc.latitude, loc.longitude);

          return (
            <div
              key={loc.id}
              style={pos}
              onClick={() => onSelect(loc)}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group transition-transform hover:scale-110"
            >
              <div
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-lg transition ${
                  isSelected
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/30 scale-110 z-30"
                    : "bg-white text-slate-900 hover:bg-blue-50"
                }`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? "text-white" : "text-blue-600"}`} />
                <span>₹{Math.round(loc.base_hourly_price)}</span>
              </div>
              {/* Tooltip on hover */}
              <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[11px] rounded shadow-lg whitespace-nowrap z-40">
                {loc.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Footer status */}
      <div className="relative z-10 text-[11px] text-slate-400 flex items-center justify-between">
        <div>Click any pin to inspect space & book instant hold</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time PostGIS Sync</span>
        </div>
      </div>
    </div>
  );
}
