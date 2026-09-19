"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { ParkingLocation } from "@/lib/api/types";
import { 
  Building2, 
  MapPin, 
  Plus, 
  ShieldCheck, 
  Star, 
  Loader2,
  ArrowLeft 
} from "lucide-react";
import toast from "react-hot-toast";

export default function OwnerListingsPage() {
  const [listings, setListings] = useState<ParkingLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListings = async () => {
    try {
      const res = await apiClient.get("/parking/owner/listings");
      setListings(res.data.items || []);
    } catch (err) {
      toast.error("Failed to load owner listings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleVerifyRequest = async (id: string) => {
    try {
      await apiClient.post(`/parking/${id}/verify`);
      toast.success("Submitted for administrative verification!");
      fetchListings();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to submit");
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full p-4 space-y-6">
      <Link
        href="/owner/dashboard"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Parking Spots</h1>
          <p className="text-xs text-slate-500">Manage rates, bays, verification badges, and live schedules</p>
        </div>
        <Link
          href="/owner/listings/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          List New Space
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : listings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800">No parking locations listed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            List your residential driveway, building bay, or commercial lot to start earning immediately.
          </p>
          <Link
            href="/owner/listings/new"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20"
          >
            Create First Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((loc) => (
            <div
              key={loc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{loc.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {loc.address}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  loc.status === "VERIFIED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : loc.status === "UNDER_REVIEW"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}>
                  {loc.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 text-center text-xs">
                <div>
                  <span className="text-slate-400">Total Bays</span>
                  <div className="font-bold text-slate-800">{loc.total_spaces}</div>
                </div>
                <div>
                  <span className="text-slate-400">Base Rate</span>
                  <div className="font-bold text-blue-600">₹{Math.round(loc.base_hourly_price)}/hr</div>
                </div>
                <div>
                  <span className="text-slate-400">Rating</span>
                  <div className="font-bold text-amber-600">★ {loc.average_rating || "New"}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                {loc.status === "PENDING_VERIFICATION" && (
                  <button
                    onClick={() => handleVerifyRequest(loc.id)}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition"
                  >
                    Request Verification
                  </button>
                )}
                <Link
                  href={`/parking/${loc.id}`}
                  className="font-semibold text-slate-600 hover:text-blue-600 ml-auto"
                >
                  View Driver Listing &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
