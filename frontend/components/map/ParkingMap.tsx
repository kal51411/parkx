"use client";

import { useEffect, useRef, useState } from "react";
import { ParkingLocation } from "@/lib/api/types";
import { 
  Navigation, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  ShieldCheck,
  Zap
} from "lucide-react";

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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const routePolylineRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Load Leaflet dynamically on the client
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Load Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    const loadLeaflet = async () => {
      if ((window as any).L) {
        initMap((window as any).L);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        if ((window as any).L) {
          initMap((window as any).L);
        }
      };
      document.body.appendChild(script);
    };

    const initMap = (L: any) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [center.lat, center.lng],
        zoom: 14,
        zoomControl: false,
      });

      // CartoDB Dark Matter tiles for authentic high-tech urban feel
      const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png";
      const tiles = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &bull; OpenStreetMap',
        subdomains: "abcd",
      }).addTo(map);

      mapInstanceRef.current = map;
      (map as any)._tileLayer = tiles;
      setMapLoaded(true);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when coordinates change
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], 14, { duration: 1.0 });
    }
  }, [center.lat, center.lng]);

  // Update markers when locations or selectedId changes
  useEffect(() => {
    const L = (window as any).L;
    if (!mapInstanceRef.current || !L || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Clear existing route polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    locations.forEach((loc) => {
      const isSelected = selectedId === loc.id;
      const price = Math.round(loc.base_hourly_price);
      const isEv = loc.amenities?.ev_charging;

      // Custom Dark HTML Marker Pin
      const customIcon = L.divIcon({
        className: "custom-parkx-marker",
        html: `
          <div style="
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            gap: 5px;
            background: ${isSelected ? '#FF2D78' : '#10141E'};
            color: #FFFFFF;
            padding: 5px 9px;
            border-radius: 9999px;
            font-size: 11px;
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-weight: 800;
            box-shadow: ${isSelected ? '0 0 20px rgba(255,45,120,0.6)' : '0 4px 14px rgba(0,0,0,0.6)'};
            border: 1.5px solid ${isSelected ? '#FFFFFF' : '#1E2638'};
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          ">
            <span style="color: ${isSelected ? '#FFFFFF' : '#FF2D78'};">🅿</span>
            <span>₹${price}/h</span>
            ${isEv ? '<span style="color:#00FF87;font-size:10px;">⚡</span>' : ''}
          </div>
        `,
        iconSize: [64, 28],
        iconAnchor: [32, 14],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(
        mapInstanceRef.current
      );

      // Rich Dark Popup
      const popupHtml = `
        <div style="font-family: inherit; width: 220px; padding: 4px; color: #F1F5F9;">
          <div style="font-weight: 900; font-size: 13px; color: #FFFFFF; line-height: 1.2;">${loc.name}</div>
          <div style="font-size: 10px; color: #94A3B8; margin-top: 3px; font-family: monospace;">${loc.address}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid #1E2638;">
            <div style="font-weight: 900; color: #FF2D78; font-size: 14px; font-family: monospace;">₹${price}<span style="font-size: 10px; font-weight: normal; color: #94A3B8;">/hr</span></div>
            <div style="font-size: 10px; font-weight: 800; color: #00FF87; font-family: monospace;">${loc.available_spaces || loc.total_spaces} BAYS FREE</div>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        onSelect(loc);
      });

      markersRef.current.push(marker);

      // If this spot is selected, fly to it & draw route
      if (isSelected) {
        marker.openPopup();
        mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 15, { duration: 0.8 });

        const routeCoords = [
          [center.lat, center.lng],
          [(center.lat + loc.latitude) / 2 + 0.002, (center.lng + loc.longitude) / 2 - 0.001],
          [loc.latitude, loc.longitude],
        ];

        routePolylineRef.current = L.polyline(routeCoords, {
          color: "#FF2D78",
          weight: 3.5,
          opacity: 0.9,
          dashArray: "6, 6",
        }).addTo(mapInstanceRef.current);
      }
    });
  }, [locations, selectedId, mapLoaded]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], 14, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border border-parkx-border shadow-2xl flex flex-col justify-between select-none bg-parkx-black">
      {/* Real Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-parkx-black" />

      {/* Top Floating Controls */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-parkx-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-parkx-border shadow-lg text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-parkx-pink animate-pulse" />
          <span>Mumbai Urban Topology</span>
        </div>

        <div className="pointer-events-auto bg-parkx-surface/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-parkx-border shadow-lg text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-parkx-green animate-ping" />
          <span className="font-extrabold text-parkx-pink">{locations.length}</span> Bays Live
        </div>
      </div>

      {/* Right Floating Map Controls */}
      <div className="relative z-10 self-end p-3 flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-col rounded-xl bg-parkx-surface/90 backdrop-blur-md border border-parkx-border shadow-lg overflow-hidden font-mono">
          <button
            onClick={handleZoomIn}
            className="p-2.5 hover:bg-parkx-border text-slate-300 hover:text-white transition border-b border-parkx-border"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2.5 hover:bg-parkx-border text-slate-300 hover:text-white transition border-b border-parkx-border"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCenter}
            className="p-2.5 hover:bg-parkx-border text-parkx-pink transition"
            title="Center on Search"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Legend */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none font-mono text-[11px]">
        <div className="pointer-events-auto bg-parkx-black/90 backdrop-blur-md text-slate-300 px-3.5 py-1.5 rounded-xl border border-parkx-border shadow-lg flex items-center gap-2">
          <span className="text-parkx-pink font-bold">●</span>
          <span>Click any pin to inspect rates &amp; lock bay</span>
        </div>

        <div className="pointer-events-auto bg-parkx-surface/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-parkx-border text-[10px] text-slate-500">
          OpenStreetMap &bull; CARTO Dark
        </div>
      </div>
    </div>
  );
}
