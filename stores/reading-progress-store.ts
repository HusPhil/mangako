import * as Repo from "@/services/db/repos/manga-reading-progress";
import { ChapterMetadata, ReadingProgress } from "@/services/db/types";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

type ReadingProgressStore = {
  db: SQLiteDatabase | null;
  lastRead: (ReadingProgress & { title: string; cover_url: string }) | null;
  readChapterIds: string[];

  setDB: (db: SQLiteDatabase) => void;
  loadLastRead: () => void;
  loadReadChapters: (mangaId: string) => void;

  // Actions now take a ChapterMetadata object for cleaner data passing
  markChapters: (
    mangaId: string,
    chapters: ChapterMetadata[],
    isRead: boolean,
  ) => void;
  saveProgress: (
    mangaId: string,
    chapter: ChapterMetadata,
    page: number,
  ) => void;
};

export const useReadingProgressStore = create<ReadingProgressStore>(
  (set, get) => ({
    db: null,
    lastRead: null,
    readChapterIds: [],

    setDB: (db) => set({ db }),

    loadLastRead: () => {
      const { db } = get();
      if (db) set({ lastRead: Repo.getLastReadManga(db) });
    },

    loadReadChapters: (mangaId) => {
      const { db } = get();
      if (db) set({ readChapterIds: Repo.getReadChapterIds(db, mangaId) });
    },

    markChapters: (mangaId, chapters, isRead) => {
      const { db } = get();
      if (!db) return;
      Repo.setChaptersReadStatus(db, mangaId, chapters, isRead);
      get().loadReadChapters(mangaId);
    },

    saveProgress: (mangaId, chapter, page) => {
      const { db } = get();
      if (!db) return;
      Repo.saveReadingProgress(db, mangaId, chapter, page);

      get().loadLastRead();
      get().loadReadChapters(mangaId);
    },
  }),
);
