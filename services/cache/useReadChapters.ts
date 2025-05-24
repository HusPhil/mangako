// useReadChapters.ts
import { useMangaCache } from './useMangaCache';

export const useReadChapters = (mangaId: string) => {
  const { data, updateData, isLoading } = useMangaCache(mangaId);
  const readChapters = data.readChapters ?? [];

  const markChapterAsRead = (chapterId: string) => {
    if (!readChapters.includes(chapterId)) {
      updateData({ readChapters: [...readChapters, chapterId] });
    }
  };

  return {
    readChapters,
    markChapterAsRead,
    isLoading,
  };
};
