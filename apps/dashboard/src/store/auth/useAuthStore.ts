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
      name: null,
      email: null, 
      professionalCategory: null,
      setRole: (role) => set({ role }),
      setToken: (token) => set({ token }),
      setEmail: (email) => set({ email }), 
      setProfessionalCategory: (professionalCategory) => set({ professionalCategory }),
      setAuth: ({ role, token, id, email, name, professionalCategory }) =>
        set({ role, token, id, email, name, professionalCategory: professionalCategory ?? null }), 
      logout: () => set({ role: null, token: null, id: null, email: null, professionalCategory: null }), 
    }),
    {
      name: STORE_KEYS.AUTH,
    }
  )
);