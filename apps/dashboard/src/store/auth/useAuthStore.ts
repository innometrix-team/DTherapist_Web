import { persist } from "zustand/middleware";
import { AuthState } from "./types";
import { create } from "zustand";
import {STORE_KEYS} from '../../configs/store.config'

export const useAuthStore = create<AuthState>()(
      persist(
        (set) => ({
          role: "user", 
          token: null,
          setRole: (role) => set({ role }),
          setToken: (token) => set({ token }),
          setAuth: ({role, token}) => set({ role, token }),
          logout: () => set({ role: null, token: null }),
        }),
        {
          name: STORE_KEYS.AUTH,
        }
      )
  );