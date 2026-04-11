// ============================================================================
// 2. Reading Progress & Status

import { useReadingProgressStore } from "@/stores/reading-progress-store";
import throttle from "just-throttle";
import { useCallback, useMemo } from "react";
import { MangaReaderScreenParams } from "./useMangaReaderScreenLogic";

// ============================================================================
function useReaderProgress(params: MangaReaderScreenParams) {
  const saveProgress = useReadingProgressStore((state) => state.saveProgress);
  const markChapters = useReadingProgressStore((state) => state.markChapters);

  const throttledSave = useMemo(
    () =>
      throttle((pageIndex: number) => {
        if (!params.id || !params.chapterId) return;
        saveProgress(
          params.id,
          {
            id: params.chapterId,
            title: params.chapterTitle,
            url: params.chapterUrl,
          },
          pageIndex,
        );
      }, 250),
    [
      params.id,
      params.chapterId,
      params.chapterTitle,
      params.chapterUrl,
      saveProgress,
    ],
  );

  const cancelSave = useCallback(() => throttledSave.cancel(), [throttledSave]);

  const onToggleReadStatus = useCallback(
    (isRead: boolean) => {
      if (!params.id || !params.chapterId) return;
      markChapters(
        params.id,
        [
          {
            id: params.chapterId,
            title: params.chapterTitle ?? "",
            url: params.chapterUrl ?? "",
          },
        ],
        isRead,
      );
    },
    [
      params.id,
      params.chapterId,
      params.chapterTitle,
      params.chapterUrl,
      markChapters,
    ],
  );

  return { throttledSave, cancelSave, onToggleReadStatus };
}

export default useReaderProgress;
