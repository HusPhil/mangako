// sourceStore.ts
import { Source } from "@/services/ResponseTypes";
import { create } from "zustand";

interface SourceState {
  availableSources: Source[];
  activeSelectedIndex: number | null;
  isLoading: boolean;

  setAvailableSources: (sources: Source[]) => void;
  setActiveSelectedIndex: (index: number) => void;
  setIsLoading: (loading: boolean) => void;
  getActiveSource: () => Source | null;
  
  // Optional: Helper method to fetch sources with loading state
  fetchSources: (fetchFunction: () => Promise<Source[]>) => Promise<void>;
}

export const useSourceStore = create<SourceState>((set, get) => ({
  availableSources: [],
  activeSelectedIndex: null,
  isLoading: false,

  setAvailableSources: (sources) => set({ availableSources: sources }),

  setActiveSelectedIndex: (index) => set({ activeSelectedIndex: index }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  getActiveSource: () => {
    const { availableSources, activeSelectedIndex } = get();
    return activeSelectedIndex !== null
      ? availableSources[activeSelectedIndex] || null
      : null;
  },

  // Optional helper method
  fetchSources: async (fetchFunction) => {
    set({ isLoading: true });
    try {
      const sources = await fetchFunction();
      set({ availableSources: sources, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error; // Re-throw to handle in component if needed
    }
  }
}));