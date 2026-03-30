import useMangaInfoScreenUIStore from "@/stores/ui-stores/manga-info-screen-ui-store";
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

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const {
    controlledChapters,

    isSelectionMode,
    selectedCount,
    readChaptersCount,

    onMarkChaptersAsRead,
    onMarkChaptersAsUnread,
    onSelectAll,
    onInvertSelect,
    onClose,

    onChapterPress,
    onChapterLongPress,
  } = useChapterListControls(
    mangaId,
    mangaSourceId,
    mangaInfo?.data?.mangaChapters,
  );

  const onBack = useCallback(() => router.back(), [router]);

  const onAddToLibrary = useCallback(() => {
    useMangaInfoScreenUIStore.getState().openModal("add_to_library", {
      mangaId,
      mangaTitle,
      mangaCover,
      mangaUrl,
      mangaSourceId,
    });
  }, []);

  useEffect(() => {
    let frameId: number;

    frameId = requestAnimationFrame(() => {
      frameId = requestAnimationFrame(() => {
        setIsReady(true);
      });
    });

    return () => {
      useMangaInfoScreenUIStore.getState().closeModal();
      cancelAnimationFrame(frameId);
      onClose();
    };
  }, []);

  return {
    isError: mangaInfo.isError,
    isLoading: mangaInfo.isLoading || !isReady,
    mangaInfo: mangaInfo.data,
    scrollY,
    mangaChapters: controlledChapters,

    isSelectionMode,
    selectedCount,
    readChaptersCount,

    onMarkChaptersAsRead,
    onMarkChaptersAsUnread,
    onSelectAll,
    onInvertSelect,
    onClose,

    onChapterPress,
    onChapterLongPress,

    onBack: onBack,
    onScroll: onScroll,
    onAddToLibrary,
  };
};
