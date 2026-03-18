import { isError } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    useAnimatedScrollHandler,
    useSharedValue,
} from "react-native-reanimated";
import { useGetMangaInfo } from "../api/useGetMangInfo";
export const useMangaInfoScreenLogic = (
  mangaSourceId: string,
  mangaUrl: string,
) => {
  const router = useRouter();

  const scrollY = useSharedValue(0);

  const mangaInfo = useGetMangaInfo(mangaSourceId!, mangaUrl!);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleBack = useCallback(() => router.back(), [router]);

  const [isReady, setIsReady] = useState(false);

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
    handleBack,
    onScroll,
    scrollY,
    isError: isError(mangaInfo),
    isLoading: mangaInfo.isLoading || !isReady,
    mangaInfo: mangaInfo.data,
  };
};
