import { useLibraryStore } from "@/stores/library-store";
import { useReadingStore } from "@/stores/reading-progress-store";
import { Button } from "@react-navigation/elements";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Text, View } from "react-native";

const MangaReaderScreen = () => {
  const {
    id: mangaId,
    chapterId,
    chapterTitle,
    chapterUrl,
  } = useLocalSearchParams();

  if (!mangaId) return null;

  const getMangaById = useLibraryStore((state) => state.getMangaById);
  const mangaInfo = useMemo(() => getMangaById(mangaId as string), [mangaId]);

  const mangaUrl = mangaInfo?.manga_url;
  const mangaCover = mangaInfo?.cover_url;
  const mangaTitle = mangaInfo?.title;
  const mangaSourceId = mangaInfo?.source_id;

  if (!mangaTitle || !mangaCover || !mangaUrl || !mangaSourceId || !mangaId)
    return null;

  const handleMarkAsRead = useCallback((mangaId: string, chapterId: string) => {
    const isRead = true;
    const mangaInput = useLibraryStore.getState().getMangaById(mangaId);

    useReadingStore.getState().markChapters(
      mangaId,
      [
        {
          id: chapterId,
          title: chapterTitle as string,
          url: chapterUrl as string,
        },
      ],
      isRead,
    );
  }, []);

  const handleMarkAsUnRead = useCallback(
    (mangaId: string, chapterId: string) => {
      const isRead = false;
      useReadingStore.getState().markChapters(
        mangaId,
        [
          {
            id: chapterId,
            title: chapterTitle as string,
            url: chapterUrl as string,
          },
        ],
        isRead,
      );
    },
    [],
  );

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="bg-primary p-5">{mangaId}</Text>
      <Text className="bg-primary p-5">{chapterId}</Text>
      <Button
        onPressOut={() => {
          handleMarkAsRead(mangaId as string, chapterId as string);
        }}
      >
        Mark as read
      </Button>
      <Button
        onPressOut={() => {
          handleMarkAsUnRead(mangaId as string, chapterId as string);
        }}
      >
        Mark as unread
      </Button>
    </View>
  );
};

export default MangaReaderScreen;
