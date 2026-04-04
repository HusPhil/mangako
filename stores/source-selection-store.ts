import { Source } from "@/types/ResponseTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SourceSelectionState {
  availableSources: Source[];
  currentSelectedSource: Source | null;
  isLoading: boolean;

  // Actions
  setAvailableSources: (sources: Source[]) => void;
  setCurrentSelectedSource: (source: Source | null) => void;
  setIsLoading: (loading: boolean) => void;
  fetchSources: (fetchFunction: () => Promise<Source[]>) => Promise<void>;
}

export const useSourceSelectionStore = create<SourceSelectionState>()(
  persist(
    (set, get) => ({
      availableSources: [],
      currentSelectedSource: null,
      isLoading: false,

      setAvailableSources: (sources) => set({ availableSources: sources }),

      setCurrentSelectedSource: (source) =>
        set({ currentSelectedSource: source }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      fetchSources: async (fetchFunction) => {
        set({ isLoading: true });
        try {
          const sources = await fetchFunction();
          // Logic: If we fetch sources and nothing is selected yet,
          // default to the first one available
          const current = get().currentSelectedSource;

          set({
            availableSources: sources,
            currentSelectedSource: current || sources[0] || null,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          console.error("Failed to fetch sources:", error);
        }
      },
    }),
    {
      name: "source-selection-storage", // Unique name for the storage key
      storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for React Native
      partialize: (state) => ({
        currentSelectedSource: state.currentSelectedSource,
      }),
    },
  ),
);
