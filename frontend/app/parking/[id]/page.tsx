"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import { ParkingLocation, ParkingSpace, Vehicle } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils";
import { 
  ShieldCheck, 
  MapPin, 
  Star, 
  Zap, 
  Car, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Lock, 
  Loader2,
  ArrowLeft
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ParkingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [location, setLocation] = useState<ParkingLocation | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(2);
  const [startTime, setStartTime] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return d.toISOString().slice(0, 16);
  });
  const [reviews, setReviews] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);

  // New vehicle form state
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newPlate, setNewPlate] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [locRes, revRes] = await Promise.all([
          apiClient.get(`/parking/${id}`),
          apiClient.get(`/reviews/location/${id}`),
        ]);
        setLocation(locRes.data);
        setReviews(revRes.data.items || []);

        if (locRes.data.spaces && locRes.data.spaces.length > 0) {
          setSelectedSpaceId(locRes.data.spaces[0].id);
        }

        // Fetch user vehicles if logged in
        if (user) {
          const vehRes = await apiClient.get("/users/me/vehicles");
          setVehicles(vehRes.data);
          if (vehRes.data.length > 0) {
            setSelectedVehicleId(vehRes.data[0].id);
          }
        }
      } catch (err) {
        toast.error("Failed to load parking spot details");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) loadData();
  }, [id, user]);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post("/users/me/vehicles", {
        plate_number: newPlate.toUpperCase(),
        vehicle_type: "CAR",
        make: "Standard",
        model: "Vehicle",
      });
      setVehicles([...vehicles, res.data]);
      setSelectedVehicleId(res.data.id);
      setShowAddVehicle(false);
      setNewPlate("");
      toast.success("Vehicle registered!");
    } catch (err: any) {
      toast.error("Failed to register vehicle");
    }
  };

  const handleReserve = async () => {
    if (!user) {
      toast.error("Please login to reserve parking");
      router.push("/login");
      return;
    }

    if (!selectedVehicleId) {
      toast.error("Please select or add a vehicle first");
      return;
    }

    if (!selectedSpaceId) {
      toast.error("No parking bay available");
      return;
    }

    setIsHolding(true);
    try {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + durationHours * 3600 * 1000);

      // 1. Create Hold
      const holdRes = await apiClient.post("/bookings/hold", {
        space_id: selectedSpaceId,
        vehicle_id: selectedVehicleId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      });
      const booking = holdRes.data;
      toast.success("Reservation slot held! Completing payment...");

      // 2. Create Payment Order
      const orderRes = await apiClient.post("/payments/create-order", {
        booking_id: booking.id,
      });
      const order = orderRes.data;

      // 3. Complete Payment Verification (Mock / instant confirmation flow)
      const verifyRes = await apiClient.post("/payments/verify", {
        booking_id: booking.id,
        order_id: order.order_id,
        payment_id: `pay_${Date.now()}`,
        signature: "auto_verified",
      });

      toast.success("Booking confirmed! Generating QR pass...");
      router.push(`/bookings/${booking.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Slot conflict. Please select another time or space.";
      toast.error(msg);
    } finally {
      setIsHolding(false);
    }
  };

  if (isLoading || !location) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const basePrice = location.base_hourly_price * durationHours;

  return (
    <div className="max-w-6xl mx-auto w-full p-4 space-y-6">
      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Search
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">{location.name}</h1>
                  {location.status === "VERIFIED" && (
                    <span className="flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {location.address}, Mumbai
                </p>
              </div>

              <div className="text-right">
                <div className="text-2xl font-black text-blue-600">
                  ₹{Math.round(location.base_hourly_price)}
                  <span className="text-xs font-normal text-slate-400">/hr</span>
                </div>
                <div className="flex items-center gap-1 justify-end text-xs text-amber-600 font-bold mt-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {location.average_rating > 0 ? location.average_rating.toFixed(1) : "New"}
                  <span className="text-slate-400 font-normal">({location.total_reviews} reviews)</span>
                </div>
              </div>
            </div>

            {location.description && (
              <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                {location.description}
              </p>
            )}

            {/* Amenities Grid */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Amenities & Features
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {location.amenities && Object.entries(location.amenities).map(([key, val]) => {
                  if (!val) return null;
                  return (
                    <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 capitalize">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {key.replace("_", " ")}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Parking Spaces */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Parking Bays ({location.spaces?.length || 0})
              </h3>
              <div className="flex flex-wrap gap-2">
                {location.spaces?.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSpaceId(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      selectedSpaceId === s.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Bay {s.space_number} {s.has_ev_charging && "⚡"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Driver Reviews ({reviews.length})
            </h3>
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400">No reviews yet for this spot.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {rev.rating}/5
                      </div>
                      <span className="text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reservation Panel */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Instant Reservation</h2>
              <p className="text-xs text-slate-500">Atomic lock guarantee with zero double-booking</p>
            </div>

            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Select Vehicle</label>
                <button
                  type="button"
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  {showAddVehicle ? "Cancel" : "+ Add Vehicle"}
                </button>
              </div>

              {showAddVehicle ? (
                <form onSubmit={handleAddVehicle} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    required
                    placeholder="MH 01 AB 1234"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 uppercase font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white"
                  >
                    Save
                  </button>
                </form>
              ) : vehicles.length === 0 ? (
                <button
                  onClick={() => setShowAddVehicle(true)}
                  className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500 hover:bg-slate-50 transition"
                >
                  No vehicle saved. Click to add your plate number.
                </button>
              ) : (
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate_number} — {v.make} {v.model} ({v.vehicle_type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Arrival Time */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Arrival Time</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-slate-300"
              />
            </div>

            {/* Duration Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Duration: <span className="text-blue-600 font-bold">{durationHours} Hours</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 4, 8].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setDurationHours(h)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition ${
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

            {/* Price Breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Rate (₹{Math.round(location.base_hourly_price)} × {durationHours}h)</span>
                <span>₹{Math.round(basePrice)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform &amp; Gate Verification</span>
                <span className="text-emerald-600 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Estimated Total</span>
                <span className="text-blue-600 text-base">₹{Math.round(basePrice)}</span>
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleReserve}
              disabled={isHolding}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isHolding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Securing Spot &amp; Generating Pass...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Reserve &amp; Pay ₹{Math.round(basePrice)}
                </>
              )}
            </button>

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Protected by 8-minute reservation lock. Instant refund if cancelled before arrival.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
