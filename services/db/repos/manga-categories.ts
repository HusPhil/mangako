import { SQLiteDatabase } from "expo-sqlite";
import { Category, MangaCategoryResult } from "../types";

// Get all available categories
export const getAllCategories = (db: SQLiteDatabase): Category[] => {
  return db.getAllSync<Category>(
    `SELECT category_id, name, sort_order FROM categories ORDER BY sort_order ASC`,
  );
};
// Helper to check if name exists
export const categoryNameExists = (
  db: SQLiteDatabase,
  name: string,
): boolean => {
  const result = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM categories WHERE LOWER(name) = LOWER(?)`,
    [name.trim()],
  );
  return (result?.count ?? 0) > 0;
};

// Update Create: Throw error or return boolean if exists
export const createCategory = (db: SQLiteDatabase, name: string): void => {
  if (categoryNameExists(db, name)) {
    throw new Error("Category name already exists");
  }

  // 1. Get the current maximum sort_order
  const result = db.getFirstSync<{ maxOrder: number }>(
    `SELECT MAX(sort_order) as maxOrder FROM categories`,
  );

  // 2. Calculate next order (default to 0 if table is empty)
  const nextOrder =
    result && result.maxOrder !== null ? result.maxOrder + 1 : 0;

  const categoryId = name.toLowerCase().trim().replace(/\s+/g, "-");

  // 3. Insert with the new sort_order
  db.runSync(
    `INSERT OR IGNORE INTO categories (category_id, name, sort_order) VALUES (?, ?, ?)`,
    [categoryId, name.trim(), nextOrder],
  );
};

// Update Rename: Check if the NEW name is taken by a DIFFERENT category
export const renameCategory = (
  db: SQLiteDatabase,
  categoryId: string,
  newName: string,
): void => {
  const trimmedName = newName.trim();

  // Check if any OTHER category already has this name
  const existing = db.getFirstSync<{ category_id: string }>(
    `SELECT category_id FROM categories WHERE LOWER(name) = LOWER(?) AND category_id != ?`,
    [trimmedName, categoryId],
  );

  if (existing) {
    throw new Error("Another category already has this name");
  }

  db.runSync(`UPDATE categories SET name = ? WHERE category_id = ?`, [
    trimmedName,
    categoryId,
  ]);
};

// Delete a category and its associations
export const deleteCategory = (
  db: SQLiteDatabase,
  categoryId: string,
): void => {
  db.withTransactionSync(() => {
    // Clean up junction table first to maintain referential integrity
    db.runSync(`DELETE FROM manga_category WHERE category_id = ?`, [
      categoryId,
    ]);
    db.runSync(`DELETE FROM categories WHERE category_id = ?`, [categoryId]);
  });
};

// Add manga to a category
export const assignMangaToCategory = (
  db: SQLiteDatabase,
  mangaId: string,
  categoryId: string,
): void => {
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
): void => {
  db.runSync(
    `DELETE FROM manga_category WHERE manga_id = ? AND category_id = ?`,
    [mangaId, categoryId],
  );
};

// Get all categories for a specific manga
export const getCategoriesForManga = (
  db: SQLiteDatabase,
  mangaId: string,
): MangaCategoryResult[] => {
  return db.getAllSync<MangaCategoryResult>(
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

export const updateCategoryOrders = (
  db: SQLiteDatabase,
  orders: { category_id: string; sort_order: number }[],
): void => {
  db.withTransactionSync(() => {
    const statement = db.prepareSync(
      `UPDATE categories SET sort_order = ? WHERE category_id = ?`,
    );
    try {
      orders.forEach((item) => {
        statement.executeSync([item.sort_order, item.category_id]);
      });
    } finally {
      statement.finalizeSync();
    }
  });
};
