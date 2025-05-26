// useMangaCache.ts
import { useCallback, useEffect, useState } from 'react';
import { loadMangaData, saveMangaData } from './mangaCacheUtils';
import { MangaCache } from './types';

export const useMangaCache = (mangaId: string) => {
  const [data, setData] = useState<MangaCache>({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await loadMangaData(mangaId);
    setData(result || {});
    setIsLoading(false);
  }, [mangaId]);

  useEffect(() => {
    load();
  }, []);

  const updateData = useCallback(
    async (newData: Partial<MangaCache>) => {
      const updated = { ...data, ...newData };
      await saveMangaData(mangaId, updated);
      setData(updated);
      return updated;
    },
    [mangaId, data]
  );

  return { data, updateData, isLoading, reload: load };
};
