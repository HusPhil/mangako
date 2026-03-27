import { SQLiteDatabase } from "expo-sqlite";
import { AddMangaInput, LibraryManga } from "../types";

export const saveGhostManga = (db: SQLiteDatabase, manga: AddMangaInput) => {
  db.runSync(
    `INSERT INTO library_manga (manga_id, title, cover_url, source_id, manga_url, added_at, is_in_library)
     VALUES (?, ?, ?, ?, ?, ?, 0)
     ON CONFLICT(manga_id) DO UPDATE SET 
        title = excluded.title, 
        cover_url = excluded.cover_url`,
    [
      manga.manga_id,
      manga.title,
      manga.cover_url,
      manga.source_id,
      manga.manga_url,
      Date.now(),
    ],
  );
};

export const getLibraryMangaById = (
  db: SQLiteDatabase,
  mangaId: string,
): LibraryManga | null => {
  return db.getFirstSync<LibraryManga>(
    `SELECT * FROM library_manga WHERE manga_id = ?`,
    [mangaId],
  );
};

export const getLibraryByCategory = (
  db: SQLiteDatabase,
  categoryId: string,
): LibraryManga[] => {
  return db.getAllSync<LibraryManga>(
    `SELECT lm.* FROM library_manga lm
     JOIN manga_category mc ON lm.manga_id = mc.manga_id
     WHERE mc.category_id = ? AND lm.is_in_library = 1
     ORDER BY lm.is_favorite DESC, lm.added_at DESC`,
    [categoryId],
  );
};

export const getLibrary = (db: SQLiteDatabase): LibraryManga[] => {
  return db.getAllSync<LibraryManga>(
    `SELECT * FROM library_manga WHERE is_in_library = 1 ORDER BY is_favorite DESC, added_at DESC`,
  );
};

export const toggleFavorite = (db: SQLiteDatabase, mangaId: string) => {
  db.runSync(
    `UPDATE library_manga SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE manga_id = ?`,
    [mangaId],
  );
};

export const resetLibrary = (db: SQLiteDatabase) => {
  db.withTransactionSync(() => {
    db.runSync(`DELETE FROM library_manga`);
  });
  db.execSync(`VACUUM;`);
};
