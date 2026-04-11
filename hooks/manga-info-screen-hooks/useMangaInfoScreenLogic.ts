import { useReadingProgressStore } from "@/stores/reading-progress-store";
import useMangaInfoScreenUIStore from "@/stores/ui-stores/manga-info-screen-ui-store";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useGetMangaInfo } from "../api/useGetMangInfo";
import { MangaReaderScreenParams } from "../manga-reader-screen-hooks/useMangaReaderScreenLogic";
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

  const lastReadData = useReadingProgressStore
    .getState()
    .getMangaProgress(mangaId);

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

  const onContinueReading = useCallback(() => {
    const readerScreenParams: MangaReaderScreenParams = {
      id: mangaId,
      mangaSourceId,
      chapterId:
        lastReadData?.last_read_chapter_id ||
        controlledChapters[0]?.chapterId ||
        "",
      chapterTitle:
        lastReadData?.last_read_chapter_title ||
        controlledChapters[0]?.chapterTitle ||
        "",
      chapterUrl:
        lastReadData?.last_read_chapter_url ||
        controlledChapters[0]?.chapterUrl ||
        "",
      chapterTimeUploaded:
        mangaInfo.data?.mangaChapters[0].chapterTimeUploaded || "",
    };

    router.push({
      pathname: `/manga/[id]/[chapterId]`,
      params: {
        ...readerScreenParams,
      },
    });
  }, [mangaInfo.data]);

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
        console.log(lastReadData);
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

    lastReadChapterTitle: lastReadData?.last_read_chapter_title,
    lastReadChapterDate: lastReadData?.last_read_at,

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
    onContinueReading,
    hasStartedReading: !!lastReadData?.last_read_chapter_id,
  };
};
