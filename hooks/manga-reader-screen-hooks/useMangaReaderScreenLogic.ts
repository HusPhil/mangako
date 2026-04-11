import { useGetChapterPages } from "@/hooks/api/useGetChapterPages";
import { useLibraryStore } from "@/stores/library-store";
import {
  useReaderSessionStore,
  useReaderSettingsStore,
} from "@/stores/ui-stores/manga-reader-screen-ui-store";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import useChapterNavigation from "./useChapterNavigation";
import useChapterSessionInit from "./useChapterSessionInit";
import useImageMemoryAndPrefetch from "./useImageMemoryAndPrefetch";
import usePageVisibility from "./usePageVisibility";
import useReaderProgress from "./useReaderProgress";

export type MangaReaderScreenParams = {
  id: string;
  mangaSourceId: string;
  chapterId: string;
  chapterTitle: string;
  chapterUrl: string;
  chapterTimeUploaded: string;
};

export const useMangaReaderScreenLogic = () => {
  const params = useLocalSearchParams<MangaReaderScreenParams>();
  const isFocusedRef = useRef(false);

  // --- Store Selectors ---
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

  // --- Derived State ---
  const mangaInfo = useMemo(
    () => getMangaById(params.id!),
    [getMangaById, params.id],
  );
  const mangaChapter = useMemo(
    () => ({
      chapterId: params.chapterId,
      chapterTitle: params.chapterTitle,
      chapterUrl: params.chapterUrl,
      chapterTimeUploaded: params.chapterTimeUploaded,
    }),
    [
      params.chapterId,
      params.chapterTitle,
      params.chapterUrl,
      params.chapterTimeUploaded,
    ],
  );

  // --- Data Fetching ---
  const {
    data: fetchedPages,
    isLoading: isApiLoading,
    isError,
  } = useGetChapterPages(mangaInfo?.source_id ?? "", params.chapterUrl);

  // --- Hooks Compositions ---
  const isReady = useChapterSessionInit(mangaChapter);
  const { throttledSave, cancelSave, onToggleReadStatus } =
    useReaderProgress(params);
  const { activePages, setActivePages, clearActivePages, abortPrefetch } =
    useImageMemoryAndPrefetch(fetchedPages, isFocusedRef);

  const {
    registerVisibilitySetter,
    unregisterVisibilitySetter,
    clearVisibilityMap,
    onViewableItemsChanged,
  } = usePageVisibility(activePages.length, setCurrentPageIndex, throttledSave);

  // --- Memory Purge Logic ---
  const purgeMemory = useCallback(async () => {
    abortPrefetch();
    clearVisibilityMap();
    clearActivePages();
    resetSession();
    cancelSave();
    await Image.clearMemoryCache();
  }, [
    abortPrefetch,
    clearVisibilityMap,
    clearActivePages,
    resetSession,
    cancelSave,
  ]);

  const navigationControls = useChapterNavigation(
    params,
    mangaInfo?.source_id ?? "",
    purgeMemory,
  );

  // --- Screen Focus Management ---
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;

      if (fetchedPages && fetchedPages.length > 0) {
        setActivePages(fetchedPages);
        setTotalPages(fetchedPages.length);
      }

      return () => {
        isFocusedRef.current = false;
        purgeMemory();
      };
    }, [fetchedPages, purgeMemory, setActivePages, setTotalPages]),
  );

  return {
    mangaId: params.id,
    mangaUrl: mangaInfo?.manga_url ?? "",
    mangaSourceId: mangaInfo?.source_id ?? "",

    readingMode,
    pages: activePages,
    currentPageIndex,
    totalPages,

    isSettingsVisible,

    chapterId: params.chapterId,
    chapterTitle: params.chapterTitle,

    isLoading: isApiLoading || !isReady,
    isError,

    ...navigationControls,

    onToggleReadStatus,
    onViewableItemsChanged,

    registerVisibilitySetter,
    unregisterVisibilitySetter,
  };
};
