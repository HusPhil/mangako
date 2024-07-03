import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getMangaInfo } from '../../services/MangakakalotClient';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';


export const fetchData = async (mangaUrl, abortSignal) => {
  try {
      const cachedMangaInfoDir =  getMangaDirectory(mangaUrl, "N/A", "mangaInfo", "mangaInfo.json")
      let mangaInfodata;
      
      await ensureDirectoryExists(cachedMangaInfoDir.cachedFolderPath)
      const fileInfo = await FileSystem.getInfoAsync(cachedMangaInfoDir.cachedFilePath);
      
      if (fileInfo.exists) {
          const cachedMangaInfodata = await FileSystem.readAsStringAsync(cachedMangaInfoDir.cachedFilePath);
          mangaInfodata = JSON.parse(cachedMangaInfodata);
      } 
      else {
          const requestedMangaInfodata = await getMangaInfo(mangaUrl, abortSignal);
          if(requestedMangaInfodata == null) {
            return {data: [], error}
          }
          mangaInfodata = requestedMangaInfodata;
          await FileSystem.writeAsStringAsync(cachedMangaInfoDir.cachedFilePath, JSON.stringify(mangaInfodata));
      }
      
      return {data: mangaInfodata, error: null}
  } 
  catch (error) {
      return {data: [], error}
  }
}
