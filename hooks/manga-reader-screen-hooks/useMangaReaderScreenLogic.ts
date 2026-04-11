import { useGetChapterPages } from "@/hooks/api/useGetChapterPages";

import { useLibraryStore } from "@/stores/library-store";

import { useReadingProgressStore } from "@/stores/reading-progress-store";

import {
  useReaderSessionStore,
  useReaderSettingsStore,
} from "@/stores/ui-stores/manga-reader-screen-ui-store";

import { MangaChapter, MangaChapterPage } from "@/types/ResponseTypes";

import { ViewToken } from "@shopify/flash-list";

import { Image } from "expo-image";

import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChapterMetadata } from "@/services/db/types";
import throttle from "just-throttle";

const VISIBILITY_WINDOW = 3;

const PREFETCH_CHUNK_SIZE = 3;

export type MangaReaderScreenParams = {
  id: string;

  mangaSourceId: string;

  chapterId: string;

  chapterTitle: string;

  chapterUrl: string;

  chapterTimeUploaded: string;

  chapterInitialPage: string;
};

export const useMangaReaderScreenLogic = () => {
  const router = useRouter();

  const params = useLocalSearchParams<MangaReaderScreenParams>();

  const [isReady, setIsReady] = useState(false);

  const [activePages, setActivePages] = useState<MangaChapterPage[]>([]);
  const [isToastVisible, setIsToastVisible] = useState(false);

  const isFocusedRef = useRef(false);

  const prefetchAbortRef = useRef(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setVisibilityMapRef = useRef<Map<number, (v: boolean) => void>>(
    new Map(),
  );

  const setTotalPages = useReaderSessionStore((state) => state.setTotalPages);

  const setCurrentPageIndex = useReaderSessionStore(
    (state) => state.setCurrentPageIndex,
  );

  const resetSession = useReaderSessionStore(
    (state) => state.resetForNavigation,
  );

  const readingMode = useReaderSettingsStore((state) =>
    state.getReadingMode(params.id!),
  );

  const isSettingsVisible = useReaderSessionStore(
    (state) => state.isSettingsVisible,
  );

  const currentPageIndex = useReaderSessionStore(
    (state) => state.currentPageIndex,
  );

  const totalPages = useReaderSessionStore((state) => state.totalPages);

  const getMangaById = useLibraryStore((state) => state.getMangaById);

  const saveProgress = useReadingProgressStore((state) => state.saveProgress);

  const mangaInfo = useMemo(() => getMangaById(params.id!), [params.id]);

  const mangaChapter = useMemo(
    () => ({
      chapterId: params.chapterId,

      chapterTitle: params.chapterTitle,

      chapterUrl: params.chapterUrl,

      chapterTimeUploaded: params.chapterTimeUploaded,
    }),

    [params],
  ); // only re-run if these change

  const {
    data: fetchedPages,

    isLoading: isApiLoading,

    isError,
  } = useGetChapterPages(mangaInfo?.source_id ?? "", params.chapterUrl);

  const markChapters = useReadingProgressStore((state) => state.markChapters);

  const closeToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setIsToastVisible(false);
  }, []);

  /**
   * Opens the toast for a specified duration.
   * Automatically clears existing timers to reset the countdown.
   */
  const openToast = useCallback(
    (durationMs: number = 3000) => {
      // We call closeToast first to ensure a clean state
      closeToast();

      setIsToastVisible(true);

      toastTimerRef.current = setTimeout(() => {
        setIsToastVisible(false);
        toastTimerRef.current = null;
      }, durationMs);
    },
    [closeToast],
  );

  const purgeMemory = useCallback(async () => {
    prefetchAbortRef.current = true;

    setVisibilityMapRef.current.clear();

    setActivePages([]);

    resetSession();

    throttledSave.cancel();

    // Clear toast timer if active
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setIsToastVisible(false);

    await Image.clearMemoryCache();
  }, [resetSession]);

  const onBack = useCallback(async () => {
    await purgeMemory();

    router.back();
  }, [purgeMemory, router]);

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

    [params, markChapters],
  );

  const onNavigateToNextChapter = useCallback(() => {
    const nextChapter = useReaderSessionStore.getState().nextChapter;

    if (!nextChapter) {
      router.back();
      return;
    }

    const readerScreenParams: MangaReaderScreenParams = {
      id: params.id!,

      mangaSourceId: mangaInfo?.source_id ?? "",

      chapterId: nextChapter.chapterId,

      chapterTitle: nextChapter.chapterTitle,

      chapterUrl: nextChapter.chapterUrl,

      chapterTimeUploaded: nextChapter.chapterTimeUploaded,

      chapterInitialPage: "0",
    };

    router.replace({
      pathname: `/manga/[id]/[chapterId]`,

      params: {
        ...readerScreenParams,
      },
    });
  }, [mangaChapter, mangaInfo, params, router]);

  const onNavigateToPrevChapter = useCallback(() => {
    const prevChapter = useReaderSessionStore.getState().prevChapter;

    if (!prevChapter) {
      router.back();
      return;
    }

    const readerScreenParams: MangaReaderScreenParams = {
      id: params.id!,

      mangaSourceId: mangaInfo?.source_id ?? "",

      chapterId: prevChapter.chapterId,

      chapterTitle: prevChapter.chapterTitle,

      chapterUrl: prevChapter.chapterUrl,

      chapterTimeUploaded: prevChapter.chapterTimeUploaded,

      chapterInitialPage: "0",
    };

    router.replace({
      pathname: `/manga/[id]/[chapterId]`,

      params: {
        ...readerScreenParams,
      },
    });
  }, [mangaChapter, mangaInfo, params, router]);

  const onNavigateJumpToChapter = useCallback((chapter: MangaChapter) => {
    const readerScreenParams: MangaReaderScreenParams = {
      id: params.id!,

      mangaSourceId: mangaInfo?.source_id ?? "",

      chapterId: chapter.chapterId,

      chapterTitle: chapter.chapterTitle,

      chapterUrl: chapter.chapterUrl,

      chapterTimeUploaded: chapter.chapterTimeUploaded,

      chapterInitialPage: "0",
    };

    router.replace({
      pathname: `/manga/[id]/[chapterId]`,

      params: {
        ...readerScreenParams,
      },
    });
  }, []);

  const registerVisibilitySetter = useCallback(
    (index: number, setter: (v: boolean) => void) => {
      setVisibilityMapRef.current.set(index, setter);
    },

    [],
  );

  const unregisterVisibilitySetter = useCallback((index: number) => {
    setVisibilityMapRef.current.delete(index);
  }, []);

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

    [params.id, params.chapterId],
  );

  const onEndReached = useCallback(() => {
    const currentChapter: ChapterMetadata = {
      id: params.chapterId,
      title: params.chapterTitle,
      url: params.chapterUrl,
    };
    useReadingProgressStore
      .getState()
      .markChapters(params.id!, [currentChapter], true);

    openToast(10 * 1000);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<MangaChapterPage>[] }) => {
      const newVisible = new Set<number>();

      viewableItems.forEach(({ index }) => {
        if (index == null) return;

        for (
          let i = index - VISIBILITY_WINDOW;
          i <= index + VISIBILITY_WINDOW;
          i++
        ) {
          if (i >= 0 && i < activePages.length) newVisible.add(i);
        }
      });

      setVisibilityMapRef.current.forEach((setter, index) => {
        setter(newVisible.has(index));
      });

      // --- Updated Index Tracking Logic ---

      if (viewableItems.length > 0) {
        const lastVisibleItem = viewableItems[viewableItems.length - 1];

        // Check if the very last page of the chapter is visible on screen

        if (
          lastVisibleItem.index != null &&
          lastVisibleItem.index === activePages.length - 1
        ) {
          setCurrentPageIndex(lastVisibleItem.index);

          throttledSave(lastVisibleItem.index);
        } else if (viewableItems[0]?.index != null) {
          // Fallback to the top-most visible item during normal scrolling

          setCurrentPageIndex(viewableItems[0].index);

          throttledSave(viewableItems[0].index);
        }
      }
    },

    [activePages.length],
  );

  // Double rAF — prevents FlashList from rendering during screen transition animation

  useEffect(() => {
    let frameId = requestAnimationFrame(() => {
      const mangaChapters = useReaderSessionStore.getState().listOfChapters;

      const currentChapterIndex = mangaChapters.findIndex(
        (c) => c.chapterId === mangaChapter.chapterId,
      );

      if (currentChapterIndex !== -1) {
        const nextChapter = mangaChapters[currentChapterIndex + 1] ?? null;

        const prevChapter = mangaChapters[currentChapterIndex - 1] ?? null;

        useReaderSessionStore.getState().setCurrentChapter(mangaChapter);

        useReaderSessionStore.getState().nextChapter = nextChapter;

        useReaderSessionStore.getState().canGoNext = !!nextChapter;

        useReaderSessionStore.getState().prevChapter = prevChapter;

        useReaderSessionStore.getState().canGoPrev = !!prevChapter;
      }

      frameId = requestAnimationFrame(() => setIsReady(true));
    });

    return () => cancelAnimationFrame(frameId);
  }, [mangaChapter, params]);

  // Sync fetched pages into active state only while focused

  useEffect(() => {
    if (fetchedPages && fetchedPages.length > 0 && isFocusedRef.current) {
      setActivePages(fetchedPages);

      setTotalPages(fetchedPages.length);
    }
  }, [fetchedPages]);

  // On focus: populate. On blur: purge everything including visibility map.

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      prefetchAbortRef.current = false;

      if (fetchedPages && fetchedPages.length > 0) {
        setActivePages(fetchedPages);

        setTotalPages(fetchedPages.length);
      }

      return () => {
        isFocusedRef.current = false;

        purgeMemory();
      };
    }, [fetchedPages, purgeMemory]),
  );

  // Prefetch to disk only

  useEffect(() => {
    if (!fetchedPages || fetchedPages.length === 0 || !isFocusedRef.current)
      return;

    prefetchAbortRef.current = false;

    const allUrls = fetchedPages.map((p) => p.pageImageUrl);

    const run = async () => {
      for (let i = 0; i < allUrls.length; i += PREFETCH_CHUNK_SIZE) {
        if (prefetchAbortRef.current) break;

        const chunk = allUrls.slice(i, i + PREFETCH_CHUNK_SIZE);

        try {
          await Promise.all(chunk.map((url) => Image.prefetch(url, "disk")));
        } catch (err) {
          console.error("[Reader] Prefetch error:", err);
        }
      }
    };

    run();

    return () => {
      prefetchAbortRef.current = true;
    };
  }, [fetchedPages]);

  return {
    mangaId: params.id,

    mangaUrl: mangaInfo?.manga_url ?? "",

    mangaSourceId: mangaInfo?.source_id ?? "",

    readingMode,

    pages: activePages,

    chapterInitialIndex: parseInt(params.chapterInitialPage) || 0,

    currentPageIndex,

    totalPages,

    isSettingsVisible,

    isToastVisible,

    chapterId: params.chapterId,

    chapterTitle: params.chapterTitle,

    isLoading: isApiLoading || !isReady,

    isError,

    openToast,

    closeToast,

    onNavigateToNextChapter,

    onNavigateToPrevChapter,

    onNavigateJumpToChapter,

    onBack,

    onToggleReadStatus,

    onViewableItemsChanged,

    onEndReached,

    registerVisibilitySetter,

    unregisterVisibilitySetter,
  };
};
