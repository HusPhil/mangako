import { create } from "zustand";

type ReadingMode = "vertical" | "horizontal-rtl" | "horizontal-ltr";

interface ReaderUIState {
  // Visibility States
  isControlsVisible: boolean;
  isSettingsOpen: boolean;
  isPageSliderVisible: boolean;

  // Layout States
  readingMode: ReadingMode;
  showPageNumbers: boolean;
  keepScreenOn: boolean;

  // Interaction Actions
  toggleControls: () => void;
  setControlsVisible: (visible: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setReadingMode: (mode: ReadingMode) => void;

  // Reset
  resetUI: () => void;
}

export const useReaderUIStore = create<ReaderUIState>((set) => ({
  // Defaults
  isControlsVisible: true,
  isSettingsOpen: false,
  isPageSliderVisible: false,
  readingMode: "vertical",
  showPageNumbers: true,
  keepScreenOn: true,

  toggleControls: () =>
    set((state) => ({ isControlsVisible: !state.isControlsVisible })),

  setControlsVisible: (visible) => set({ isControlsVisible: visible }),

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),

  setReadingMode: (mode) => set({ readingMode: mode }),

  resetUI: () =>
    set({
      isControlsVisible: true,
      isSettingsOpen: false,
      isPageSliderVisible: false,
    }),
}));
