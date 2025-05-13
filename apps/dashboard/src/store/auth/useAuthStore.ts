import { persist } from "zustand/middleware";
import { AuthState } from "./types";
import { create } from "zustand";

export const useAuthStore = create<AuthState>()(
      persist(
        (set) => ({
          role: "counselor", //will replace when API is integrated
          token: null,
  
          setRole: (role) => set({ role }),
          setToken: (token) => set({ token }),
          logout: () => set({ role: null, token: null }),
        }),
        {
          name: 'auth-storage',
        }
      )
  );