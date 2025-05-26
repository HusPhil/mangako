// useReadChapters.ts
import { useCallback } from 'react';
import { loadMangaData, updateMangaData } from './mangaCacheUtils';

export const useReadChapters = (mangaId: string) => {
  const loadReadChapters = useCallback(async () => {
    const data = await loadMangaData(mangaId);
    return data?.readChapters || [];
  }, [mangaId]);

  const markChapterAsRead = async (chapterId: string) => {
    const currentReadChapters = await loadReadChapters();
  
    if (!currentReadChapters.includes(chapterId)) {
      const updatedReadChapters = [...currentReadChapters, chapterId];
      await updateMangaData(mangaId, { readChapters: updatedReadChapters });
    }
  };

  const clearReadChapters = async () => {
    await updateMangaData(mangaId, { readChapters: [] });
  }

  const checkIfChapterRead = async (chapterId: string) => {
    const currentReadChapters = await loadReadChapters();
    return currentReadChapters.includes(chapterId);
  }
  
  return {
    loadReadChapters,
    markChapterAsRead,
    clearReadChapters,
    checkIfChapterRead,
  };
};
