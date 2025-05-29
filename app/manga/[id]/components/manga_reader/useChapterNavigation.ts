// hooks/useChapterNavigation.ts
import { ChapterNavigation } from '@/services/ResponseTypes';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

interface UseChapterNavigationProps {
  mangaId: string;
  currentChapterId: string;
  navigationMap: { [key: string]: ChapterNavigation };
}

export const useChapterNavigation = ({ 
  mangaId, 
  currentChapterId, 
  navigationMap 
}: UseChapterNavigationProps) => {
  const router = useRouter();
  const [currentNavigation, setCurrentNavigation] = useState<ChapterNavigation>({});
  
  useEffect(() => {
    // Get navigation data for current chapter
    const navData = navigationMap[currentChapterId];
    setCurrentNavigation(navData || {});
  }, [currentChapterId, navigationMap]);
  
  const navigateToNext = useCallback(() => {
    const nextChapter = currentNavigation.next;
    if (nextChapter) {
      const query = new URLSearchParams({ 
        chapterUrl: nextChapter.chapterUrl 
      }).toString();
      router.push(`/manga/${mangaId}/${nextChapter.chapterId}?${query}`);
    }
  }, [currentNavigation.next, mangaId, router]);
  
  const navigateToPrev = useCallback(() => {
    const prevChapter = currentNavigation.prev;
    if (prevChapter) {
      const query = new URLSearchParams({ 
        chapterUrl: prevChapter.chapterUrl 
      }).toString();
      router.push(`/manga/${mangaId}/${prevChapter.chapterId}?${query}`);
    }
  }, [currentNavigation.prev, mangaId, router]);
  
  return {
    canGoNext: !!currentNavigation.next,
    canGoPrev: !!currentNavigation.prev,
    navigateToNext,
    navigateToPrev,
    nextChapter: currentNavigation.next,
    prevChapter: currentNavigation.prev,
  };
};