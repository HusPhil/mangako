// mangaCacheUtils.ts
import * as FileSystem from 'expo-file-system';
import { MangaCache, MangaLastRead, MangaOptions } from './types';

const CACHE_DIR = `${FileSystem.documentDirectory}manga_cache`;

export const getMangaDataPath = (mangaId: string) =>
  `${CACHE_DIR}/${mangaId}/data.json`;

export const ensureMangaDir = async (mangaId: string) => {
  const dir = `${CACHE_DIR}/${mangaId}/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

export const loadMangaData = async (mangaId: string): Promise<MangaCache | null> => {
  const path = getMangaDataPath(mangaId);
  const fileInfo = await FileSystem.getInfoAsync(path);
  if (!fileInfo.exists) return null;

  const content = await FileSystem.readAsStringAsync(path);
  return JSON.parse(content);
};

export const saveMangaData = async (mangaId: string, data: MangaCache) => {
  console.log("Saving manga data:", data);
  await ensureMangaDir(mangaId);
  const path = getMangaDataPath(mangaId);
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
};


export const updateMangaData = async (
  mangaId: string,
  newData: Partial<MangaCache>
): Promise<void> => {
  const existingData = await loadMangaData(mangaId) || {};

  const mergedData: MangaCache = {
    ...existingData,
    ...newData,
    options: {
      ...existingData.options,
      ...newData.options,
    },
    readChapters: newData.readChapters
      ? Array.from(new Set([...(existingData.readChapters || []), ...newData.readChapters]))
      : existingData.readChapters,
    lastRead: newData.lastRead || existingData.lastRead,
  };

  // Validate `readingMode` before assigning (avoid undefined fields)
  if (
    newData.options?.readingMode &&
    newData.options.readingMode.label &&
    newData.options.readingMode.desc &&
    newData.options.readingMode.value
  ) {
    mergedData.options!.readingMode = {
      ...existingData.options?.readingMode,
      ...newData.options.readingMode,
    };
  }

  await saveMangaData(mangaId, mergedData);
};


export const updateLastRead = async (
  mangaId: string,
  lastRead: MangaLastRead
): Promise<void> => {
  const existingData = await loadMangaData(mangaId) || {};
  const updatedData = {
    ...existingData,
    lastRead,
  };
  await saveMangaData(mangaId, updatedData);
};


export const updateReadChapters = async (
  mangaId: string,
  newChapters: string[]
): Promise<void> => {
  const existingData = await loadMangaData(mangaId) || {};
  const combinedChapters = Array.from(
    new Set([...(existingData.readChapters || []), ...newChapters])
  );

  const updatedData = {
    ...existingData,
    readChapters: combinedChapters,
  };

  await saveMangaData(mangaId, updatedData);
};


export const updateMangaOptions = async (
  mangaId: string,
  newOptions: Partial<MangaOptions>
): Promise<void> => {
  const existingData = await loadMangaData(mangaId) || {};

  const updatedData = {
    ...existingData,
    options: {
      ...existingData.options,
      ...newOptions,
      readingMode: newOptions.readingMode
        ? {
            ...existingData.options?.readingMode,
            ...newOptions.readingMode,
          }
        : existingData.options?.readingMode,
    },
  };

  await saveMangaData(mangaId, updatedData);
};
