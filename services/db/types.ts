import { MangaRender } from "@/types/ResponseTypes";

export type LibraryManga = {
  manga_id: string;
  manga_url: string;
  title: string;
  cover_url: string;
  source_id: string;
  is_favorite: number;
  added_at: number;
};

export type AddMangaInput = Pick<
  LibraryManga,
  "manga_id" | "manga_url" | "title" | "cover_url" | "source_id"
>;

export const mapLibraryToGridItem = (manga: LibraryManga): MangaRender => {
  return {
    mangaId: manga.manga_id,
    mangaTitle: manga.title,
    mangaUrl: manga.manga_url,
    mangaCover: manga.cover_url,
    mangaSourceId: manga.source_id,
  };
};

// If you have an array of library items:
export const mapLibraryListToGridItems = (list: LibraryManga[]) => {
  return list.map(mapLibraryToGridItem);
};

export interface Category {
  category_id: string;
  name: string;
  sort_order: number;
}

export interface MangaCategory {
  manga_id: string;
  category_id: string;
}

export interface MangaCategoryResult {
  category_id: string;
  category_name: string;
}
