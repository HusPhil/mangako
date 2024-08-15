import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';

export const CONFIG_READ_WRITE_MODE = {
    MANGA_ONLY: "MANGA_ONLY",
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
  
      const existingConfig = await readMangaConfigData(mangaUrl, chapterUrl);
  
      const configToSave = mangaOnly ? 
          { ...existingConfig?.manga, ...configObject } : 
          { ...existingConfig?.chapter, ...configObject };
  
      await ensureDirectoryExists(cachedConfigFilePath);
  
      await FileSystem.writeAsStringAsync(cachedConfigFilePath + cachedFile, JSON.stringify(configToSave));
  
      return { error: null };
  
    } catch (error) {
      console.error("Fetch data error:", error);
      return { error };
    }
  };
  
  export const readMangaConfigData = async (mangaUrl, chapterUrl, isListed) => {
    try {
      const parentKey = shorthash.unique(mangaUrl);
      const chapterKey = shorthash.unique(chapterUrl);
      const path_mangaOnly = `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
      const path_mangaWithChapter = `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}${parentKey}/configs`;
      const cachedFile = "/config.json";
      let savedMangaConfig = {}
      let cachedConfig = "";
  
      await ensureDirectoryExists(path_mangaOnly);
      
      if(isListed) {
        const cacheConfigInfo = await FileSystem.getInfoAsync(`${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`)
        console.log("cacheConfigInfo", cacheConfigInfo)  
        await FileSystem.deleteAsync(path_mangaOnly, {idempotent: true})
        if(cacheConfigInfo.exists) {
          await FileSystem.moveAsync( {
            from: `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`,
            to: path_mangaOnly
          })
        }
      }

      if(chapterUrl !== CONFIG_READ_WRITE_MODE.MANGA_ONLY) {
        await ensureDirectoryExists(path_mangaWithChapter);
        const chapter_fileInfo = await FileSystem.getInfoAsync(path_mangaOnly + cachedFile);
        
        if (chapter_fileInfo.exists) {
            cachedConfig = await FileSystem.readAsStringAsync(path_mangaOnly + cachedFile);
            savedMangaConfig["chapter"] = (JSON.parse(cachedConfig))
        }
      }
      
      const manga_fileInfo = await FileSystem.getInfoAsync(path_mangaWithChapter + cachedFile);
      if (!manga_fileInfo.exists) return savedMangaConfig;  
      cachedConfig = await FileSystem.readAsStringAsync(path_mangaWithChapter + cachedFile);
      savedMangaConfig["manga"] = (JSON.parse(cachedConfig))
  
      return savedMangaConfig;  
  
    } catch (error) {
      console.error("Fetch data error:", error);
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