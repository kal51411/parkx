"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, getApiBase, setApiBase, MUMBAI_DEMO_LOCATIONS } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
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
  SlidersHorizontal,
  Navigation,
  Lock,
  CheckCircle2,
  Settings,
  X,
  Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

const MUMBAI_NEIGHBORHOODS = [
  { name: "Bandra West", lat: 19.0544, lng: 72.8402 },
  { name: "BKC", lat: 19.0658, lng: 72.8695 },
  { name: "Andheri East", lat: 19.1136, lng: 72.8697 },
  { name: "Powai", lat: 19.1183, lng: 72.9067 },
  { name: "Lower Parel", lat: 18.9971, lng: 72.8260 },
  { name: "Marine Drive", lat: 18.9298, lng: 72.8235 },
  { name: "Vashi", lat: 19.0771, lng: 73.0071 },
];

const VEHICLE_OPTIONS = [
  { id: "TWO_WHEELER", label: "Bike / Scooter", icon: "🏍️", multiplier: 0.5 },
  { id: "CAR", label: "Sedan / Hatch", icon: "🚗", multiplier: 1.0 },
  { id: "SUV", label: "SUV / 4x4", icon: "🚙", multiplier: 1.3 },
  { id: "EV", label: "EV with Charger", icon: "⚡", multiplier: 1.2 },
];

