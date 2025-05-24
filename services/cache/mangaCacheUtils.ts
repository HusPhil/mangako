// mangaCacheUtils.ts
import * as FileSystem from 'expo-file-system';
import { MangaCache } from './types';

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
  await ensureMangaDir(mangaId);
  const path = getMangaDataPath(mangaId);
  await FileSystem.writeAsStringAsync(path, JSON.stringify(data));
};
