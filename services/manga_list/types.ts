// src/types.ts

import { Manga } from "../ResponseTypes";

export type Tab = {
  id: string; // e.g., "favorites"
  name: string; // e.g., "Favorites"
  order: number;
  mangaIds: string[]; // IDs of manga in this tab
};

export type MangaList = {
  tabs: Tab[];
  manga: Record<string, Manga>;
};
