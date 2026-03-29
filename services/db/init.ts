// /services/db/init.ts
import { useCategoryStore } from "@/stores/categories-store";
import { useLibraryStore } from "@/stores/library-store";
import { useReadingProgressStore } from "@/stores/reading-progress-store";
import { SQLiteDatabase } from "expo-sqlite";
import { db } from "./index";
import { runMigrations } from "./migration";

import * as FileSystem from "expo-file-system/legacy";

const checkDbSize = async (dbName: string) => {
  try {
    // Expo SQLite database path convention
    const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;

    const fileInfo = await FileSystem.getInfoAsync(dbPath);

    if (fileInfo.exists) {
      const sizeInBytes = fileInfo.size;
      const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

      console.log(`Database Size: ${sizeInBytes} bytes (~${sizeInMB} MB)`);
      return sizeInBytes;
    } else {
      console.log("Database file does not exist at path:", dbPath);
    }
  } catch (error) {
    console.error("Error checking DB size:", error);
  }
};

export const initDB = () => {
  db.execSync(`
    
    -- Library table
    CREATE TABLE IF NOT EXISTS library_manga (
      manga_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      cover_url TEXT,
      source_id TEXT,
      added_at INTEGER NOT NULL
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      category_id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    -- Junction table: manga ↔ category
    CREATE TABLE IF NOT EXISTS manga_category (
      manga_id TEXT NOT NULL,
      category_id TEXT NOT NULL,
      PRIMARY KEY (manga_id, category_id),
      FOREIGN KEY (manga_id) REFERENCES library_manga(manga_id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
    );

    -- Reading progress table
    CREATE TABLE IF NOT EXISTS reading_progress (
      manga_id TEXT PRIMARY KEY,
      last_read_chapter_id TEXT,
      last_read_page INTEGER,
      last_read_at INTEGER,
      FOREIGN KEY (manga_id) REFERENCES library_manga(manga_id) ON DELETE CASCADE
    );

    -- Chapter read table
    CREATE TABLE IF NOT EXISTS chapter_read (
      manga_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      PRIMARY KEY (manga_id, chapter_id),
      FOREIGN KEY (manga_id) REFERENCES library_manga(manga_id) ON DELETE CASCADE
    );

    -- Optional: meta table for migrations (we’ll need it later)
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_library_added_at ON library_manga(added_at DESC);
    CREATE INDEX IF NOT EXISTS idx_progress_last_read ON reading_progress(last_read_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chapter_read_manga ON chapter_read(manga_id);
  `);
};

export const initializeDB = async (db: SQLiteDatabase) => {
  // 1. Critical DB Settings
  db.execSync(`PRAGMA foreign_keys = ON;`);
  db.execSync(`PRAGMA journal_mode = WAL;`); // Expert Tip: High performance concurrent reads/writes

  // 2. Schema Handling
  // It's better to let runMigrations handle the initDB logic
  await runMigrations(db);

  // 3. Store Injection
  const libraryStore = useLibraryStore.getState();
  const categoryStore = useCategoryStore.getState();
  const readingStore = useReadingProgressStore.getState();

  // Inject the DB reference to all stores first
  libraryStore.setDB(db);
  categoryStore.setDB(db);
  readingStore.setDB(db);

  // 4. Initial Data Load (Optional: Move this to a "Loading" screen)
  // Loading these in parallel is faster than awaiting them one by one
  await Promise.all([
    libraryStore.loadLibrary(),
    categoryStore.loadCategories(),
    readingStore.loadLastRead(),
  ]);

  // 5. Check DB Size
  checkDbSize("app.db");
};
