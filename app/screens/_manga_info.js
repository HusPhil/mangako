import * as FileSystem from "expo-file-system";
// import { getMangaInfo } from '../../services/MangakakalotClient';
import {
  ensureDirectoryExists,
  getMangaDirectory,
} from "../../services/Global";

export const CHAPTER_LIST_MODE = Object.freeze({
  SELECT_MODE: "SELECT_MODE",
  MULTI_SELECT_MODE: "MULTI_SELECT_MODE",
});

export const READ_MARK_MODE = Object.freeze({
  MARK_AS_READ: "MARK_AS_READ",
  MARK_AS_UNREAD: "MARK_AS_UNREAD",
});

export const fetchData = async (mangaUrl, abortSignal, isListed) => {
  try {
    const cachedMangaInfoDir = isListed
      ? getMangaDirectory(
          mangaUrl,
          "N/A",
          "mangaInfo",
          "mangaInfo.json",
          FileSystem.documentDirectory
        )
      : getMangaDirectory(mangaUrl, "N/A", "mangaInfo", "mangaInfo.json");

    let mangaInfodata;

    await ensureDirectoryExists(cachedMangaInfoDir.cachedFolderPath);
    const fileInfo = await FileSystem.getInfoAsync(
      cachedMangaInfoDir.cachedFilePath
    );

    if (fileInfo.exists) {
      const cachedMangaInfodata = await FileSystem.readAsStringAsync(
        cachedMangaInfoDir.cachedFilePath
      );
      mangaInfodata = JSON.parse(cachedMangaInfodata);
    } else {
      const requestedMangaInfodata = await getMangaInfo(mangaUrl, abortSignal);
      if (requestedMangaInfodata == null) {
        return { data: [], error };
      }
      mangaInfodata = requestedMangaInfodata;
      await FileSystem.writeAsStringAsync(
        cachedMangaInfoDir.cachedFilePath,
        JSON.stringify(mangaInfodata)
      );
    }

    return { data: mangaInfodata, error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const deleteSavedMangaInfo = async (mangaUrl, isListed) => {
  try {
    const cachedMangaInfoDir = isListed
      ? getMangaDirectory(
          mangaUrl,
          "N/A",
          "mangaInfo",
          "mangaInfo.json",
          FileSystem.documentDirectory
        )
      : getMangaDirectory(mangaUrl, "N/A", "mangaInfo", "mangaInfo.json");
    await FileSystem.deleteAsync(cachedMangaInfoDir.cachedFilePath);
  } catch (error) {
    throw error;
  }
};
