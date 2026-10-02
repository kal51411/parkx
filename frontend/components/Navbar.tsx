"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  Settings, 
  X,
  Menu,
  Navigation,
  ArrowUpRight,
  Radio
} from "lucide-react";
import toast from "react-hot-toast";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUrlInput(getApiBase());

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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

  const isHome = pathname === "/";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-2.5 bg-parkx-black/90 backdrop-blur-xl border-b border-parkx-border shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
            : "py-4 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Brand & Urban Status */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="group flex items-center gap-2.5"
              data-cursor="HOME"
            >
              <div className="w-8 h-8 rounded-lg bg-parkx-pink flex items-center justify-center text-white font-black text-base shadow-[0_0_20px_rgba(255,45,120,0.5)] group-hover:scale-105 transition-transform">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight text-white leading-none">
                  PARK<span className="text-parkx-pink">X</span>
                </span>
                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase leading-none mt-0.5">
                  MUMBAI GRID
                </span>
              </div>
            </Link>

            {/* Live Mesh telemetry chip */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-parkx-surface border border-parkx-border text-[10px] font-mono text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-parkx-green animate-pulse" />
              <span className="text-slate-400">19°03&apos;N 72°52&apos;E</span>
              <span className="text-slate-600">|</span>
              <span className="text-parkx-green font-bold">GRID ONLINE</span>
            </div>
          </div>

          {/* Center Navigation Links for Homepage & Core Sections */}
          <nav className="hidden md:flex items-center gap-1 font-mono text-xs text-slate-300 bg-parkx-surface/80 px-3 py-1.5 rounded-full border border-parkx-border/80 backdrop-blur-md">
            {isHome ? (
              <>
                <a
                  href="#network"
                  className="px-3 py-1 rounded-full hover:text-white hover:bg-white/5 transition"
                  data-cursor="MAP"
                >
                  NETWORK
                </a>
                <a
                  href="#problem"
                  className="px-3 py-1 rounded-full hover:text-white hover:bg-white/5 transition"
                  data-cursor="INSIGHT"
                >
                  CRISIS
                </a>
                <a
                  href="#experiences"
                  className="px-3 py-1 rounded-full hover:text-white hover:bg-white/5 transition"
                  data-cursor="EXP"
                >
                  SYSTEMS
                </a>
                <a
                  href="#stats"
                  className="px-3 py-1 rounded-full hover:text-white hover:bg-white/5 transition"
                  data-cursor="DATA"
                >
                  TELEMETRY
                </a>
              </>
            ) : null}

            <Link
              href="/search"
              className={`px-3 py-1 rounded-full transition flex items-center gap-1 ${
                pathname === "/search"
                  ? "bg-parkx-pink text-white font-bold"
                  : "hover:text-white hover:bg-white/5"
              }`}
              data-cursor="FIND"
            >
              FIND
            </Link>

            <Link
              href="/bookings"
              className={`px-3 py-1 rounded-full transition ${
                pathname.startsWith("/bookings")
                  ? "bg-parkx-pink text-white font-bold"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              PASSES
            </Link>

            <Link
              href="/owner/dashboard"
              className={`px-3 py-1 rounded-full transition ${
                pathname.startsWith("/owner")
                  ? "bg-parkx-pink text-white font-bold"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              OWNER
            </Link>

            <Link
              href="/security/scan"
              className={`px-3 py-1 rounded-full transition ${
                pathname.startsWith("/security")
                  ? "bg-parkx-pink text-white font-bold"
                  : "hover:text-white hover:bg-white/5"
              }`}
            >
              SCANNER
            </Link>
          </nav>

          {/* Right Section CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backend config button */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-parkx-surface hover:bg-parkx-border text-slate-400 hover:text-white text-[11px] font-mono border border-parkx-border transition"
              title="Configure API Endpoint"
            >
              <Radio className="w-3.5 h-3.5 text-parkx-cyan" />
              <span>API</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200 leading-tight">
                    {user.full_name}
                  </span>
                  <span className="text-[10px] font-mono text-parkx-pink capitalize">
                    {user.role.toLowerCase().replace("_", " ")}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg bg-parkx-surface border border-parkx-border text-slate-400 hover:text-white hover:bg-parkx-border transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  SIGN IN
                </Link>
                <Link
                  href="/search"
                  className="px-4 py-1.5 rounded-lg bg-parkx-pink hover:bg-parkx-pink-light text-white text-xs font-bold font-mono tracking-wider shadow-[0_0_15px_rgba(255,45,120,0.4)] transition-all hover:scale-105 flex items-center gap-1"
                  data-cursor="PARK"
                >
                  <span>FIND PARKING</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-parkx-surface border border-parkx-border text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-parkx-black/95 border-b border-parkx-border px-4 py-6 space-y-4 backdrop-blur-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-3 border-b border-parkx-border">
              <span>MUMBAI NETWORK MESH</span>
              <span className="text-parkx-green font-bold">● ACTIVE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <Link
                href="/search"
                className="p-3 rounded-xl bg-parkx-surface border border-parkx-border text-white font-bold flex items-center gap-2"
              >
                <Car className="w-4 h-4 text-parkx-pink" />
                Find Parking
              </Link>
              <Link
                href="/bookings"
                className="p-3 rounded-xl bg-parkx-surface border border-parkx-border text-white font-bold flex items-center gap-2"
              >
                <CalendarCheck className="w-4 h-4 text-parkx-cyan" />
                My Passes
              </Link>
              <Link
                href="/owner/dashboard"
                className="p-3 rounded-xl bg-parkx-surface border border-parkx-border text-white font-bold flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4 text-parkx-amber" />
                Owner Portal
              </Link>
              <Link
                href="/security/scan"
                className="p-3 rounded-xl bg-parkx-surface border border-parkx-border text-white font-bold flex items-center gap-2"
              >
                <QrCode className="w-4 h-4 text-parkx-green" />
                Gate Scanner
              </Link>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/register"
                className="w-full py-3 rounded-xl bg-parkx-pink text-white font-bold text-center text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(255,45,120,0.4)]"
              >
                LIST YOUR SPACE →
              </Link>
              {!user && (
                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-xl bg-parkx-surface border border-parkx-border text-slate-300 hover:text-white font-mono text-xs text-center"
                >
                  Sign In to Account
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Backend Settings Dialog */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-parkx-surface rounded-2xl border border-parkx-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-white">Backend Gateway</h3>
                <p className="text-xs text-slate-400 font-mono">Connect live or local API endpoint</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1 rounded-lg hover:bg-parkx-border text-slate-400 hover:text-white"
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
                placeholder="https://parkx-api.up.railway.app"
                className="w-full p-3 rounded-xl bg-parkx-black border border-parkx-border text-xs font-mono text-white focus:outline-none focus:border-parkx-pink"
              />

              <div className="p-3 rounded-xl bg-parkx-black border border-parkx-border text-xs text-slate-400 space-y-1">
                <div className="font-bold text-slate-200">Resilient Mumbai Fallback:</div>
                <p className="text-[11px] text-slate-400">
                  When deployed instances are warming up, ParkX seamlessly simulates full Mumbai telemetry so all booking &amp; gate features remain 100% interactive.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-parkx-pink hover:bg-parkx-pink-light text-white text-xs font-bold font-mono transition"
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
                  className="px-3 py-2.5 rounded-xl border border-parkx-border text-slate-400 hover:text-white text-xs font-mono"
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
