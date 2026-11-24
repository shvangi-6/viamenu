import { create } from "zustand";
import { persist } from "zustand/middleware";

// Auth tokens are never stored here (or anywhere in JS-reachable storage) — they
// live only in httpOnly cookies set by the server. This store just caches the
// admin's profile info for display.
export const useAdminStore = create(
  persist(
    (set) => ({
      admin: null,

      setAuth: (admin) => set({ admin }),

      clearAuth: () => set({ admin: null }),

      updateAdmin: (updates) =>
        set((state) => ({ admin: { ...state.admin, ...updates } })),
    }),
    {
      name: "viamenu-admin-auth",
      partialize: (state) => ({ admin: state.admin }),
    }
  )
);
