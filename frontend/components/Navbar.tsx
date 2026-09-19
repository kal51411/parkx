"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Car, 
  CalendarCheck, 
  LayoutDashboard, 
  QrCode, 
  ShieldCheck, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Sparkles 
} from "lucide-react";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
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
        <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-slate-600">
          <Link
            href="/search"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
          >
            <Car className="w-4 h-4" />
            Find Parking
          </Link>
          {user && (
            <Link
              href="/bookings"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <CalendarCheck className="w-4 h-4" />
              My Bookings
            </Link>
          )}
          {user && (user.role === "PARKING_OWNER" || user.role === "SOCIETY_ADMIN" || user.role === "PLATFORM_ADMIN") && (
            <Link
              href="/owner/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              Owner Portal
            </Link>
          )}
          {user && (user.role === "SECURITY" || user.role === "PLATFORM_ADMIN") && (
            <Link
              href="/security/scan"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <QrCode className="w-4 h-4" />
              Security Gate
            </Link>
          )}
          {user && user.role === "PLATFORM_ADMIN" && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Auth state */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.full_name}
                </span>
                <span className="text-xs text-slate-400 capitalize">
                  {user.role.toLowerCase().replace("_", " ")}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 transition"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
