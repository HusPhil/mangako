import { SQLiteDatabase } from "expo-sqlite";
import { AddMangaInput, LibraryManga } from "../types";

export const addMangaToLibraryWithCategory = (
  db: SQLiteDatabase,
  manga: AddMangaInput,
  categoryId: string,
) => {
  db.withTransactionSync(() => {
    db.runSync(
      `INSERT OR IGNORE INTO categories (category_id, name) VALUES (?, ?)`,
      [categoryId, categoryId],
    );

    db.runSync(
      `INSERT OR REPLACE INTO library_manga
       (manga_id, manga_url, title, cover_url, source_id, added_at, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT is_favorite FROM library_manga WHERE manga_id = ?), 0))`,
      [
        manga.manga_id,
        manga.manga_url,
        manga.title,
        manga.cover_url,
        manga.source_id,
        Date.now(),
        manga.manga_id,
      ],
    );

    db.runSync(
      `INSERT OR REPLACE INTO manga_category (manga_id, category_id) VALUES (?, ?)`,
      [manga.manga_id, categoryId],
    );
  });
};

export const getLibraryByCategory = (
  db: SQLiteDatabase,
  categoryId: string,
): LibraryManga[] => {
  return db.getAllSync<LibraryManga>(
    `SELECT lm.* FROM library_manga lm
     JOIN manga_category mc ON lm.manga_id = mc.manga_id
     WHERE mc.category_id = ?
     ORDER BY lm.is_favorite DESC, lm.added_at DESC`,
    [categoryId],
  );
};

export const getLibrary = (db: SQLiteDatabase): LibraryManga[] => {
  return db.getAllSync<LibraryManga>(
    `SELECT * FROM library_manga ORDER BY is_favorite DESC, added_at DESC`,
  );
};

export const toggleFavorite = (db: SQLiteDatabase, mangaId: string) => {
  db.runSync(
    `UPDATE library_manga SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END WHERE manga_id = ?`,
    [mangaId],
  );
};

export const removeManga = (db: SQLiteDatabase, mangaId: string) => {
  db.runSync(`DELETE FROM library_manga WHERE manga_id = ?`, [mangaId]);
};

export const resetLibrary = (db: SQLiteDatabase) => {
  db.withTransactionSync(() => {
    db.runSync(`DELETE FROM library_manga`);
  });
  db.execSync(`VACUUM;`);
};
