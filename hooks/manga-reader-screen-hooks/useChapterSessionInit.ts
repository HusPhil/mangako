// ============================================================================
// 1. Session Initialization

import { useReaderSessionStore } from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { MangaChapter } from "@/types/ResponseTypes";
import { useEffect, useState } from "react";

// ============================================================================
function useChapterSessionInit(
  mangaChapter: Omit<MangaChapter, "chapterIndex">,
) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let frameId = requestAnimationFrame(() => {
      const state = useReaderSessionStore.getState();
      const currentChapterIndex = state.listOfChapters.findIndex(
        (c) => c.chapterId === mangaChapter.chapterId,
      );

      if (currentChapterIndex !== -1) {
        const nextChapter =
          state.listOfChapters[currentChapterIndex + 1] ?? null;
        const prevChapter =
          state.listOfChapters[currentChapterIndex - 1] ?? null;

        state.setCurrentChapter(mangaChapter as MangaChapter);
        state.nextChapter = nextChapter;
        state.canGoNext = !!nextChapter;
        state.prevChapter = prevChapter;
        state.canGoPrev = !!prevChapter;
      }

      frameId = requestAnimationFrame(() => setIsReady(true));
    });

    return () => cancelAnimationFrame(frameId);
  }, [mangaChapter]);

  return isReady;
}

export default useChapterSessionInit;
