"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { getApiBase, setApiBase } from "@/lib/api/client";
import { 
  Car, 
  CalendarCheck, 
  LayoutDashboard, 
  QrCode, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sparkles,
  Settings,
  CheckCircle2,
  X
} from "lucide-react";
import toast from "react-hot-toast";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  useEffect(() => {
    setUrlInput(getApiBase());
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setApiBase(urlInput.trim());
    setShowConfigModal(false);
    toast.success("Backend URL connected!");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
              🅿
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Park<span className="text-blue-600">X</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-block">
              Mumbai
            </span>
          </Link>

          {/* Center navigation links */}
          <nav className="hidden md:flex items-center gap-1 font-semibold text-xs text-slate-600">
            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <Car className="w-4 h-4" />
              Find Parking
            </Link>
            <Link
              href="/bookings"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <CalendarCheck className="w-4 h-4" />
              My Passes
            </Link>
            <Link
              href="/owner/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              Owner Portal
            </Link>
            <Link
              href="/security/scan"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <QrCode className="w-4 h-4" />
              Gate Scanner
            </Link>
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Backend Connectivity Status Button */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              title="Configure Backend URL"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Backend Ready</span>
              <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize">
                    {user.role.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-1 text-xs font-bold px-3.5 py-2 rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Backend Settings Dialog */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Backend API URL</h3>
                <p className="text-xs text-slate-500">Configure your Railway deployment endpoint</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="space-y-3">
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-railway-app.up.railway.app"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
              />

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Auto-Fallback Mode Active:</div>
                <p className="text-[11px] text-slate-500">
                  If your Railway container is asleep or cold starting, ParkX automatically serves full realistic Mumbai data so the UI remains completely functional.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                >
                  Save &amp; Connect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUrlInput("http://localhost:8000");
                    setApiBase("http://localhost:8000");
                    setShowConfigModal(false);
                    toast.success("Reset to default local URL");
                  }}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
