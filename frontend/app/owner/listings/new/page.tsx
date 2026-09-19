"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { ArrowLeft, Building2, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function NewListingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    latitude: 19.0544,
    longitude: 72.8402,
    parking_type: "OPEN",
    total_spaces: 5,
    base_hourly_price: 50,
    vehicle_types_allowed: ["CAR"],
    amenities: {
      cctv: true,
      security: true,
      covered: false,
      ev_charging: false,
      valet: false,
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await apiClient.post("/parking", form);
      const locationId = res.data.id;

      // Automatically create initial bays
      for (let i = 1; i <= Math.min(form.total_spaces, 10); i++) {
        await apiClient.post(`/parking/${locationId}/spaces`, {
          space_number: `A-${i < 10 ? '0' + i : i}`,
          vehicle_type: "CAR",
          is_covered: form.amenities.covered,
          has_ev_charging: form.amenities.ev_charging,
        });
      }

      toast.success("Parking spot published successfully!");
      router.push("/owner/listings");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to create listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full p-4 space-y-6">
      <Link
        href="/owner/listings"
        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Listings
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">List a New Parking Space</h1>
          <p className="text-xs text-slate-500">Provide precise GPS coordinates and pricing details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Location Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Hill Road Executive Parking"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Detailed Address</label>
            <textarea
              required
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. Plot 44, Near Bandra Station, Bandra West, Mumbai 400050"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Latitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Longitude</label>
              <input
                type="number"
                step="0.0001"
                required
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Parking Type</label>
              <select
                value={form.parking_type}
                onChange={(e) => setForm({ ...form, parking_type: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
              >
                <option value="OPEN">Open Plot</option>
                <option value="COVERED">Covered Bay</option>
                <option value="BASEMENT">Basement</option>
                <option value="MULTILEVEL">Multi-level</option>
                <option value="VALET">Valet Lot</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Number of Bays</label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={form.total_spaces}
                onChange={(e) => setForm({ ...form, total_spaces: parseInt(e.target.value) || 1 })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-medium"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Base Hourly Rate (₹)</label>
              <input
                type="number"
                min={10}
                max={1000}
                required
                value={form.base_hourly_price}
                onChange={(e) => setForm({ ...form, base_hourly_price: parseFloat(e.target.value) || 10 })}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-bold text-blue-600"
              />
            </div>
          </div>

          {/* Amenities checklist */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-semibold text-slate-700">Available Amenities</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(form.amenities).map(([key, checked]) => (
                <label key={key} className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amenities: { ...form.amenities, [key]: e.target.checked },
                      })
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="capitalize text-slate-700 font-medium">{key.replace("_", " ")}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing Space &amp; Creating Bays...
              </>
            ) : (
              "Publish Parking Spot"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
