import { persist } from "zustand/middleware";
import { AuthState } from "./types";
import { create } from "zustand";
import { STORE_KEYS } from '../../configs/store.config';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      id: null,
      role: "counselor", 
      token: null,
      email: null, 
      setRole: (role) => set({ role }),
      setToken: (token) => set({ token }),
      setEmail: (email) => set({ email }), 
      setAuth: ({ role, token, id, email }) => set({ role, token, id, email }), 
      logout: () => set({ role: null, token: null, id: null, email: null }), 
    }),
    {
      name: STORE_KEYS.AUTH,
    }
  )
);