"use client";

import { useEffect, useRef, useState } from "react";
import { ParkingLocation } from "@/lib/api/types";
import { 
  MapPin, 
  Navigation, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  ExternalLink,
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
  const [tileLayerType, setTileLayerType] = useState<"voyager" | "osm" | "dark">("voyager");

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

      // CartoDB Voyager tiles (crisp, beautiful Mumbai streets, labels & landmarks)
      const tileUrl = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      const tiles = L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> | &copy; OpenStreetMap',
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
      mapInstanceRef.current.flyTo([center.lat, center.lng], 14, { duration: 1.2 });
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

      // Custom HTML Marker Pin
      const customIcon = L.divIcon({
        className: "custom-parkx-marker",
        html: `
          <div style="
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            gap: 4px;
            background: ${isSelected ? '#2563eb' : '#ffffff'};
            color: ${isSelected ? '#ffffff' : '#0f172a'};
            padding: 4px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            box-shadow: 0 4px 14px rgba(0,0,0,0.25);
            border: 2px solid ${isSelected ? '#ffffff' : '#e2e8f0'};
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
          ">
            <span style="color: ${isSelected ? '#ffffff' : '#2563eb'};">🅿</span>
            <span>₹${price}/h</span>
            ${isEv ? '<span style="color:#10b981;font-size:10px;">⚡</span>' : ''}
          </div>
        `,
        iconSize: [60, 28],
        iconAnchor: [30, 14],
      });

      const marker = L.marker([loc.latitude, loc.longitude], { icon: customIcon }).addTo(
        mapInstanceRef.current
      );

      // Bind rich popup
      const popupHtml = `
        <div style="font-family: inherit; width: 200px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a;">${loc.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${loc.address}</div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
            <div style="font-weight: 800; color: #2563eb; font-size: 14px;">₹${price}<span style="font-size: 10px; font-weight: normal; color: #64748b;">/hr</span></div>
            <div style="font-size: 11px; font-weight: 700; color: #10b981;">${loc.available_spaces || loc.total_spaces} free</div>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      marker.on("click", () => {
        onSelect(loc);
      });

      markersRef.current.push(marker);

      // If this spot is selected, open popup & draw simulated route line
      if (isSelected) {
        marker.openPopup();
        mapInstanceRef.current.flyTo([loc.latitude, loc.longitude], 15, { duration: 0.8 });

        // Draw animated driving line from simulated driver location (center) to spot
        const routeCoords = [
          [center.lat, center.lng],
          [(center.lat + loc.latitude) / 2 + 0.002, (center.lng + loc.longitude) / 2 - 0.001],
          [loc.latitude, loc.longitude],
        ];

        routePolylineRef.current = L.polyline(routeCoords, {
          color: "#2563eb",
          weight: 4,
          opacity: 0.8,
          dashArray: "8, 8",
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
    <div className="relative w-full h-full min-h-[480px] rounded-3xl overflow-hidden border border-slate-200 shadow-md flex flex-col justify-between select-none">
      {/* Real Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0 bg-slate-100" />

      {/* Top Floating Controls */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold text-slate-800 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>Mumbai Live Traffic &amp; OpenStreetMap</span>
        </div>

        <div className="pointer-events-auto bg-white/95 backdrop-blur px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-extrabold text-blue-600">{locations.length}</span> Spots Active
        </div>
      </div>

      {/* Right Floating Map Controls */}
      <div className="relative z-10 self-end p-3 flex flex-col gap-2 pointer-events-none">
        <div className="pointer-events-auto flex flex-col rounded-2xl bg-white/95 backdrop-blur border border-slate-200 shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-100 text-slate-700 transition border-b border-slate-100"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 text-slate-700 transition border-b border-slate-100"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCenter}
            className="p-2 hover:bg-slate-100 text-blue-600 transition"
            title="Center on Search"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Floating Legend / Route notice */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur text-white text-[11px] px-3.5 py-1.5 rounded-xl shadow flex items-center gap-2">
          <span className="text-blue-400 font-bold">Tip:</span>
          <span>Click any pin to inspect rates, view route, &amp; lock bay</span>
        </div>

        <div className="pointer-events-auto bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] text-slate-500">
          OpenStreetMap &bull; CartoDB
        </div>
      </div>
    </div>
  );
}
