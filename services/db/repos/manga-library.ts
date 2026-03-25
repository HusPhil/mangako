import { SQLiteDatabase } from "expo-sqlite";

// Add a manga to library
export const addManga = (
  db: SQLiteDatabase,
  manga: {
    mangaId: string;
    manga_url: string;
    title: string;
    cover_url: string;
    source_id: string;
  },
) => {
  db.runSync(
    `INSERT OR REPLACE INTO library_manga 
     (manga_id, manga_url, title, cover_url, source_id, added_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      manga.mangaId,
      manga.manga_url,
      manga.title,
      manga.cover_url,
      manga.source_id,
      Date.now(),
    ],
  );
};

// Remove a manga (foreign keys handle cascade)
export const removeManga = (db: SQLiteDatabase, mangaId: string) => {
  db.runSync(`DELETE FROM library_manga WHERE manga_id = ?`, [mangaId]);
};

// Fetch all library manga
export const getLibrary = (db: SQLiteDatabase) => {
  return db.getAllSync(`SELECT * FROM library_manga ORDER BY added_at DESC`);
};

export const resetLibrary = (db: SQLiteDatabase) => {
  try {
    // 1. Clear the main table
    db.runSync(`DELETE FROM library_manga`);

    // 2. Optional: Vacuum the database to reclaim unused space
    // and reset the file size on the device.
    db.execSync(`VACUUM;`);

    console.log("Library has been successfully reset.");
  } catch (error) {
    console.error("Failed to reset library:", error);
    throw error;
  }
};
