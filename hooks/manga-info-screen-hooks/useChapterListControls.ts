import { ChapterMetadata } from "@/services/db/types";
import { useReadingStore } from "@/stores/reading-progress-store";
import { MangaChapter } from "@/types/ResponseTypes";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

export const useChapterListControls = (
  mangaId: string,
  mangaChapters?: MangaChapter[],
) => {
  const readChapterIds = useReadingStore((state) => state.readChapterIds);
  const loadReadChapters = useReadingStore((state) => state.loadReadChapters);
  const markChapters = useReadingStore((state) => state.markChapters);

  // 1. Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set<string>(),
  );
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const isSelectionMode = selectedIds.size > 0;

  // 2. Internal Selection Logic
  const toggleSelection = useCallback((id: string, index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastSelectedIndex(index);
  }, []);

  const selectRange = useCallback(
    (currentIndex: number) => {
      if (lastSelectedIndex === null || !mangaChapters) return;

      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);

      const rangeIds = mangaChapters
        .slice(start, end + 1)
        .map((c) => c.chapterId);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        rangeIds.forEach((id) => next.add(id));
        return next;
      });
      setLastSelectedIndex(currentIndex);
    },
    [lastSelectedIndex, mangaChapters],
  );

  // 3. Interaction Handlers
  const onChapterPress = useCallback(
    (mangaId: string, chapter: ChapterMetadata) => {
      const currentIndex = (mangaChapters || []).findIndex(
        (c) => c.chapterId === chapter.id,
      );

      if (isSelectionMode) {
        toggleSelection(chapter.id, currentIndex);
        return;
      }

      router.push({
        pathname: `/manga/[id]/[chapterId]`,
        params: {
          id: mangaId,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          chapterUrl: chapter.url,
        },
      });
    },
    [isSelectionMode, toggleSelection, mangaChapters],
  );

  const onChapterLongPress = useCallback(
    (chapterId: string) => {
      const currentIndex = (mangaChapters || []).findIndex(
        (c) => c.chapterId === chapterId,
      );
      if (currentIndex === -1) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // If already in selection mode and we have an anchor, perform range selection
      if (isSelectionMode && lastSelectedIndex !== null) {
        selectRange(currentIndex);
      } else {
        toggleSelection(chapterId, currentIndex);
      }
    },
    [
      isSelectionMode,
      lastSelectedIndex,
      mangaChapters,
      toggleSelection,
      selectRange,
    ],
  );

  // 4. Selection Utilities
  const selectAll = useCallback(() => {
    const allIds = (mangaChapters || []).map((c) => c.chapterId);
    setSelectedIds(new Set(allIds));
    setLastSelectedIndex(null);
  }, [mangaChapters]);

  const invertSelection = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set<string>();
      (mangaChapters || []).forEach((c) => {
        if (!prev.has(c.chapterId)) next.add(c.chapterId);
      });
      return next;
    });
    setLastSelectedIndex(null);
  }, [mangaChapters]);

  const onClose = useCallback(() => {
    setSelectedIds(new Set<string>());
    setLastSelectedIndex(null);
  }, []);

  // 5. Bulk Operations
  const handleBulkMarkRead = useCallback(
    (isRead: boolean) => {
      if (selectedIds.size === 0) return;

      const chaptersToUpdate: ChapterMetadata[] = (mangaChapters || [])
        .filter((c) => selectedIds.has(c.chapterId))
        .map((c) => ({
          id: c.chapterId,
          title: c.chapterTitle,
          url: c.chapterUrl,
        }));

      markChapters(mangaId, chaptersToUpdate, isRead);
      onClose();
    },
    [mangaId, mangaChapters, selectedIds, markChapters, onClose],
  );

  // 6. Lifecycle & Data Sync
  useEffect(() => {
    if (mangaId) {
      loadReadChapters(mangaId);
    }
  }, [mangaId, loadReadChapters]);

  const controlledChapters = useMemo(() => {
    return (mangaChapters || []).map((chapter) => ({
      ...chapter,
      isRead: readChapterIds.includes(chapter.chapterId),
      isSelected: selectedIds.has(chapter.chapterId),
    }));
  }, [mangaChapters, readChapterIds, selectedIds]);

  return {
    controlledChapters,
    isSelectionMode,
    selectedCount: selectedIds.size,
    readChaptersCount: readChapterIds.length,

    onMarkChaptersAsRead: () => handleBulkMarkRead(true),
    onMarkChaptersAsUnread: () => handleBulkMarkRead(false),

    onSelectAll: selectAll,
    onInvertSelect: invertSelection,
    onClose,
    onChapterPress,
    onChapterLongPress,
  };
};
