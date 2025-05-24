// useLastRead.ts
import { useMangaCache } from './useMangaCache';

export const useLastRead = (mangaId: string) => {
  const { data, updateData, isLoading } = useMangaCache(mangaId);

  const updateLastRead = (chapterId: string, page: number) => {
    updateData({ lastRead: { chapterId, page } });
  };

  return {
    lastRead: data.lastRead ?? null,
    updateLastRead,
    isLoading,
  };
};
