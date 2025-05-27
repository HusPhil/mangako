// useLastRead.ts

import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { loadMangaData, updateMangaData } from "./mangaCacheUtils";

export const useLastRead = (mangaId: string) => {
  const [hasStartedReading, setHasStartedReading] = useState<boolean>(false);

  const loadLastRead = useCallback(async () => {
    const data = await loadMangaData(mangaId);
    return data?.lastRead ?? null;
  }, [mangaId]);

  const updateLastRead = useCallback(async (chapterId: string, page: number) => {
    const data = await loadMangaData(mangaId);
    if (data) {
      data.lastRead = { chapterId, page };
      await updateMangaData(mangaId, {lastRead: {chapterId, page}});
    }
  }, [mangaId]);

  useFocusEffect(
    useCallback(() => {
      loadLastRead().then((data) => {
        if (data) {
          setHasStartedReading(true);
        }
      });
    }, [loadLastRead])
  );

  return {
    hasStartedReading,
    loadLastRead,
    updateLastRead,
  };
};
