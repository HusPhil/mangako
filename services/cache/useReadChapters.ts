// useReadChapters.ts
import { useCallback } from 'react';
import { loadMangaData, saveMangaData, updateMangaData } from './mangaCacheUtils';

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

  const markMultipleChaptersAsRead = async (chapterIds: string[]) => {
    const currentReadChapters = await loadReadChapters();
    const updatedReadChapters = [...currentReadChapters, ...chapterIds];
    await updateMangaData(mangaId, { readChapters: updatedReadChapters });
  }

  const markMultipleChaptersAsUnread = async (chapterIds: string[]) => {
    const currentReadChapters = await loadReadChapters();
    console.log('currentReadChapters', currentReadChapters);
    currentReadChapters.forEach(id => {
      console.log('id', id);
      console.log('includes', chapterIds.includes(id));
    });
    const updatedReadChapters = currentReadChapters.filter(id => !chapterIds.includes(id));
    console.log('updatedReadChapters', updatedReadChapters);
    await saveMangaData(mangaId, { readChapters: updatedReadChapters });
  }

  const markChapterAsUnread = async (chapterId: string) => {
    const currentReadChapters = await loadReadChapters();
    const updatedReadChapters = currentReadChapters.filter(id => id !== chapterId);
    await updateMangaData(mangaId, { readChapters: updatedReadChapters });
  }

  

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
    markMultipleChaptersAsRead,
    markMultipleChaptersAsUnread,
    markChapterAsUnread,
    clearReadChapters,
    checkIfChapterRead,
  };
};
