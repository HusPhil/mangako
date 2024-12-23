import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';

export const CONFIG_READ_WRITE_MODE = {
    MANGA_ONLY: "MANGA_ONLY",
}

export const DOWNLOAD_STATUS  = {
  DOWNLOADED: "DOWNLOADED",
  DOWNLOADING: "DOWNLOADING",
}

export const downloadDir = "content://com.android.externalstorage.documents/tree/primary%3AMangaKo/"
export const downloadFolderNameInRoot = 'Download'

export const getMangaDownloadPermissionDir = (mangaUrl) => {
  const downloadPermissionFileName  = `downloadPermission-${shorthash.unique(mangaUrl)}.mngko`
  const downloadPermissionFilePath = `${FileSystem.documentDirectory}${downloadPermissionFileName}`

  return {downloadPermissionFileName, downloadPermissionFilePath}
}

export const ensureDirectoryExists = async (directory) => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }
    } catch (error) {
        console.error(`Error creating directory ${directory}:`, error);
        throw error;
    }
};

export const saveMangaConfigData = async (mangaUrl, chapterUrl, configObject, isListed, mangaOnly) => {
    try {
      const parentKey = shorthash.unique(mangaUrl);
      const chapterKey = shorthash.unique(chapterUrl);
      const path_mangaOnly = `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}${parentKey}/configs`;
      const path_mangaWithChapter = `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
      
      const cachedConfigFilePath = mangaOnly ? path_mangaOnly : path_mangaWithChapter
      const cachedFile = "/config.json";
  
      const existingConfig = await readMangaConfigData(mangaUrl, chapterUrl, isListed);
      


      const configToSave = mangaOnly ? 
          { ...existingConfig?.manga, ...configObject } : 
          { ...existingConfig?.chapter, ...configObject };
  
      await ensureDirectoryExists(cachedConfigFilePath);
  
      await FileSystem.writeAsStringAsync(cachedConfigFilePath + cachedFile, JSON.stringify(configToSave));
  
      return { error: null };
  
    } catch (error) {
      console.error("Save manga config error:", error);
      return { error };
    }
  };
  
  export const readMangaConfigData = async (mangaUrl, chapterUrl, isListed) => {
    try {
      const parentKey = shorthash.unique(mangaUrl);
      const chapterKey = shorthash.unique(chapterUrl);
      const path_mangaOnly = `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}${parentKey}/configs`;
      const path_mangaWithChapter = `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
      const cachedFile = "/config.json";
      let savedMangaConfig = {}
      let cachedConfig = "";
      
      await ensureDirectoryExists(path_mangaWithChapter);            

      if(chapterUrl !== CONFIG_READ_WRITE_MODE.MANGA_ONLY) {
        await ensureDirectoryExists(path_mangaOnly);
        const chapter_fileInfo = await FileSystem.getInfoAsync(path_mangaWithChapter + cachedFile);
        
        if (chapter_fileInfo.exists) {
            cachedConfig = await FileSystem.readAsStringAsync(path_mangaWithChapter + cachedFile);
            savedMangaConfig["chapter"] = (JSON.parse(cachedConfig))
        }
      }
      
      const manga_fileInfo = await FileSystem.getInfoAsync(path_mangaOnly + cachedFile);
      if (!manga_fileInfo.exists) return savedMangaConfig;  
      cachedConfig = await FileSystem.readAsStringAsync(path_mangaOnly + cachedFile);
      savedMangaConfig["manga"] = (JSON.parse(cachedConfig))
  
      return savedMangaConfig;  
  
    } catch (error) {
      console.error("Read manga config data error:", error);
      return { error };
    }
  };

export const getMangaDirectory = (mangaUrl, chapterUrl, type, filename, directoryOption) => {
    const parentKey = shorthash.unique(mangaUrl)
    const cacheKey = shorthash.unique(chapterUrl);
    const directory = directoryOption ?? FileSystem.cacheDirectory 

    const cachedFolderPath = chapterUrl === "N/A" ?  
    `${directory}${parentKey}/${type}` :
    `${directory}${parentKey}/${cacheKey}/${type}`;

    const cachedFilePath = cachedFolderPath + "/" + filename

    return {cachedFolderPath, cachedFilePath}
}

