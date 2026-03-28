import { useGetChapterPages } from "@/hooks/api/useGetChapterPages";
import { useLibraryStore } from "@/stores/library-store";
import { useReadingStore } from "@/stores/reading-progress-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const useMangaReaderScreenLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    chapterId: string;
    chapterTitle: string;
    chapterUrl: string;
  }>();

  const [isReady, setIsReady] = useState(false);
  const [activePages, setActivePages] = useState<MangaChapterPage[]>([]);
  const isFocusedRef = useRef(false);
  // Track the prefetch loop so we can cancel it mid-flight
  const prefetchAbortRef = useRef(false);

  const getMangaById = useLibraryStore((state) => state.getMangaById);
  const mangaInfo = useMemo(() => getMangaById(params.id!), [params.id]);

  const {
    data: fetchedPages,
    isLoading: isApiLoading,
    isError,
  } = useGetChapterPages(mangaInfo?.source_id ?? "", params.chapterUrl);

  const markChapters = useReadingStore((state) => state.markChapters);

  // Centralized cleanup — call this anywhere you need to free memory
  const purgeMemory = useCallback(async () => {
    prefetchAbortRef.current = true; // Stop any in-flight prefetch loop
    setActivePages([]);
    await Image.clearMemoryCache();
  }, []);

  const handleToggleReadStatus = useCallback(
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

  const onBack = useCallback(async () => {
    await purgeMemory();
    router.back();
  }, [purgeMemory, router]);

  // Double rAF trick — waits for the JS thread to be fully idle before marking ready.
  // Prevents FlashList from rendering during the screen transition animation.
  useEffect(() => {
    let frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => setIsReady(true));
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Sync fetched pages into active state only while screen is focused
  useEffect(() => {
    if (fetchedPages && fetchedPages.length > 0 && isFocusedRef.current) {
      setActivePages(fetchedPages);
    }
  }, [fetchedPages]);

  // On focus: populate pages. On blur: purge everything.
  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      prefetchAbortRef.current = false; // Reset abort flag when focusing

      if (fetchedPages && fetchedPages.length > 0) {
        setActivePages(fetchedPages);
      }

      return () => {
        isFocusedRef.current = false;
        // Fire-and-forget is fine here — screen is already losing focus
        purgeMemory();
      };
    }, [fetchedPages, purgeMemory]),
  );

  // Prefetch to DISK only — keeps pages out of RAM until FlashList actually needs them
  useEffect(() => {
    if (!fetchedPages || fetchedPages.length === 0 || !isFocusedRef.current) {
      return;
    }

    prefetchAbortRef.current = false;

    const CHUNK_SIZE = 3;
    const allUrls = fetchedPages.map((p) => p.pageImageUrl);

    const run = async () => {
      for (let i = 0; i < allUrls.length; i += CHUNK_SIZE) {
        // Bail out if screen lost focus or component unmounted mid-loop
        if (prefetchAbortRef.current) break;

        const chunk = allUrls.slice(i, i + CHUNK_SIZE);
        try {
          await Promise.all(chunk.map((url) => Image.prefetch(url, "disk")));
        } catch (err) {
          console.error("[Reader] Prefetch error:", err);
        }
      }
    };

    run();

    // If fetchedPages changes mid-prefetch (shouldn't happen, but just in case)
    return () => {
      prefetchAbortRef.current = true;
    };
  }, [fetchedPages]);

  return {
    mangaId: params.id,
    chapterId: params.chapterId,
    chapterTitle: params.chapterTitle,
    pages: activePages,
    isLoading: isApiLoading || !isReady,
    isError,
    onBack,
    onToggleReadStatus: handleToggleReadStatus,
  };
};
