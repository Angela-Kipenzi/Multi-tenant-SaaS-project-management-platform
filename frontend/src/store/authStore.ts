import { create } from "zustand";
import { setAccessToken } from "@/lib/api";
import type { User } from "@/types/api";

interface AuthState {
  user: User | null;
  initialized: boolean;
  setAuth: (user: User, accessToken: string) => void;
  clearAuth: () => void;
  setInitialized: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  setAuth: (user, token) => {
    setAccessToken(token);
    set({ user });
  },
  clearAuth: () => {
    setAccessToken(null);
    set({ user: null });
  },
  setInitialized: (v) => set({ initialized: v }),
}));