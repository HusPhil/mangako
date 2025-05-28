// src/utils/fileStorage.ts
import * as FileSystem from 'expo-file-system';
import { MangaList } from './types';

const MANGA_LIST_PATH = FileSystem.documentDirectory + 'MangaList/mangaList.json';

export const readMangaListFile = async (): Promise<MangaList | null> => {
  try {
    const file = await FileSystem.readAsStringAsync(MANGA_LIST_PATH);
    return JSON.parse(file);
  } catch {
    return null;
  }
};

export const writeMangaListFile = async (data: MangaList): Promise<void> => {
  await FileSystem.writeAsStringAsync(MANGA_LIST_PATH, JSON.stringify(data));
};

export const ensureMangaListFolder = async () => {
  const path = FileSystem.documentDirectory + 'MangaList';
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path);
  }
};


export const cleanUnusedManga = async (): Promise<void> => {
  const currentData = await readMangaListFile();

  if (!currentData) return;

  const usedMangaIds = new Set(
    currentData.tabs.flatMap(tab => tab.mangaIds)
  );

  const cleanedManga: typeof currentData.manga = {};

  for (const mangaId of usedMangaIds) {
    if (currentData.manga[mangaId]) {
      cleanedManga[mangaId] = currentData.manga[mangaId];
    }
  }

  const cleanedData: MangaList = {
    tabs: currentData.tabs,
    manga: cleanedManga,
  };

  await writeMangaListFile(cleanedData);
};
