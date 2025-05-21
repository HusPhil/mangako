import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getChapterPageImage, getDownloadResumableImage } from '../../services/MangakakalotClient';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import { Image } from 'react-native';

export const fetchData = async (mangaUrl, chapterUrl, pageUrl, abortSignal) => {
    try {
        const pageFileName = shorthash.unique(pageUrl)
        const cachedChapterPageImagesDir =  getMangaDirectory(
          mangaUrl, chapterUrl, 
          "chapterPageImages", pageFileName,
          `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`
          )
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

export const getFileInfoInLocalStorage = async (folderUri, fileName) => {
  try {
    const folderContent = await FileSystem.StorageAccessFramework.readDirectoryAsync(folderUri)

    let fileContent;

    for (const file of folderContent) {
      if(file.includes(fileName)) {
        fileContent = await FileSystem.StorageAccessFramework.readAsStringAsync(file)
        return {fileContent, exists: true}
      }
    }

    return {fileContent, exists: false}
  } catch (error) {
    if (error.message.includes('ENOENT')) {
      console.log('File does not exist');
    } else {
      console.error('Error accessing the file:', error);
    }
    return {exists: false};
  }
}

export const downloadPageToLocal = async (
  mangaUrl, chapterUrl, pageUrl, 
  pageSaveableDataFileUri, downloadDir, 
  callback, otherData
) => {
  try {
      const pageFileName = shorthash.unique(pageUrl)
      const cachedChapterPageImagesDir =  getMangaDirectory(
          mangaUrl, chapterUrl, 
          "chapterPageImages", pageFileName,
          downloadDir
          )
      
      const saveableDataFileInfo = await getFileInfoInLocalStorage(pageSaveableDataFileUri)
      
      let resumeData;

      if(saveableDataFileInfo.exists) {
          const parsedSavableData = JSON.parse(saveableDataFileInfo.fileContent)
          resumeData = parsedSavableData.resumeData
          console.log("resumeData", resumeData)
      }

      const downloadResumableImage =  getDownloadResumableImage(
          pageUrl, cachedChapterPageImagesDir.cachedFilePath, 
          resumeData, callback, otherData
      )
      
      return downloadResumableImage
      
  } catch (error) {
      console.log("An error occured at download page to local data error:", error);
      throw error
      return { data: {}, error };
  }
};

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


