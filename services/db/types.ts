import { MangaRender, MangaResponse } from "@/types/ResponseTypes";

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

export const mapSearchResultToGridItem = (
  manga: MangaResponse,
): MangaRender => {
  return {
    mangaId: manga.mangaId,
    mangaTitle: manga.mangaTitle,
    mangaUrl: manga.mangaUrl,
    mangaCover: manga.mangaCover,
    mangaSourceId: manga.mangaSource.sourceId,
  };
};

export interface Category {
  category_id: string;
  name: string;
  sort_order: number;
}

export interface AssignedCategory extends Category {
  is_assigned: boolean;
}

export interface MangaCategory {
  manga_id: string;
  category_id: string;
}

export type ReadingProgress = {
  manga_id: string;
  last_read_chapter_id: string;
  last_read_chapter_title: string;
  last_read_chapter_url: string;
  last_read_page: number;
  last_read_at: number;
};

export type ChapterMetadata = {
  id: string;
  title: string;
  url: string;
};
