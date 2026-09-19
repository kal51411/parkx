"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { ParkingLocation, VehicleType } from "@/lib/api/types";
import { ParkingMap } from "@/components/map/ParkingMap";
import { formatPrice } from "@/lib/utils";
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Zap, 
  Filter, 
  Clock, 
  Car, 
  ChevronRight, 
  Loader2,
  SlidersHorizontal
} from "lucide-react";
import toast from "react-hot-toast";

const MUMBAI_NEIGHBORHOODS = [
  { name: "Bandra West", lat: 19.0544, lng: 72.8402 },
  { name: "BKC", lat: 19.0658, lng: 72.8695 },
  { name: "Andheri East", lat: 19.1136, lng: 72.8697 },
  { name: "Powai", lat: 19.1183, lng: 72.9067 },
  { name: "Lower Parel", lat: 18.9971, lng: 72.8260 },
  { name: "Vashi, Navi Mumbai", lat: 19.0771, lng: 73.0071 },
];

export default function SearchPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<ParkingLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search parameters
  const [coords, setCoords] = useState({ lat: 19.0544, lng: 72.8402 }); // Bandra default
  const [radiusKm, setRadiusKm] = useState(15.0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [evCharging, setEvCharging] = useState(false);
  const [coveredOnly, setCoveredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Bandra West");
  const [viewMode, setViewMode] = useState<"split" | "map" | "list">("split");

  const fetchNearbyParking = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        latitude: coords.lat,
        longitude: coords.lng,
        radius_km: radiusKm,
        verified_only: verifiedOnly,
      };
      if (evCharging) params.ev_charging = true;
      if (coveredOnly) params.covered = true;

      const response = await apiClient.get("/parking/nearby", { params });
      const items = response.data.items || [];
      setLocations(items);
      if (items.length > 0 && !selectedLocation) {
        setSelectedLocation(items[0]);
      }
    } catch (err) {
      toast.error("Failed to load nearby parking spaces");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyParking();
  }, [coords, radiusKm, verifiedOnly, evCharging, coveredOnly]);

  const handleSelectNeighborhood = (n: typeof MUMBAI_NEIGHBORHOODS[0]) => {
    setSearchQuery(n.name);
    setCoords({ lat: n.lat, lng: n.lng });
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 gap-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination in Mumbai..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          {/* Quick neighborhood chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {MUMBAI_NEIGHBORHOODS.map((n) => (
              <button
                key={n.name}
                onClick={() => handleSelectNeighborhood(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  searchQuery === n.name
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filter toggles */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-medium text-slate-700">Verified Only</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={evCharging}
                onChange={(e) => setEvCharging(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-medium text-slate-700">EV Charging ⚡</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={coveredOnly}
                onChange={(e) => setCoveredOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-medium text-slate-700">Covered Parking</span>
            </label>
          </div>

          <div className="text-slate-500 font-medium">
            Radius: <span className="font-bold text-slate-800">{radiusKm} km</span>
          </div>
        </div>
      </div>

      {/* Main Content: Split Map + List */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[500px]">
        {/* Left Column: Results List */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[750px] pr-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locations.length} Available Parking Locations
            </span>
            {isLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
          </div>

          {locations.length === 0 && !isLoading && (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="text-3xl">🚗</div>
              <h3 className="font-bold text-slate-800">No parking spaces found</h3>
              <p className="text-xs text-slate-500">
                Try expanding your search radius or selecting a different neighborhood.
              </p>
              <button
                onClick={() => setRadiusKm(30)}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              >
                Expand Search Radius to 30km
              </button>
            </div>
          )}

          {locations.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className={`p-4 rounded-2xl bg-white border cursor-pointer transition shadow-sm hover:shadow ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/20"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{loc.name}</h3>
                      {loc.status === "VERIFIED" && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{loc.address}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-extrabold text-blue-600">
                      ₹{Math.round(loc.base_hourly_price)}
                      <span className="text-xs font-normal text-slate-400">/hr</span>
                    </div>
                    {loc.distance_m !== undefined && (
                      <div className="text-[11px] text-slate-400">
                        {(loc.distance_m / 1000).toFixed(1)} km away
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-amber-600 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {loc.average_rating > 0 ? loc.average_rating.toFixed(1) : "New"}
                      <span className="text-slate-400 font-normal">({loc.total_reviews})</span>
                    </span>
                    <span className="text-slate-600 font-medium">
                      {loc.available_spaces || loc.total_spaces} spaces free
                    </span>
                  </div>

                  <Link
                    href={`/parking/${loc.id}`}
                    className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Reserve
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Interactive Map */}
        <div className="lg:col-span-7 h-full min-h-[450px]">
          <ParkingMap
            locations={locations}
            selectedId={selectedLocation?.id || null}
            onSelect={(loc) => setSelectedLocation(loc)}
            center={coords}
          />
        </div>
      </div>
    </div>
  );
}
