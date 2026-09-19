"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  CalendarCheck, 
  DollarSign, 
  Check, 
  X, 
  Loader2 
} from "lucide-react";
import toast from "react-hot-toast";

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [queue, setQueue] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsRes, queueRes, usersRes] = await Promise.all([
        apiClient.get("/admin/analytics"),
        apiClient.get("/admin/verification-queue"),
        apiClient.get("/admin/users?page_size=10"),
      ]);
      setAnalytics(statsRes.data);
      setQueue(queueRes.data.items || []);
      setUsers(usersRes.data.items || []);
    } catch (err) {
      toast.error("Failed to load admin telemetry");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await apiClient.put(`/admin/listings/${id}/verify`);
      toast.success("Listing verified and activated!");
      fetchAdminData();
    } catch (err) {
      toast.error("Approval failed");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiClient.put(`/admin/listings/${id}/reject?reason=Verification+failed`);
      toast.success("Listing rejected");
      fetchAdminData();
    } catch (err) {
      toast.error("Rejection failed");
    }
  };

  if (isLoading || !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Platform Admin</h1>
          <p className="text-xs text-slate-500">City-wide parking operations, trust &amp; verification audit</p>
        </div>
        <div className="text-xs font-bold px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full">
          Superadmin Mode
        </div>
      </div>

      {/* Platform Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{analytics.total_users}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Locations Listed</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{analytics.total_locations}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Total Bookings</span>
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{analytics.total_bookings}</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Gross Marketplace GMV</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹{Math.round(analytics.total_revenue)}</div>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Spot Verification Queue ({queue.length})
          </h2>
          <span className="text-xs text-slate-400">Requires physical check or property deed verification</span>
        </div>

        {queue.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No pending verifications. All spots are reviewed!</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {queue.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                  <div className="text-slate-500 mt-0.5">{item.address}</div>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                    Status: {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve &amp; Verify
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Users Audit Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">User Audit Directory</h2>
        <div className="divide-y divide-slate-100 text-xs">
          {users.map((u) => (
            <div key={u.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-800">{u.full_name}</div>
                <div className="text-slate-400">{u.email}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-slate-600 capitalize">
                  {u.role.toLowerCase().replace("_", " ")}
                </span>
                <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-rose-500"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
