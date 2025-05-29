// useLastRead.ts

import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { loadMangaData, saveMangaData } from "./mangaCacheUtils";
import { MangaLastRead } from "./types";

export const useLastRead = (mangaId: string) => {
  const [hasStartedReading, setHasStartedReading] = useState<boolean>(false);
  const [lastRead, setLastRead] = useState<MangaLastRead | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadLastRead = useCallback(async () => {
    const data = await loadMangaData(mangaId);
    return data?.lastRead ?? null;
  }, [mangaId]);

  const updateLastRead = async (
    mangaId: string,
    lastRead: MangaLastRead
  ): Promise<void> => {
    const existingData = await loadMangaData(mangaId) || {};
    const updatedData = {
      ...existingData,
      lastRead,
    };
    await saveMangaData(mangaId, updatedData);
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadLastRead().then((data) => {
        if (data) {
          console.log('Last read data:', data);
          setLastRead(data);
          setHasStartedReading(true);
        }
        setIsLoading(false);
      });
    }, [loadLastRead])
  );

  return {
    hasStartedReading,
    lastRead,
    isLoading,
    loadLastRead,
    updateLastRead,
  };
};
