// useReadingOptions.ts
import { useEffect, useState } from 'react';
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
]


export const useReadingOptions = (mangaId: string) => {
  const [readingMode, setReadingMode] = useState<ReaderMode>(READER_MODES[0]);

  const updateReadingMode = (mode: ReaderMode) => {
    updateMangaData(mangaId, { options: { readingMode: mode } }).then(() => {
      setReadingMode(mode);
    });
  };

  const loadReadingMode = async() => {
    const data = await loadMangaData(mangaId);
    return data?.options?.readingMode ?? READER_MODES[0]
  }

  useEffect(() => {
      loadReadingMode().then((mode) => {
        console.log("Loading reading mode:", mode);
        setReadingMode(mode);
      });
  }, [mangaId]);

  return {
    readingMode,
    updateReadingMode,
  };
};
