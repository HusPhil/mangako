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
  currentChapter: MangaChapter | null;
  listOfChapters: MangaChapter[];
  nextChapter: MangaChapter | null;
  prevChapter: MangaChapter | null;

  // Page tracking — critical for horizontal mode, cosmetic for vertical
  currentPageIndex: number;
  totalPages: number;

  isOverlayVisible: boolean;
  isSettingsVisible: boolean;
  isChapterListVisible: boolean;

  // Actions
  setChapterContext: (
    currentChapter: MangaChapter,
    listOfChapters: MangaChapter[],
  ) => void;
  setCurrentPageIndex: (index: number) => void;
  setTotalPages: (total: number) => void;

  toggleIsSettingsVisible: () => void;
  toggleIsOverlayVisible: () => void;
  toggleIsChapterListVisible: () => void;

  reset: () => void;

  // Gesture handlers — logging for now, will wire up later
  onTap: (x: number, y: number) => void; // x,y for tap zone detection (left/right/center)
  onDoubleTap: (x: number, y: number) => void; // x,y for zoom-to-point later
  onLongPress: () => void; // image save / share sheet
}

const defaultSessionState = {
  currentChapter: null,
  listOfChapters: [],
  nextChapter: null,
  prevChapter: null,
  currentPageIndex: 0,
  totalPages: 0,

  isOverlayVisible: false,
  isSettingsVisible: false,
  isChapterListVisible: false,
};

export const useReaderSessionStore = create<ReaderSessionState>()(
  (set, get) => ({
    ...defaultSessionState,

    setChapterContext: (currentChapter, listOfChapters) => {
      const currentIndex = listOfChapters.findIndex(
        (c) => c.chapterId === currentChapter.chapterId,
      );
      set({
        currentChapter,
        listOfChapters,
        prevChapter: listOfChapters[currentIndex - 1] ?? null, // manga order — prev is higher index
        nextChapter: listOfChapters[currentIndex + 1] ?? null,
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

    reset: () => set(defaultSessionState),

    onTap: (x, y) => console.log("[Reader] tap", { x, y }),
    onDoubleTap: (x, y) => console.log("[Reader] double tap", { x, y }),
    onLongPress: () => console.log("[Reader] long press"),
  }),
);
