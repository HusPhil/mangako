import { MangaRender } from "@/types/ResponseTypes";

export const MANGA_LIST_DUMMY_DATA: MangaRender[] = Array.from(
  { length: 20 },
  (_, i) => ({
    mangaId: String(i),
    mangaTitle:
      i % 2 === 0
        ? "Manga Title"
        : "Very Long Manga Title Name For Testing Purposes",
    mangaCover: `https://picsum.photos/seed/${i + 1}/200/300`,
    mangaSourceId: "1",
    mangaUrl: `https://picsum.photos/seed/${i + 1}/200/300`,
  }),
);
