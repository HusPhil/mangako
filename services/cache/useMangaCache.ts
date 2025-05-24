
// useMangaCache.ts
import { useCallback, useEffect, useState } from 'react';
import { loadMangaData, saveMangaData } from './mangaCacheUtils';
import { MangaCache } from './types';

export const useMangaCache = (mangaId: string) => {
  const [data, setData] = useState<MangaCache>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMangaData(mangaId).then((result) => {
      setData(result || {});
      setIsLoading(false);
    });
  }, [mangaId]);

  const updateData = useCallback(
    async (newData: Partial<MangaCache>) => {
      const updated = { ...data, ...newData };
      setData(updated);
      await saveMangaData(mangaId, updated);
    },
    [data, mangaId]
  );

  return { data, updateData, isLoading };
};
