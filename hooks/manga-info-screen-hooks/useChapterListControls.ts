import { ChapterMetadata } from "@/services/db/types";
import { MangaChapter } from "@/types/ResponseTypes";
import { router } from "expo-router";

export const useChapterListControls = (mangaChapters?: MangaChapter[]) => {
  const onChapterPress = (mangaId: string, chapter: ChapterMetadata) => {
    router.push({
      pathname: `/manga/[id]/[chapterId]`,
      params: {
        id: mangaId,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterUrl: chapter.url,
      },
    });
  };
  const onChapterLongPress = (chapterId: string) => {};

  return { onChapterPress, onChapterLongPress };
};
