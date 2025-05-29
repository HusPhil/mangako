import { useReadChapters } from "@/services/cache/useReadChapters";
import { MangaChapter } from "@/services/ResponseTypes";
import { useGetMangaInfo } from "@/services/useGetMangaInfo";
import { useChapterNavigationStore } from "@/stores/chapterNavigationStore";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export const useChaptersWithReadStatus = (mangaUrl: string, mangaId: string) => {
  const {
    data: mangaInfo,
    isLoading: isMangaInfoLoading,
    error: errorData,
  } = useGetMangaInfo("mangakakalot", mangaUrl!);

  const {
    loadReadChapters,
    markChapterAsRead,
  } = useReadChapters(mangaId);

  const [chapters, setChapters] = useState<MangaChapter[]>([]);
  const [readChapters, setReadChapters] = useState<string[]>([]);
  const setNavigationMap = useChapterNavigationStore((state) => state.setNavigationMap);
  // Update chapters initially when mangaInfo or readChapters are ready
  // Refresh read status on screen focus
  useFocusEffect(
    useCallback(() => {
        if(!isMangaInfoLoading) {
            loadReadChapters().then((readChapters) => {
                setReadChapters(readChapters);
                setChapters(mangaInfo?.mangaChapters.map(chapter => ({
                    ...chapter,
                    isRead: readChapters.includes(chapter.chapterId) || false
                })) ?? []);
                setNavigationMap(mangaInfo?.chaptersNavigationMap || {});
            });
        }
    }, [isMangaInfoLoading])
  );

  return {
    chapters,
    readChapters,
    mangaInfo,
    isLoading: isMangaInfoLoading   ,
    error: errorData,
    markChapterAsRead,
  };
};


export default useChaptersWithReadStatus;