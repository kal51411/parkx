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
  ArrowRight
} from "lucide-react";
import toast from "react-hot-toast";

export default function SecurityGateScannerPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [validatedBooking, setValidatedBooking] = useState<any | null>(null);
  const [expectedArrivals, setExpectedArrivals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchArrivals = async () => {
    try {
      const res = await apiClient.get("/security/expected-arrivals");
      setExpectedArrivals(res.data.items || []);
    } catch (err) {
      // Security location might not be assigned for demo accounts
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
        toast.success("Valid reservation pass!");
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
      toast.success("Driver checked in successfully! Gate opened.");
      setValidatedBooking(null);
      setTokenInput("");
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
      setValidatedBooking(null);
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

      {/* Manual Input or Scanner Simulation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-800">Scan or Enter QR Token</h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <QrCode className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Paste QR token string or pass reference..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
            />
          </div>
          <button
            onClick={() => handleValidate()}
            disabled={isLoading || !tokenInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Pass"}
          </button>
        </div>
      </div>

      {/* Validated Pass Card Popup */}
      {validatedBooking && (
        <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-xl p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-base text-slate-900">
                {validatedBooking.booking_ref}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                validatedBooking.status === "CONFIRMED"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700"
              }`}>
                {validatedBooking.status}
              </span>
            </div>
            <div className="text-sm font-black text-blue-600">
              Bay {validatedBooking.space?.space_number}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
            <div>
              <span className="text-slate-400">Driver</span>
              <div className="font-bold text-slate-800">{validatedBooking.driver?.full_name || "Driver"}</div>
              <div className="text-slate-500">{validatedBooking.driver?.phone || "Verified"}</div>
            </div>
            <div>
              <span className="text-slate-400">License Plate</span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {validatedBooking.vehicle?.plate_number}
              </div>
              <div className="text-slate-500">{validatedBooking.vehicle?.make} {validatedBooking.vehicle?.model}</div>
            </div>
            <div>
              <span className="text-slate-400">Schedule</span>
              <div className="font-bold text-slate-800">
                {new Date(validatedBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{" "}
                {new Date(validatedBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>

          {/* Gate action buttons */}
          <div className="flex gap-3 pt-2">
            {validatedBooking.status === "CONFIRMED" && (
              <button
                onClick={() => handleCheckIn(validatedBooking.qr_token)}
                disabled={isCheckingIn}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Open Gate &amp; Confirm Check-In
              </button>
            )}

            {validatedBooking.status === "CHECKED_IN" && (
              <button
                onClick={() => handleCheckOut(validatedBooking.id)}
                className="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Confirm Vehicle Exit / Check-Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expected Arrivals List */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span>Expected Arrivals Today</span>
          <span className="text-xs font-normal text-slate-400">{expectedArrivals.length} scheduled</span>
        </h2>

        {expectedArrivals.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No scheduled arrivals pending at this gate.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {expectedArrivals.map((arr) => (
              <div key={arr.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{arr.vehicle?.plate_number}</span>
                    <span className="font-semibold text-blue-600">Bay {arr.space?.space_number}</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">
                    {arr.driver?.full_name} &bull; Expected at {new Date(arr.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button
                  onClick={() => handleValidate(arr.qr_token)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-semibold transition"
                >
                  Quick Check-In &rarr;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