export default function SearchPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [locations, setLocations] = useState<ParkingLocation[]>(MUMBAI_DEMO_LOCATIONS);
  const [selectedLocation, setSelectedLocation] = useState<ParkingLocation | null>(MUMBAI_DEMO_LOCATIONS[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Search parameters
  const [coords, setCoords] = useState({ lat: 19.0544, lng: 72.8402 }); // Bandra default
  const [radiusKm, setRadiusKm] = useState(15.0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [evCharging, setEvCharging] = useState(false);
  const [coveredOnly, setCoveredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Bandra West");
  const [selectedVehicle, setSelectedVehicle] = useState("CAR");

  // Quick Reserve Modal State
  const [quickReserveSpot, setQuickReserveSpot] = useState<ParkingLocation | null>(null);
  const [durationHours, setDurationHours] = useState(2);
  const [plateNumber, setPlateNumber] = useState("MH 02 CZ 9021");
  const [isReserving, setIsReserving] = useState(false);

  // Backend Config State
  const [showConfig, setShowConfig] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState("");

  useEffect(() => {
    setApiUrlInput(getApiBase());
  }, []);

  const fetchNearbyParking = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        latitude: coords.lat,
        longitude: coords.lng,
        radius_km: radiusKm,
        verified_only: verifiedOnly,
      };
      if (evCharging || selectedVehicle === "EV") params.ev_charging = true;
      if (coveredOnly) params.covered = true;

      const response = await apiClient.get("/parking/nearby", { params });
      const items = response.data.items || [];
      if (items.length > 0) {
        setLocations(items);
        if (!selectedLocation || !items.some((x: any) => x.id === selectedLocation.id)) {
          setSelectedLocation(items[0]);
        }
      } else {
        setLocations(MUMBAI_DEMO_LOCATIONS);
      }
    } catch (err) {
      // Fallback already handled in client.ts
      setLocations(MUMBAI_DEMO_LOCATIONS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyParking();
  }, [coords, radiusKm, verifiedOnly, evCharging, coveredOnly, selectedVehicle]);

  const handleSelectNeighborhood = (n: typeof MUMBAI_NEIGHBORHOODS[0]) => {
    setSearchQuery(n.name);
    setCoords({ lat: n.lat, lng: n.lng });
  };

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiUrlInput.trim()) return;
    setApiBase(apiUrlInput.trim());
    setShowConfig(false);
    toast.success("Backend URL updated! Refreshing data...");
    fetchNearbyParking();
  };

  const handleQuickReserve = async () => {
    if (!quickReserveSpot) return;

    setIsReserving(true);
    try {
      const spaceId = quickReserveSpot.spaces?.[0]?.id || "sp-bkc-1";

      // 1. Hold
      const holdRes = await apiClient.post("/bookings/hold", {
        space_id: spaceId,
        vehicle_id: "veh-1",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + durationHours * 3600000).toISOString(),
      });
      const booking = holdRes.data;

      // 2. Pay (Simulated Instant Confirmation)
      const orderRes = await apiClient.post("/payments/create-order", {
        booking_id: booking.id,
      });

      await apiClient.post("/payments/verify", {
        booking_id: booking.id,
        order_id: orderRes.data.order_id,
        payment_id: `pay_${Date.now()}`,
        signature: "sig_verified",
      });

      toast.success("Parking bay reserved & locked!");
      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      toast.error("Reservation conflict. Please try again.");
    } finally {
      setIsReserving(false);
    }
  };

  const currentMultiplier = VEHICLE_OPTIONS.find((v) => v.id === selectedVehicle)?.multiplier || 1.0;

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-4 gap-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destination, street, or landmark in Mumbai..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
            />
          </div>

          {/* Quick neighborhood chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {MUMBAI_NEIGHBORHOODS.map((n) => (
              <button
                key={n.name}
                onClick={() => handleSelectNeighborhood(n)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  searchQuery === n.name
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            title="Configure Backend Connection"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Vehicle Type Row */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pt-2 border-t border-slate-100 scrollbar-none">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Vehicle:</span>
            {VEHICLE_OPTIONS.map((veh) => (
              <button
                key={veh.id}
                onClick={() => setSelectedVehicle(veh.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  selectedVehicle === veh.id
                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{veh.icon}</span>
                <span>{veh.label}</span>
              </button>
            ))}
          </div>

          {/* Filter switches */}
          <div className="flex items-center gap-3 text-xs shrink-0">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-semibold text-slate-700">Verified</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={evCharging}
                onChange={(e) => setEvCharging(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span className="font-semibold text-slate-700">EV ⚡</span>
            </label>
          </div>
        </div>
      </div>

      {/* Backend API Configuration Drawer */}
      {showConfig && (
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in">
          <div className="space-y-1">
            <div className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Railway Backend Connection
            </div>
            <p className="text-xs text-slate-300">
              Paste your Railway or custom backend URL here (or leave as default for auto-fallback):
            </p>
          </div>
          <form onSubmit={handleSaveApiUrl} className="flex gap-2 w-full md:w-auto">
            <input
              type="url"
              required
              value={apiUrlInput}
              onChange={(e) => setApiUrlInput(e.target.value)}
              placeholder="https://parkx-api.up.railway.app"
              className="px-3 py-2 rounded-xl text-xs bg-slate-800 border border-slate-700 text-white flex-1 md:w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
            >
              Connect
            </button>
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Main Split Screen: Spots List + Real Interactive Map */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[550px]">
        {/* Left Column: Results List */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[720px] pr-1 scrollbar-thin">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              {locations.length} Spots in {searchQuery}
            </span>
            {isLoading && <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />}
          </div>

          {locations.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            const adjustedPrice = Math.round(loc.base_hourly_price * currentMultiplier);

            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className={`p-4 rounded-3xl bg-white border cursor-pointer transition shadow-sm hover:shadow-md ${
                  isSelected
                    ? "border-blue-600 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                        {loc.name}
                      </h3>
                      {loc.status === "VERIFIED" && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          <ShieldCheck className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{loc.address}</span>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-blue-600 leading-none">
                      ₹{adjustedPrice}
                      <span className="text-xs font-normal text-slate-400">/hr</span>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-bold mt-1">
                      {loc.available_spaces || loc.total_spaces} bays free
                    </div>
                  </div>
                </div>

                {/* Amenities Badges */}
                <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-600 overflow-x-auto scrollbar-none">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {loc.average_rating > 0 ? loc.average_rating.toFixed(1) : "4.8"}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="capitalize">{loc.parking_type.toLowerCase()}</span>
                  {loc.amenities?.ev_charging && (
                    <>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-emerald-700 font-medium">⚡ EV Fast Charge</span>
                    </>
                  )}
                  {loc.amenities?.valet && (
                    <>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-indigo-700 font-medium">Valet</span>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuickReserveSpot(loc);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Instant Hold (₹{adjustedPrice}/h)
                  </button>

                  <Link
                    href={`/parking/${loc.id}`}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                    title="View Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Interactive Leaflet Map with Real OpenStreetMap Tiles */}
        <div className="lg:col-span-7 h-full min-h-[500px]">
          <ParkingMap
            locations={locations}
            selectedId={selectedLocation?.id || null}
            onSelect={(loc) => {
              setSelectedLocation(loc);
              setQuickReserveSpot(loc);
            }}
            center={coords}
          />
        </div>
      </div>

      {/* Instant Quick-Reserve Drawer / Modal */}
      {quickReserveSpot && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Instant Spot Lock
                </span>
                <h2 className="text-lg font-black text-slate-900">{quickReserveSpot.name}</h2>
                <p className="text-xs text-slate-500 line-clamp-1">{quickReserveSpot.address}</p>
              </div>
              <button
                onClick={() => setQuickReserveSpot(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Vehicle Plate */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Vehicle Number Plate</label>
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="MH 02 CZ 9021"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase text-slate-800"
                />
              </div>

              {/* Duration Options */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Reservation Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 4, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setDurationHours(h)}
                      className={`py-2 rounded-xl font-bold border transition ${
                        durationHours === h
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {h} hr{h > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Rate per hour</span>
                  <span className="font-semibold">₹{Math.round(quickReserveSpot.base_hourly_price * currentMultiplier)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Duration</span>
                  <span className="font-semibold">{durationHours} Hours</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Atomic Lock Hold Guarantee</span>
                  <span className="text-emerald-600 font-bold">8:00 Min Free</span>
                </div>
                <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>Total Payable</span>
                  <span className="text-blue-600 text-base">
                    ₹{Math.round(quickReserveSpot.base_hourly_price * currentMultiplier * durationHours)}
                  </span>
                </div>
              </div>

              {/* Reserve Button */}
              <button
                onClick={handleQuickReserve}
                disabled={isReserving}
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isReserving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Locking Bay &amp; Issuing Pass...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Confirm &amp; Generate QR Pass
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-slate-400">
                Cancel anytime before arrival for an instant 100% refund.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
