import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getChapterPageImage } from '../../services/MangakakalotClient';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import { Image } from 'react-native';

export const fetchData = async (mangaUrl, chapterUrl, pageUrl, abortSignal) => {
    try {
        const pageFileName = shorthash.unique(pageUrl)
        const cachedChapterPageImagesDir =  getMangaDirectory(mangaUrl, chapterUrl, "chapterPageImages", pageFileName)
        let pageImg = [];
        
        await ensureDirectoryExists(cachedChapterPageImagesDir.cachedFolderPath)
        const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageImagesDir.cachedFilePath);

        if (fileInfo.exists) {
            return { data: cachedChapterPageImagesDir.cachedFilePath, error: null };
        }
        
        const requestedPageData = await getChapterPageImage(pageUrl, abortSignal);
        
        if(requestedPageData) {
          pageImg = requestedPageData; 
          await FileSystem.writeAsStringAsync(cachedChapterPageImagesDir.cachedFilePath, JSON.stringify(pageImg), { encoding: FileSystem.EncodingType.Base64 });
          return { data: cachedChapterPageImagesDir.cachedFilePath, error: null };
        }

        return { data: [], error: new Error("failed to save") };

    } catch (error) {
        console.log("Fetch data error:", error);
        return { data: [], error };
    }
};


export const tryLang = async (mangaUrl) => {

    const parentKey = shorthash.unique(mangaUrl)
   

    const cachedFolderPath = `${FileSystem.cacheDirectory}${parentKey}/Zpk3Al/chapterPageLayout`
    
    const fileInfo = await FileSystem.getInfoAsync(cachedFolderPath);

    if (fileInfo.exists) {
        console.log(await FileSystem.readDirectoryAsync(cachedFolderPath))
    }
    
}

export const getImageDimensions = (imageUri) => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          resolve({ width, height });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };


