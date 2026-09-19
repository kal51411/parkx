"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import toast from "react-hot-toast";
import { Car, Lock, Mail, ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("driver1@test.com");
  const [password, setPassword] = useState("Driver@123");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { user, access_token, refresh_token } = response.data;
      setAuth(user, access_token, refresh_token);
      toast.success(`Welcome back, ${user.full_name}!`);

      // Role-based routing
      switch (user.role) {
        case "PARKING_OWNER":
        case "SOCIETY_ADMIN":
          router.push("/owner/dashboard");
          break;
        case "SECURITY":
          router.push("/security/scan");
          break;
        case "PLATFORM_ADMIN":
          router.push("/admin/dashboard");
          break;
        default:
          router.push("/search");
          break;
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Invalid email or password";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoRole = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl mx-auto shadow-md shadow-blue-500/20">
            🅿
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to ParkX</h2>
          <p className="text-xs text-slate-500">Real-time parking discovery and operations for Mumbai</p>
        </div>

        {/* Demo Fast Logins */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Quick Demo Credentials:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setDemoRole("driver1@test.com", "Driver@123")}
              className="py-1 px-2 text-left rounded bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition"
            >
              🚗 <span className="font-medium">Driver</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoRole("owner1@parkx.in", "Owner@123")}
              className="py-1 px-2 text-left rounded bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition"
            >
              🏢 <span className="font-medium">Owner</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoRole("security1@parkx.in", "Security@123")}
              className="py-1 px-2 text-left rounded bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition"
            >
              🛡️ <span className="font-medium">Security</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoRole("admin@parkx.in", "Admin@123")}
              className="py-1 px-2 text-left rounded bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 transition"
            >
              ⚡ <span className="font-medium">Admin</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register now
          </Link>
        </p>
      </div>
    </div>
  );
}
