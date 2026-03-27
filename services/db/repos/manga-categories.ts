import { randomUUID } from "expo-crypto";
import { SQLiteDatabase } from "expo-sqlite";
import { AddMangaInput, AssignedCategory, Category } from "../types";

export const getAllCategories = (db: SQLiteDatabase): Category[] => {
  return db.getAllSync<Category>(
    `SELECT category_id, name, sort_order FROM categories ORDER BY sort_order ASC`,
  );
};

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

export const createCategory = (db: SQLiteDatabase, name: string): void => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Category name cannot be empty");
  if (trimmedName.toLowerCase() === "all")
    throw new Error("Category ALL already provided");

  db.withTransactionSync(() => {
    if (categoryNameExists(db, trimmedName)) {
      throw new Error("Category name already exists");
    }

    const result = db.getFirstSync<{ maxOrder: number | null }>(
      `SELECT MAX(sort_order) as maxOrder FROM categories`,
    );

    const nextOrder = (result?.maxOrder ?? -1) + 1;
    const categoryId = randomUUID();

    db.runSync(
      `INSERT OR IGNORE INTO categories (category_id, name, sort_order) VALUES (?, ?, ?)`,
      [categoryId, trimmedName, nextOrder],
    );
  });
};

export const renameCategory = (
  db: SQLiteDatabase,
  categoryId: string,
  newName: string,
): void => {
  const trimmedName = newName.trim();
  db.withTransactionSync(() => {
    const existing = db.getFirstSync<{ category_id: string }>(
      `SELECT category_id FROM categories WHERE LOWER(name) = LOWER(?) AND category_id != ?`,
      [trimmedName, categoryId],
    );
    if (existing) throw new Error("Another category already has this name");

    db.runSync(`UPDATE categories SET name = ? WHERE category_id = ?`, [
      trimmedName,
      categoryId,
    ]);
  });
};

export const deleteCategory = (
  db: SQLiteDatabase,
  categoryId: string,
): void => {
  db.withTransactionSync(() => {
    db.runSync(`DELETE FROM manga_category WHERE category_id = ?`, [
      categoryId,
    ]);
    db.runSync(`DELETE FROM categories WHERE category_id = ?`, [categoryId]);
  });
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
      orders.forEach((item) =>
        statement.executeSync([item.sort_order, item.category_id]),
      );
    } finally {
      statement.finalizeSync();
    }
  });
};

export const getAllCategoriesWithAssignment = (
  db: SQLiteDatabase,
  mangaId: string,
): AssignedCategory[] => {
  return db
    .getAllSync<Category & { is_assigned: number }>(
      `
    SELECT 
      c.category_id, 
      c.name, 
      c.sort_order,
      CASE WHEN mc.manga_id IS NOT NULL THEN 1 ELSE 0 END as is_assigned
    FROM categories c
    LEFT JOIN manga_category mc 
      ON c.category_id = mc.category_id 
      AND mc.manga_id = ?
    ORDER BY c.sort_order ASC
    `,
      [mangaId],
    )
    .map((row) => ({
      ...row,
      is_assigned: row.is_assigned === 1,
    }));
};

export const updateMangaAssignments = (
  db: SQLiteDatabase,
  manga: AddMangaInput,
  assignedCategories: AssignedCategory[],
): void => {
  db.withTransactionSync(() => {
    const activeAssignments = assignedCategories.filter(
      (cat) => cat.is_assigned,
    );

    // MODIFIED: If it has categories, it's in the library. If not, it's a "ghost" for tracking.
    const isInLibrary = activeAssignments.length > 0 ? 1 : 0;

    // MODIFIED: Use INSERT ... ON CONFLICT to ensure the parent exists for Foreign Keys
    // while updating the is_in_library status.
    db.runSync(
      `INSERT INTO library_manga (manga_id, manga_url, title, cover_url, source_id, added_at, is_in_library, is_favorite)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE((SELECT is_favorite FROM library_manga WHERE manga_id = ?), 0))
       ON CONFLICT(manga_id) DO UPDATE SET 
         is_in_library = excluded.is_in_library,
         manga_url = excluded.manga_url,
         title = excluded.title,
         cover_url = excluded.cover_url`,
      [
        manga.manga_id,
        manga.manga_url,
        manga.title,
        manga.cover_url,
        manga.source_id,
        Date.now(),
        isInLibrary,
        manga.manga_id,
      ],
    );

    // UNCHANGED: Refreshing category assignments
    db.runSync(`DELETE FROM manga_category WHERE manga_id = ?`, [
      manga.manga_id,
    ]);

    if (activeAssignments.length > 0) {
      const statement = db.prepareSync(
        `INSERT INTO manga_category (manga_id, category_id) VALUES (?, ?)`,
      );
      try {
        activeAssignments.forEach((cat) =>
          statement.executeSync([manga.manga_id, cat.category_id]),
        );
      } finally {
        statement.finalizeSync();
      }
    }
  });
};
