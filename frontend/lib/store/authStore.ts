import { create } from "zustand";
import { User } from "@/lib/api/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: typeof window !== "undefined" ? JSON.parse(sessionStorage.getItem("parkx_user") || "null") : null,
  accessToken: typeof window !== "undefined" ? sessionStorage.getItem("parkx_at") : null,
  refreshToken: typeof window !== "undefined" ? sessionStorage.getItem("parkx_rt") : null,
  isLoading: false,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("parkx_user", JSON.stringify(user));
      sessionStorage.setItem("parkx_at", accessToken);
      sessionStorage.setItem("parkx_rt", refreshToken);
    }
    set({ user, accessToken, refreshToken });
  },

  setTokens: (accessToken, refreshToken) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("parkx_at", accessToken);
      sessionStorage.setItem("parkx_rt", refreshToken);
    }
    set({ accessToken, refreshToken });
  },

  setUser: (user) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("parkx_user", JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("parkx_user");
      sessionStorage.removeItem("parkx_at");
      sessionStorage.removeItem("parkx_rt");
    }
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
