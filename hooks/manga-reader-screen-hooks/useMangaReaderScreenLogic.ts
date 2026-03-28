import { useGetChapterPages } from "@/hooks/api/useGetChapterPages";
import { useLibraryStore } from "@/stores/library-store";
import { useReadingStore } from "@/stores/reading-progress-store";
import { MangaChapterPage } from "@/types/ResponseTypes";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions } from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const useMangaReaderScreenLogic = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    chapterId: string;
    chapterTitle: string;
    chapterUrl: string;
  }>();

  const [isReady, setIsReady] = useState(false);

  // 1. Resolve Manga Metadata from Store
  const getMangaById = useLibraryStore((state) => state.getMangaById);
  const mangaInfo = useMemo(() => getMangaById(params.id!), [params.id]);

  // 2. API: Fetch Chapter Pages
  const {
    data: pages = [],
    isLoading: isApiLoading,
    isError,
  } = useGetChapterPages(mangaInfo?.source_id ?? "", params.chapterUrl);

  // 3. Database: Progress Persistence
  const markChapters = useReadingStore((state) => state.markChapters);
  const saveProgress = useReadingStore((state) => state.saveProgress);

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

  // 4. Performance: Layout Calculation for FlashList
  // This prevents layout jumps and improves scroll performance
  const getItemLayout = useCallback(
    (layout: { height: number }, item: MangaChapterPage) => {
      layout.height = (item.pageHeight / item.pageWidth) * SCREEN_WIDTH;
    },
    [],
  );

  const onBack = useCallback(() => router.back(), [router]);

  // 5. Lifecycle: Ensure JS thread is clear before rendering heavy images
  useEffect(() => {
    let frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => setIsReady(true));
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const CHUNK_SIZE = 3;

    const prioritizedPrefetch = async () => {
      // 1. Guard against empty data
      if (!pages || pages.length === 0) return;

      const allUrls = pages.map((p) => p.pageImageUrl);
      console.log(`[Reader] Starting prefetch for ${allUrls.length} pages`);

      for (let i = 0; i < allUrls.length; i += CHUNK_SIZE) {
        // 2. The Check: Stop if user left OR changed chapter
        if (!isMounted) break;

        const chunk = allUrls.slice(i, i + CHUNK_SIZE);

        try {
          await Promise.all(chunk.map((url) => Image.prefetch(url)));
        } catch (err) {
          console.error(err);
        }
      }
    };

    prioritizedPrefetch();

    return () => {
      isMounted = false;
    };
  }, [pages]); // This correctly resets if pages change

  useEffect(() => {
    // This runs whenever you switch to a new chapter
    console.log(
      "[Reader] New chapter detected, purging previous image textures...",
    );
    Image.clearMemoryCache();

    return () => {
      // This runs when you exit the reader entirely
      Image.clearMemoryCache();
    };
  }, [params.chapterId]); // Bind strictly to the ID change

  return {
    mangaId: params.id,
    chapterId: params.chapterId,
    chapterTitle: params.chapterTitle,

    pages,
    isLoading: isApiLoading || !isReady,
    isError,

    onBack,
    onToggleReadStatus: handleToggleReadStatus,
    getItemLayout,
  };
};
