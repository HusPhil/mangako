import { MangaChapter } from "@/types/ResponseTypes";
import { router } from "expo-router";

export const useChapterListControls = (mangaChapters?: MangaChapter[]) => {
  const onChapterPress = (chapterId: string) => {
    router.push(`/manga/testMangaId/testChapterId?`);
  };
  const onChapterLongPress = (chapterId: string) => {};

  return { onChapterPress, onChapterLongPress };
};
