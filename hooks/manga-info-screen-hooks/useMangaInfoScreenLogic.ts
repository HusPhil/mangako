import { useLibraryStore } from "@/stores/library-store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useGetMangaInfo } from "../api/useGetMangInfo";
import { useChapterListControls } from "./useChapterListControls";

export const useMangaInfoScreenLogic = (
  mangaSourceId: string,
  mangaUrl: string,
  mangaId: string,
  mangaTitle: string,
  mangaCover: string,
) => {
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);
  const scrollY = useSharedValue(0);
  const mangaInfo = useGetMangaInfo(mangaSourceId!, mangaUrl!);

  const { onChapterPress, onChapterLongPress } = useChapterListControls(
    mangaInfo?.data?.mangaChapters || [],
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const onBack = useCallback(() => router.back(), [router]);

  const onAddToLibrary = useCallback(() => {
    // resetLibrary(db);
    useLibraryStore.getState().addMangaToLibrary({
      mangaId: mangaId,
      manga_url: mangaUrl,
      title: mangaTitle,
      cover_url: mangaCover,
      source_id: mangaSourceId,
    });
  }, []);

  useEffect(() => {
    let frameId: number;

    frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => {
        setIsReady(true);
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  return {
    isError: mangaInfo.isError,
    isLoading: mangaInfo.isLoading || !isReady,
    mangaInfo: mangaInfo.data,
    scrollY,

    onChapterPress,
    onChapterLongPress,

    onBack: onBack,
    onScroll: onScroll,
    onAddToLibrary,
  };
};
