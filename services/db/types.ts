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
