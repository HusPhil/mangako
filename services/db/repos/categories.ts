// /services/db/repos/manga-category.ts
import { SQLiteDatabase } from "expo-sqlite";

// Add manga to a category
export const assignMangaToCategory = (
  db: SQLiteDatabase,
  mangaId: string,
  categoryId: string,
) => {
  db.runSync(
    `INSERT OR IGNORE INTO manga_category (manga_id, category_id) VALUES (?, ?)`,
    [mangaId, categoryId],
  );
};

// Remove manga from a category
export const removeMangaFromCategory = (
  db: SQLiteDatabase,
  mangaId: string,
  categoryId: string,
) => {
  db.runSync(
    `DELETE FROM manga_category WHERE manga_id = ? AND category_id = ?`,
    [mangaId, categoryId],
  );
};

// Get all categories for a manga
export const getCategoriesForManga = (
  db: SQLiteDatabase,
  mangaId: string,
): { category_id: string; category_name: string }[] => {
  return db.getAllSync(
    `
    SELECT c.category_id, c.name as category_name
    FROM categories c
    JOIN manga_category mc ON mc.category_id = c.category_id
    WHERE mc.manga_id = ?
    ORDER BY c.name ASC
  `,
    [mangaId],
  );
};
