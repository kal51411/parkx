"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import { Booking } from "@/lib/api/types";
import { 
  CalendarCheck, 
  MapPin, 
  ChevronRight, 
  Clock, 
  Car, 
  Loader2, 
  ShieldCheck 
} from "lucide-react";
import toast from "react-hot-toast";

export default function BookingsListPage() {
  const user = useAuthStore((s) => s.user);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;
      try {
        const res = await apiClient.get("/bookings");
        setBookings(res.data.items || []);
      } catch (err) {
        toast.error("Failed to fetch bookings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <Car className="w-12 h-12 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-800">Please sign in to view your bookings</h2>
        <Link
          href="/login"
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Bookings</h1>
          <p className="text-xs text-slate-500">Access your active parking passes and past invoices</p>
        </div>
        <Link
          href="/search"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
        >
          + Find Parking
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No bookings yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Discover verified parking spots across Mumbai with guaranteed reservations.
          </p>
          <Link
            href="/search"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            Explore Spots in Mumbai
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="block p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow hover:border-blue-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {b.booking_ref}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      b.status === "CONFIRMED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : b.status === "CHECKED_IN"
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : b.status === "COMPLETED"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-rose-50 text-rose-700"
                    }`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800">
                    {b.parking_location?.name || "Mumbai Parking Space"}
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(b.start_time).toLocaleDateString()} &bull;{" "}
                    {new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{" "}
                    {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-right shrink-0 flex flex-col justify-between items-end h-full">
                  <div className="text-sm font-black text-slate-900">
                    ₹{Math.round(b.total_price)}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 flex items-center gap-0.5 mt-4">
                    View QR Pass
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
