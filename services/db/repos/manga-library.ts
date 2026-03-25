import { SQLiteDatabase } from "expo-sqlite";

// Add a manga to library
export const addManga = (
  db: SQLiteDatabase,
  manga: {
    mangaId: string;
    title: string;
    cover_url: string;
    source_id: string;
  },
) => {
  db.runSync(
    `INSERT OR REPLACE INTO library_manga 
     (manga_id, title, cover_url, source_id, added_at)
     VALUES (?, ?, ?, ?, ?)`,
    [manga.mangaId, manga.title, manga.cover_url, manga.source_id, Date.now()],
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
