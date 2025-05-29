// context/MangaContext.tsx
import { ChapterNavigation, MangaChapter } from '@/services/ResponseTypes';
import React, { createContext, useContext, useState } from 'react';
import { useChaptersWithReadStatus } from './useChaptersWithReadStatus';

interface MangaContextType {
  chapters: MangaChapter[];
  navigationMap: { [key: string]: ChapterNavigation };
  isLoading: boolean;
}

const MangaContext = createContext<MangaContextType | undefined>(undefined);

export const MangaProvider: React.FC<{
  children: React.ReactNode;
  mangaId: string;
  mangaUrl: string;
}> = ({ children, mangaId, mangaUrl }) => {
  const [navigationMap, setNavigationMap] = useState<{ [key: string]: ChapterNavigation }>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    chapters,
    isLoading: isMangaInfoLoading,
    error: errorData,
    mangaInfo,
    setChapters,
    readChapters,
} = useChaptersWithReadStatus(mangaUrl, mangaId!);
  
  return (
    <MangaContext.Provider value={{
      chapters,
      navigationMap,
      isLoading,
    }}>
      {children}
    </MangaContext.Provider>
  );
};

export const useMangaContext = () => {
  const context = useContext(MangaContext);
  if (!context) {
    throw new Error('useMangaContext must be used within MangaProvider');
  }
  return context;
};