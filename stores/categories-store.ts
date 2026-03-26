import * as CategoryRepo from "@/services/db/repos/manga-categories";
import { Category } from "@/services/db/types";
import { SQLiteDatabase } from "expo-sqlite";
import { create } from "zustand";

type CategoryStore = {
  db: SQLiteDatabase | null;
  categories: Category[];

  // Database Initialization
  setDB: (db: SQLiteDatabase) => void;
  loadCategories: () => void;

  // Category Management
  addCategory: (name: string) => void;
  updateCategoryName: (categoryId: string, newName: string) => void;
  removeCategory: (categoryId: string) => void;

  // Manga Association
  assignManga: (mangaId: string, categoryId: string) => void;
  unassignManga: (mangaId: string, categoryId: string) => void;
  moveCategory: (id: string, direction: "up" | "down") => void;
};

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  db: null,
  categories: [],

  setDB: (db) => {
    set({ db });
    get().loadCategories();
  },

  loadCategories: () => {
    const { db } = get();
    if (!db) return;
    const data = CategoryRepo.getAllCategories(db);
    set({ categories: data });
  },

  addCategory: (name: string) => {
    const { db } = get();
    if (!db) return;
    try {
      CategoryRepo.createCategory(db, name);
      get().loadCategories();
    } catch (error) {
      console.warn(error);
      // You could set an 'error' state here to show a toast in the UI
    }
  },

  updateCategoryName: (categoryId, newName) => {
    const { db } = get();
    if (!db) return;
    try {
      CategoryRepo.renameCategory(db, categoryId, newName);
      get().loadCategories();
    } catch (error) {
      console.warn(error);
      // alert("This name is already taken!");
    }
  },

  removeCategory: (categoryId) => {
    const { db } = get();
    if (!db) return;
    CategoryRepo.deleteCategory(db, categoryId);
    get().loadCategories();
  },

  assignManga: (mangaId, categoryId) => {
    const { db } = get();
    if (!db) return;
    CategoryRepo.assignMangaToCategory(db, mangaId, categoryId);
    // Refreshing categories in case you track counts in the UI
    get().loadCategories();
  },

  unassignManga: (mangaId, categoryId) => {
    const { db } = get();
    if (!db) return;
    CategoryRepo.removeMangaFromCategory(db, mangaId, categoryId);
    get().loadCategories();
  },

  moveCategory: (id: string, direction: "up" | "down") => {
    const { db, categories, loadCategories } = get();
    if (!db) return;

    const index = categories.findIndex((c) => c.category_id === id);
    if (index === -1) return;

    // Boundary checks
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === categories.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const currentItem = categories[index];
    const targetItem = categories[targetIndex];

    // SWAP in Database
    try {
      CategoryRepo.updateCategoryOrders(db, [
        { category_id: currentItem.category_id, sort_order: targetIndex },
        { category_id: targetItem.category_id, sort_order: index },
      ]);
      loadCategories(); // Refresh list from DB
    } catch (e) {
      console.error("Move failed", e);
    }
  },
}));
