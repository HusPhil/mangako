import {
  addManga,
  getLibrary, // Added this
  removeManga,
  resetLibrary,
  toggleFavorite, // Added this
} from "@/services/db/repos/manga-library";
import { AddMangaInput, LibraryManga } from "@/services/db/types";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

type LibraryStore = {
  db: SQLiteDatabase | null;
  library: LibraryManga[];

  setDB: (db: SQLiteDatabase) => void;
  loadLibrary: () => void;

  addMangaToLibrary: (manga: AddMangaInput) => void;
  toggleFavorite: (mangaId: string) => void;
  removeMangaFromLibrary: (mangaId: string) => void;
  resetMangaLibrary: () => void;
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  db: null,
  library: [],

  setDB: (db) => {
    set({ db });
    // This ensures that as soon as the DB is ready, the UI populates
    get().loadLibrary();
  },

  loadLibrary: () => {
    const { db } = get();
    if (!db) return;
    const data = getLibrary(db);
    set({ library: data });
  },

  addMangaToLibrary: (manga) => {
    const { db } = get();
    if (!db) return;
    addManga(db, manga);
    get().loadLibrary(); // Refresh state from DB
  },

  toggleFavorite: (mangaId) => {
    const { db } = get();
    if (!db) return;
    toggleFavorite(db, mangaId);
    get().loadLibrary(); // Refresh state to show the heart/star change
  },

  removeMangaFromLibrary: (mangaId) => {
    const { db } = get();
    if (!db) return;
    removeManga(db, mangaId);
    get().loadLibrary();
  },

  resetMangaLibrary: () => {
    const { db } = get();
    if (!db) return;
    resetLibrary(db);
    set({ library: [] }); // Faster than a full reload after a wipe
  },
}));
