import { MangaChapter } from "@/types/ResponseTypes";
import * as Haptics from "expo-haptics";
import { create } from "zustand";
import { persist } from "zustand/middleware";
// ─── Types ───────────────────────────────────────────────────────────────────

type ReadingMode = "vertical" | "horizontal-rtl" | "horizontal-ltr";

// ─── Reader Settings (persisted) ─────────────────────────────────────────────
// These are user preferences that survive app restarts

interface ReaderSettingsState {
  readingMode: ReadingMode;

  setReadingMode: (mode: ReadingMode) => void;
}

export const useReaderSettingsStore = create<ReaderSettingsState>()(
  persist(
    (set) => ({
      readingMode: "vertical",
      setReadingMode: (mode) => set({ readingMode: mode }),
    }),
    { name: "reader-settings" },
  ),
);

interface ReaderSessionState {
  // Chapter context
  listOfChapters: MangaChapter[];
  currentChapter: MangaChapter | null;

  canGoNext: boolean;
  nextChapter: MangaChapter | null;

  canGoPrev: boolean;
  prevChapter: MangaChapter | null;

  // Page tracking — critical for horizontal mode, cosmetic for vertical
  currentPageIndex: number;
  totalPages: number;

  isOverlayVisible: boolean;
  isSettingsVisible: boolean;
  isChapterListVisible: boolean;

  // Actions
  setCurrentChapter: (currentChapter: MangaChapter) => void;
  setCurrentPageIndex: (index: number) => void;
  setTotalPages: (total: number) => void;

  toggleIsSettingsVisible: () => void;
  toggleIsOverlayVisible: () => void;
  toggleIsChapterListVisible: () => void;

  resetForNavigation: () => void; // Resets UI state but keeps chapter list (for smooth back-and-forth)
  resetAll: () => void;

  // Gesture handlers — logging for now, will wire up later
  onTap: (x: number, y: number) => void; // x,y for tap zone detection (left/right/center)
  onDoubleTap: (x: number, y: number) => void; // x,y for zoom-to-point later
  onLongPress: () => void; // image save / share sheet
}

const defaultSessionState = {
  currentChapter: null,
  listOfChapters: [],

  nextChapter: null,
  canGoNext: false,

  prevChapter: null,
  canGoPrev: false,

  currentPageIndex: 0,
  totalPages: 0,

  isOverlayVisible: false,
  isSettingsVisible: false,
  isChapterListVisible: false,
};

export const useReaderSessionStore = create<ReaderSessionState>()(
  (set, get) => ({
    ...defaultSessionState,

    setCurrentChapter: (currentChapter) => {
      set({
        currentChapter,
      });
    },

    setCurrentPageIndex: (index) => {
      set({
        currentPageIndex: index,
      });
    },

    setTotalPages: (total) => {
      set({ totalPages: total });
    },

    toggleIsSettingsVisible: async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      set((state) => ({ isSettingsVisible: !state.isSettingsVisible }));
    },

    toggleIsOverlayVisible: () => {
      set((state) => ({ isOverlayVisible: !state.isOverlayVisible }));
    },
    toggleIsChapterListVisible: () => {
      set((state) => ({ isChapterListVisible: !state.isChapterListVisible }));
    },

    resetForNavigation: () =>
      set((state) => ({
        ...defaultSessionState,
        listOfChapters: state.listOfChapters, // PERSIST the list!
      })),

    resetAll: () => set(defaultSessionState),

    onTap: (x, y) => console.log("[Reader] tap", { x, y }),
    onDoubleTap: (x, y) => console.log("[Reader] double tap", { x, y }),
    onLongPress: () => console.log("[Reader] long press"),
  }),
);
