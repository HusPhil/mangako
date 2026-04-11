import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapter } from "@/types/ResponseTypes";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { MangaReaderScreenParams } from "./useMangaReaderScreenLogic";

// ============================================================================
function useChapterNavigation(
  params: MangaReaderScreenParams,
  mangaSourceId: string,
  purgeMemory: () => Promise<void>,
) {
  const router = useRouter();

  const navigateToChapter = useCallback(
    (chapter: Omit<MangaChapter, "chapterIndex">) => {
      const readerScreenParams: MangaReaderScreenParams = {
        id: params.id!,
        mangaSourceId,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.chapterTitle,
        chapterUrl: chapter.chapterUrl,
        chapterTimeUploaded: chapter.chapterTimeUploaded,
      };

      router.replace({
        pathname: `/manga/[id]/[chapterId]`,
        params: { ...readerScreenParams },
      });
    },
    [params.id, mangaSourceId, router],
  );

  const onNavigateToNextChapter = useCallback(() => {
    const nextChapter = useReaderSessionStore.getState().nextChapter;
    if (nextChapter) navigateToChapter(nextChapter);
  }, [navigateToChapter]);

  const onNavigateToPrevChapter = useCallback(() => {
    const prevChapter = useReaderSessionStore.getState().prevChapter;
    if (prevChapter) navigateToChapter(prevChapter);
  }, [navigateToChapter]);

  const onNavigateJumpToChapter = useCallback(
    (chapter: MangaChapter) => navigateToChapter(chapter),
    [navigateToChapter],
  );

  const onBack = useCallback(async () => {
    await purgeMemory();
    router.back();
  }, [purgeMemory, router]);

  return {
    onNavigateToNextChapter,
    onNavigateToPrevChapter,
    onNavigateJumpToChapter,
    onBack,
  };
}

export default useChapterNavigation;
