"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import { OwnerOverviewMetrics } from "@/lib/api/types";
import { 
  DollarSign, 
  Car, 
  TrendingUp, 
  Star, 
  Percent, 
  Plus, 
  Sparkles, 
  AlertTriangle,
  Loader2 
} from "lucide-react";
import toast from "react-hot-toast";

export default function OwnerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [metrics, setMetrics] = useState<OwnerOverviewMetrics | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [overviewRes, revRes] = await Promise.all([
          apiClient.get("/analytics/owner/overview"),
          apiClient.get("/analytics/owner/revenue?days=14"),
        ]);
        setMetrics(overviewRes.data);
        setRevenueTrend(revRes.data.items || []);
      } catch (err) {
        toast.error("Failed to load owner analytics");
      } finally {
        setIsLoading(false);
      }
    };
    if (user) fetchAnalytics();
  }, [user]);

  if (isLoading || !metrics) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Space Owner Dashboard</h1>
          <p className="text-xs text-slate-500">Live occupancy, dynamic earnings, and portfolio performance</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/owner/ai"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            AI Operations Advisor
          </Link>
          <Link
            href="/owner/listings/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Parking Space
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Today&apos;s Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{Math.round(metrics.today_revenue)}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Monthly: ₹{Math.round(metrics.monthly_revenue)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Occupancy</span>
            <Percent className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {metrics.occupancy_percentage}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {metrics.current_occupancy} of {metrics.total_spaces} spaces full
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Today&apos;s Bookings</span>
            <Car className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.today_bookings}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {metrics.available_spaces} spaces currently free
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Quality Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {metrics.average_rating > 0 ? metrics.average_rating.toFixed(1) : "5.0"}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            No-show rate: {metrics.no_show_rate}%
          </p>
        </div>
      </div>

      {/* Revenue History & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Revenue Velocity (Last 14 Days)</h2>
            <span className="text-xs text-slate-400">INR</span>
          </div>

          {revenueTrend.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No transactions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {revenueTrend.slice(-7).map((item) => (
                <div key={item.date} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600 font-medium">{item.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{item.bookings} bookings</span>
                    <span className="font-bold text-slate-900">₹{Math.round(item.revenue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links & Portfolio Management */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Manage Portfolio</h3>
            <div className="space-y-2 text-xs">
              <Link
                href="/owner/listings"
                className="block p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 font-semibold text-slate-800 hover:text-blue-600 transition"
              >
                View My Listings &rarr;
              </Link>
              <Link
                href="/owner/listings/new"
                className="block p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 font-semibold text-slate-800 hover:text-blue-600 transition"
              >
                Publish New Location &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 p-6 rounded-2xl text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-300" />
              <h4 className="font-bold text-sm">ParkX AI Copilot</h4>
            </div>
            <p className="text-xs text-purple-200 leading-relaxed">
              Ask questions about your occupancy drops, peak demand hours, or calculate dynamic price adjustments directly with Google Gemini.
            </p>
            <Link
              href="/owner/ai"
              className="inline-block px-4 py-2 rounded-lg bg-white text-purple-950 font-bold text-xs shadow hover:bg-purple-50 transition"
            >
              Open AI Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
