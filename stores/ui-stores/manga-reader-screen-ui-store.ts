import { MangaChapter } from "@/types/ResponseTypes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
// ─── Types ───────────────────────────────────────────────────────────────────

export type ReadingMode = "vertical" | "horizontal-rtl" | "horizontal-ltr";

const DEFAULT_READING_MODE: ReadingMode = "vertical";

interface ReaderSettingsState {
  // Per-manga reading mode — key is mangaId
  readingModes: Record<string, ReadingMode>;

  getReadingMode: (mangaId: string) => ReadingMode;
  setReadingMode: (mangaId: string, mode: ReadingMode) => void;
}

export const useReaderSettingsStore = create<ReaderSettingsState>()(
  persist(
    (set, get) => ({
      readingModes: {},

      getReadingMode: (mangaId) => {
        return get().readingModes[mangaId] ?? DEFAULT_READING_MODE;
      },

      setReadingMode: (mangaId, mode) =>
        set((state) => ({
          readingModes: { ...state.readingModes, [mangaId]: mode },
        })),
    }),
    {
      name: "reader-settings",
      storage: createJSONStorage(() => AsyncStorage),
    },
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