export const readSavedMangaList = async () => {
  const fileName = "mangaList.json"
  const folderName = "mangaList"
  const folderPath = `${FileSystem.documentDirectory}${folderName}`
  const filePath = `${FileSystem.documentDirectory}${folderName}/${fileName}`
  let savedMangaList = []

  //add verification if the saved data is valid

  try {
    await ensureDirectoryExists(folderPath)

    const fileInfo = await FileSystem.getInfoAsync(filePath)

    if(fileInfo.exists) {
      const retrievedFileData = await FileSystem.readAsStringAsync(filePath)
      savedMangaList = JSON.parse(retrievedFileData)
    }

  } catch (error) {
    console.error(error)
  }

  return savedMangaList;
  
}

export const saveMangaList = async (mangaListToSave) => {
  const fileName = "mangaList.json"
  const folderName = "mangaList"
  const folderPath = `${FileSystem.documentDirectory}${folderName}`
  const filePath = `${FileSystem.documentDirectory}${folderName}/${fileName}`

  try {
    await ensureDirectoryExists(folderPath)

    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(mangaListToSave),
      {encoding: FileSystem.EncodingType.UTF8}
    )

  } catch (error) {
    console.error(error)
  }
}

export const readMangaListItemConfig = async (mangaUrl) => {
  try {
    const fileName = "listItemConfig.dat"
    const mangaListItemConfigDir = getMangaDirectory(mangaUrl, "N/A", "listItemConfig", fileName, FileSystem.documentDirectory)
  
    await ensureDirectoryExists(mangaListItemConfigDir.cachedFolderPath)
    
    const fileInfo = await FileSystem.getInfoAsync(mangaListItemConfigDir.cachedFilePath)

    if(fileInfo.exists) {
      const retrievedFileData = await FileSystem.readAsStringAsync(mangaListItemConfigDir.cachedFilePath)
      return JSON.parse(retrievedFileData)
    }

    return []
    
  } catch (error) {
    console.error('An error occured while reading manga list item config:', error)
    return []
  }
}

export const saveMangaListItemConfig = async (mangaUrl, listItemConfigToSave) => {
  try {
    const fileName = "listItemConfig.dat"
    const mangaListItemConfigDir = getMangaDirectory(mangaUrl, "N/A", "listItemConfig", fileName, FileSystem.documentDirectory)
  
    await ensureDirectoryExists(mangaListItemConfigDir.cachedFolderPath)
    
    await FileSystem.writeAsStringAsync(
      mangaListItemConfigDir.cachedFilePath,
      JSON.stringify(listItemConfigToSave),
      {encoding: FileSystem.EncodingType.UTF8}
    )
    
  } catch (error) {
    console.error('An error occured while saving manga list item config:', error)
  }
}

export const deleteChapterData = async (mangaUrl, chapterUrl, isListed, autoDelete) => {
    try {
        const mangaRetrievedConfigData = await readMangaConfigData(
          mangaUrl,
          CONFIG_READ_WRITE_MODE.MANGA_ONLY,
          isListed,
          CONFIG_READ_WRITE_MODE.MANGA_ONLY
        );
        
        const downloadedChapters = mangaRetrievedConfigData?.manga?.downloadedChapters;

        if(autoDelete) {
          if(downloadedChapters) {  
            if(downloadedChapters[chapterUrl]?.downloadStatus === DOWNLOAD_STATUS.DOWNLOADED) {
              return false;
            }
          }
        }

        const pageFileName = "NO-PAGE-FILE"
        const pageMangaDir = getMangaDirectory(
            mangaUrl, chapterUrl, 
            "chapterPageImages", pageFileName,
            `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`
        )
        
        await ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
        // Delete the chapter files
        const dirInfo = await FileSystem.getInfoAsync(pageMangaDir.cachedFolderPath);
        if (dirInfo.exists) {
            await FileSystem.deleteAsync(pageMangaDir.cachedFolderPath)
        }

        

        if (downloadedChapters) {
            const updatedDownloadedChapters = { ...mangaRetrievedConfigData.manga.downloadedChapters };
            delete updatedDownloadedChapters[chapterUrl];

            await saveMangaConfigData(
                mangaUrl,
                CONFIG_READ_WRITE_MODE.MANGA_ONLY,
                { "downloadedChapters": updatedDownloadedChapters },
                isListed,
                CONFIG_READ_WRITE_MODE.MANGA_ONLY
            );
        }

        return true;
    } catch (error) {
        console.error("Error deleting chapter data:", error);
        return false;
    }
};