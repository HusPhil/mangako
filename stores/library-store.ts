import {
  addManga,
  getLibrary,
  removeManga,
} from "@/services/db/repos/manga-library";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

type LibraryStore = {
  db: SQLiteDatabase | null;
  library: any[];

  setDB: (db: SQLiteDatabase) => void;
  loadLibrary: () => void;
  addMangaToLibrary: (manga: any) => void;
  removeMangaFromLibrary: (mangaId: string) => void;
};

export const useLibraryStore = create<LibraryStore>((set, get) => ({
  db: null,
  library: [],

  setDB: (db) => {
    set({ db });
    get().loadLibrary();
  },

  loadLibrary: () => {
    const db = get().db;
    if (!db) return;
    const data = getLibrary(db);
    set({ library: data });
  },

  addMangaToLibrary: (manga) => {
    const db = get().db;
    if (!db) return;
    addManga(db, manga);
    get().loadLibrary();
  },

  removeMangaFromLibrary: (mangaId) => {
    const db = get().db;
    if (!db) return;
    removeManga(db, mangaId);
    get().loadLibrary();
  },
}));
