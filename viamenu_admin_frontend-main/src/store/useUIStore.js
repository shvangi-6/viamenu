import { create } from "zustand";

export const useUIStore = create((set) => ({
  // Sidebar open sections (keyed by section name)
  openSections: {},

  toggleSection: (key) =>
    set((state) => ({
      openSections: {
        ...state.openSections,
        [key]: !state.openSections[key],
      },
    })),

  openSection: (key) =>
    set((state) => ({
      openSections: { ...state.openSections, [key]: true },
    })),

  closeAllSections: () => set({ openSections: {} }),

  // Global loading
  globalLoading: false,
  setGlobalLoading: (v) => set({ globalLoading: v }),
}));
