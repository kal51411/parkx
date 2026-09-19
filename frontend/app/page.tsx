import Link from "next/link";
import { 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Zap, 
  DollarSign, 
  Building2, 
  ChevronRight, 
  CheckCircle2, 
  Search,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-slate-50 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Live across Bandra, Andheri, Powai & BKC
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Never circle Mumbai for parking again.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
            ParkX connects Mumbai drivers with verified private and society parking spaces. 
            Instant reservation, dynamic pricing, seamless QR check-in.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              href="/search"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition text-base"
            >
              <Search className="w-5 h-5" />
              Find Parking Now
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition text-base"
            >
              List Your Space
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-blue-600">100%</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Guaranteed Space Hold</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-blue-600">&lt; 15s</div>
              <div className="text-xs font-medium text-slate-500 mt-1">QR Gate Clearance</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-blue-600">0 Overlaps</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Atomic Lock Engine</div>
            </div>
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-sm">
              <div className="text-2xl font-black text-blue-600">₹40 - ₹80</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Avg Hourly Pricing</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Personas Grid */}
      <section className="py-16 px-4 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
          An End-to-End Infrastructure for Mumbai Mobility
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Driver */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                🚗
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Drivers</h3>
              <p className="text-sm text-slate-600">
                Search spots near your destination by radius and arrival window. Reserve with double-booking prevention, pay digitally, and scan your QR pass at entry.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Live PostGIS geospatial search
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  8-minute checkout reservation hold
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Instant QR booking pass on phone
                </li>
              </ul>
            </div>
            <Link
              href="/search"
              className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
            >
              Launch Driver App
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Owner & Society */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                🏢
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Space Owners & Societies</h3>
              <p className="text-sm text-slate-600">
                Monetize vacant residential bays and commercial floors. Set recurring day schedules, let our dynamic algorithm optimize prices, and consult the AI operations advisor.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Automated revenue & occupancy analytics
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Peak-hour multiplier rules
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  Gemini-backed SQL data advisor
                </li>
              </ul>
            </div>
            <Link
              href="/owner/dashboard"
              className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
            >
              Open Owner Dashboard
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xl">
                🛡️
              </div>
              <h3 className="text-xl font-bold text-slate-900">For Security & Valet</h3>
              <p className="text-sm text-slate-600">
                Equip gate guards with an ultra-fast scanning dashboard. Validate QR passes instantly, verify plate numbers, monitor expected arrivals, and track overstays.
              </p>
              <ul className="space-y-2 text-xs text-slate-600 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  Sub-second QR pass verification
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  Live expected arrivals list
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  One-tap check-in & check-out log
                </li>
              </ul>
            </div>
            <Link
              href="/security/scan"
              className="mt-6 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition"
            >
              Open Gate Scanner
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
