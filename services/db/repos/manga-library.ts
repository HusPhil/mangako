import { SQLiteDatabase } from "expo-sqlite";
import { AddMangaInput, LibraryManga } from "../types";

export const addManga = (db: SQLiteDatabase, manga: AddMangaInput) => {
  db.runSync(
    `INSERT OR REPLACE INTO library_manga 
     (manga_id, manga_url, title, cover_url, source_id, is_favorite, added_at)
     VALUES (?, ?, ?, ?, ?, COALESCE((SELECT is_favorite FROM library_manga WHERE manga_id = ?), 0), ?)`,
    [
      manga.manga_id,
      manga.manga_url,
      manga.title,
      manga.cover_url,
      manga.source_id,
      manga.manga_id, // Used for the COALESCE check
      Date.now(),
    ],
  );
};

// Toggle Favorite Status (v2 Column)
export const toggleFavorite = (db: SQLiteDatabase, mangaId: string) => {
  db.runSync(
    `UPDATE library_manga SET is_favorite = NOT is_favorite WHERE manga_id = ?`,
    [mangaId],
  );
};

// Remove a manga
export const removeManga = (db: SQLiteDatabase, mangaId: string) => {
  db.runSync(`DELETE FROM library_manga WHERE manga_id = ?`, [mangaId]);
};

// Fetch all library manga (Returns LibraryManga[])
export const getLibrary = (db: SQLiteDatabase): LibraryManga[] => {
  return db.getAllSync<LibraryManga>(
    `SELECT * FROM library_manga ORDER BY is_favorite DESC, added_at DESC`,
  );
};

// Reset Library
export const resetLibrary = (db: SQLiteDatabase) => {
  try {
    db.runSync(`DELETE FROM library_manga`);
    db.execSync(`VACUUM;`);
    console.log("Library has been successfully reset.");
  } catch (error) {
    console.error("Failed to reset library:", error);
    throw error;
  }
};
