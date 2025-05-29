// useReadingOptions.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMangaData, updateMangaData } from './mangaCacheUtils';
import { ReaderMode } from './types';

export const READER_MODES: ReaderMode[] = [
  {
    label: "Right-to-left", 
    value: {
      inverted: true,
      horizontal: true,
    },
    desc: "Reading direction is right-to-left. Most commonly used for reading mangas."
  },
  {
    label: "Left-to-right", 
    value: {
      inverted: false,
      horizontal: true,
    },
    desc: "Standard left-to-right viewing mode. Most commonly used for reading manhuas."
  },
  {
    label: "Vertical", 
    value: {
      inverted: false,
      horizontal: false,
    },
    desc: "Vertical top-to-bottom viewing mode. Perfect fit for reading manhwas."
  },
];

export const useReadingOptions = (mangaId: string) => {
  const [readingMode, setReadingMode] = useState<ReaderMode>(READER_MODES[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use ref to track current mangaId to avoid stale closures
  const currentMangaIdRef = useRef(mangaId);
  const isUpdatingRef = useRef(false);

  // Memoized function to load reading mode
  const loadReadingMode = useCallback(async (id: string): Promise<ReaderMode> => {
    try {
      const data = await loadMangaData(id);
      return data?.options?.readingMode ?? READER_MODES[0];
    } catch (err) {
      console.error('Failed to load reading mode:', err);
      throw err instanceof Error ? err : new Error('Failed to load reading mode');
    }
  }, []);

  // Memoized update function with optimistic updates and error handling
  const updateReadingMode = useCallback(async (mode: ReaderMode) => {
    if (isUpdatingRef.current) return; // Prevent concurrent updates
    
    const previousMode = readingMode;
    
    try {
      isUpdatingRef.current = true;
      setError(null);
      
      // Optimistic update
      setReadingMode(mode);
      
      await updateMangaData(currentMangaIdRef.current, { 
        options: { readingMode: mode } 
      });
    } catch (err) {
      // Rollback on error
      setReadingMode(previousMode);
      const error = err instanceof Error ? err : new Error('Failed to update reading mode');
      setError(error);
      console.error('Failed to update reading mode:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [readingMode]);

  // Effect to load initial reading mode
  useEffect(() => {
    let isCancelled = false;
    
    const loadInitialMode = async () => {
      // Reset state when mangaId changes
      if (currentMangaIdRef.current !== mangaId) {
        setIsLoading(true);
        setError(null);
        currentMangaIdRef.current = mangaId;
      }

      try {
        const mode = await loadReadingMode(mangaId);
        
        // Only update state if the effect hasn't been cancelled
        if (!isCancelled && currentMangaIdRef.current === mangaId) {
          setReadingMode(mode);
        }
      } catch (err) {
        if (!isCancelled && currentMangaIdRef.current === mangaId) {
          const error = err instanceof Error ? err : new Error('Failed to load reading mode');
          setError(error);
          // Fallback to default mode on error
          setReadingMode(READER_MODES[0]);
        }
      } finally {
        if (!isCancelled && currentMangaIdRef.current === mangaId) {
          setIsLoading(false);
        }
      }
    };

    loadInitialMode();

    // Cleanup function to cancel the effect
    return () => {
      isCancelled = true;
    };
  }, [mangaId, loadReadingMode]);

  return {
    readingMode,
    updateReadingMode,
    isLoading,
    error,
  };
};