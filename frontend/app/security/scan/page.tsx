"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { 
  QrCode, 
  ShieldCheck, 
  Car, 
  User, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  LogOut,
  ArrowRight,
  Camera,
  Volume2,
  Sparkles,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";

export default function SecurityGateScannerPage() {
  const [tokenInput, setTokenInput] = useState("PKX_PASS_BKC_SECURE_948201_VERIFIED");
  const [validatedBooking, setValidatedBooking] = useState<any | null>(null);
  const [expectedArrivals, setExpectedArrivals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  const fetchArrivals = async () => {
    try {
      const res = await apiClient.get("/security/expected-arrivals");
      setExpectedArrivals(res.data.items || []);
    } catch (err) {
      // Handled in client fallback
    }
  };

  useEffect(() => {
    fetchArrivals();
  }, []);

  const handleValidate = async (tokenOverride?: string) => {
    const token = tokenOverride || tokenInput;
    if (!token.trim()) return;

    setIsLoading(true);
    setValidatedBooking(null);
    try {
      const res = await apiClient.post("/security/validate-qr", {
        qr_token: token.trim(),
      });
      if (res.data.valid && res.data.booking) {
        setValidatedBooking(res.data.booking);
        toast.success("Pass Validated! Clearance Granted.");
      } else {
        const issue = res.data.issues?.join(", ") || "Invalid pass";
        toast.error(`Verification Failed: ${issue}`);
        if (res.data.booking) setValidatedBooking(res.data.booking);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (qr_token: string) => {
    setIsCheckingIn(true);
    try {
      await apiClient.post("/security/check-in", { qr_token });
      toast.success("Driver checked in! Barrier gate opened.");
      setValidatedBooking((prev: any) => (prev ? { ...prev, status: "CHECKED_IN" } : null));
      fetchArrivals();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to check in");
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleCheckOut = async (booking_id: string) => {
    try {
      await apiClient.post("/security/check-out", { booking_id });
      toast.success("Driver checked out. Bay marked available.");
      setValidatedBooking((prev: any) => (prev ? { ...prev, status: "COMPLETED" } : null));
      fetchArrivals();
    } catch (err: any) {
      toast.error("Failed to check out");
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Security Gate Scanner</h1>
          <p className="text-xs text-slate-500">Scan QR codes to clear entry and exit in real-time</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          Gate Guard Station
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Simulated QR Camera Viewfinder */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[360px] border border-slate-800 shadow-xl">
          <div className="relative z-10 w-full flex justify-between items-center text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Gate Optical Reader 01</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Viewfinder Target with laser line */}
          <div className="relative z-10 w-48 h-48 rounded-2xl border-2 border-emerald-400/60 p-3 flex flex-col items-center justify-center my-6">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

            <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce" />
            <QrCode className="w-16 h-16 text-slate-600 mt-2 opacity-40" />
            <span className="text-[10px] text-emerald-300 font-mono mt-2 font-bold tracking-wider">
              ALIGN DRIVER QR PASS
            </span>
          </div>

          {/* Quick Simulation Test Button */}
          <div className="relative z-10 w-full flex gap-2">
            <button
              onClick={() => handleValidate("PKX_PASS_BKC_SECURE_948201_VERIFIED")}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulate Scan Demo Pass
            </button>
          </div>
        </div>

        {/* Right Column: Manual Token Entry & Gate Control */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Manual Token Lookup
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste token or booking ref..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-800"
              />
              <button
                onClick={() => handleValidate()}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
              </button>
            </div>
          </div>

          {/* Validated Pass Card */}
          {validatedBooking ? (
            <div className="bg-white rounded-3xl border-2 border-blue-600 p-6 space-y-4 shadow-xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-base text-slate-900">
                    {validatedBooking.booking_ref}
                  </span>
                  <div className="text-xs text-slate-500">
                    {validatedBooking.parking_location?.name || "BKC Corporate Bay"}
                  </div>
                </div>
                <span className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                  validatedBooking.status === "CONFIRMED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : validatedBooking.status === "CHECKED_IN"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {validatedBooking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl text-xs">
                <div>
                  <span className="text-slate-400">License Plate</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    {validatedBooking.vehicle?.plate_number || "MH 01 AB 1234"}
                  </div>
                  <div className="text-slate-500">{validatedBooking.vehicle?.make} {validatedBooking.vehicle?.model}</div>
                </div>
                <div>
                  <span className="text-slate-400">Bay Allocated</span>
                  <div className="font-black text-blue-600 text-base">
                    Bay {validatedBooking.space?.space_number || "A-01"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {validatedBooking.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleCheckIn(validatedBooking.qr_token)}
                    disabled={isCheckingIn}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Open Gate &amp; Check-In
                  </button>
                )}

                {validatedBooking.status === "CHECKED_IN" && (
                  <button
                    onClick={() => handleCheckOut(validatedBooking.id)}
                    className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Clear Exit &amp; Free Bay
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs space-y-1">
              <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
              <p>Scan a pass or click &quot;Simulate Scan Demo Pass&quot; to inspect driver clearance.</p>
            </div>
          )}
        </div>
      </div>

      {/* Expected Arrivals List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span>Expected Arrivals Queue</span>
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            {expectedArrivals.length} Scheduled
          </span>
        </h2>

        <div className="divide-y divide-slate-100">
          {expectedArrivals.map((arr) => (
            <div key={arr.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900">{arr.vehicle?.plate_number}</span>
                  <span className="font-semibold text-blue-600">Bay {arr.space?.space_number}</span>
                </div>
                <p className="text-slate-500 mt-0.5">
                  Ref: {arr.booking_ref} &bull; {arr.parking_location?.name}
                </p>
              </div>
              <button
                onClick={() => handleValidate(arr.qr_token)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 font-bold transition"
              >
                Scan Pass &rarr;
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
