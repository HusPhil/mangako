// useReadingOptions.ts
import { MangaReadingOptions } from './types';
import { useMangaCache } from './useMangaCache';

const DEFAULT_OPTIONS: MangaReadingOptions = {
  horizontal: false,
  inverted: false,
};

export const useReadingOptions = (mangaId: string) => {
  const { data, updateData, isLoading } = useMangaCache(mangaId);

  const updateOptions = (options: Partial<MangaReadingOptions>) => {
    const merged = {
      ...DEFAULT_OPTIONS,
      ...(data.options ?? {}),
      ...options,
    };
    updateData({ options: merged });
  };

  return {
    options: {
      ...DEFAULT_OPTIONS,
      ...(data.options ?? {}),
    },
    updateOptions,
    isLoading,
  };
};
