import {
  getLibrary,
  getLibraryByCategory,
  getLibraryMangaById,
  resetLibrary,
  saveGhostManga,
  toggleFavorite,
} from "@/services/db/repos/manga-library";
import { AddMangaInput, LibraryManga } from "@/services/db/types";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

type LibraryStore = {
  db: SQLiteDatabase | null;
  library: LibraryManga[];
  selectedCategory: string | null;

  setDB: (db: SQLiteDatabase) => void;
  getMangaById: (mangaId: string) => LibraryManga | null;

  setSelectedCategory: (categoryId: string | null) => void;
  loadLibrary: (categoryId?: string) => void;

  saveGhostManga: (manga: AddMangaInput) => void;
  toggleFavorite: (mangaId: string) => void;
  resetMangaLibrary: () => void;
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  db: null,
  library: [],

  selectedCategory: null,
  setDB: (db) => {
    set({ db });
    get().loadLibrary();
  },

  getMangaById: (mangaId) => {
    const { db } = get();
    if (!db) return null;
    return getLibraryMangaById(db, mangaId);
  },

  // New Action: Explicitly set and load
  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId });
    get().loadLibrary(categoryId ?? undefined);
  },

  loadLibrary: (categoryId) => {
    const { db, selectedCategory } = get();
    if (!db) return;

    // Use passed category, or current state category, or null (all)
    const targetCategory =
      categoryId !== undefined ? categoryId : selectedCategory;

    let data: LibraryManga[];
    if (targetCategory) {
      data = getLibraryByCategory(db, targetCategory);
    } else {
      data = getLibrary(db);
    }

    set({ library: data, selectedCategory: targetCategory ?? null });
  },

  saveGhostManga: (manga) => {
    const { db } = get();
    if (!db) return;
    saveGhostManga(db, manga);
  },

  toggleFavorite: (mangaId) => {
    const { db } = get();
    if (!db) return;
    toggleFavorite(db, mangaId);
    get().loadLibrary();
  },

  resetMangaLibrary: () => {
    const { db } = get();
    if (!db) return;
    resetLibrary(db);
    set({ library: [], selectedCategory: null });
  },
}));
