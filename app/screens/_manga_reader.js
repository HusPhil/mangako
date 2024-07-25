import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getChapterPageUrls, getChapterList } from '../../services/MangakakalotClient';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';


// --------------------------------------- VARIABLES ONLY ---------------------------------------*/}

export const READER_MODES = [
    {
      label: "Horizontal", value: "hor",
      desc: "Standard left-to-right viewing mode. Most commonly used for reading manhuas."
    },
    {
      label: "Horizontal (inverted)", value: "hor-inv",
      desc: "Reading direction is right-to-left. Most commonly used for reading mangas."
    },
    {
      label: "Vertical", value: "ver",
      desc: "Vertical top-to-bottom viewing mode. Perfect fit for reading manhwas."
    },
  ]

export const CHAPTER_NAVIGATION = {
    NEXT: "NEXT",
    PREV: "PREV",
    JUMP: "JUMP",
}


// --------------------------------------- VARIABLES ONLY ---------------------------------------*/}


export const fetchData = async (mangaUrl, chapterUrl, abortSignal) => {
    try {
        const cachedChapterPagesDir =  getMangaDirectory(mangaUrl, chapterUrl, "chapterPages", "pages.json")
        let pageUrls = [];
                
        await ensureDirectoryExists(cachedChapterPagesDir.cachedFolderPath)
        const fileInfo = await FileSystem.getInfoAsync(cachedChapterPagesDir.cachedFilePath);
        
        if (fileInfo.exists) {
          const cachedPageData = await FileSystem.readAsStringAsync(cachedChapterPagesDir.cachedFilePath);
          pageUrls = JSON.parse(cachedPageData);
          return { data: pageUrls, error: null };
        } 

        const requestedPageData = await getChapterPageUrls(chapterUrl, abortSignal);
        if(requestedPageData) {
          pageUrls = requestedPageData;
          await FileSystem.writeAsStringAsync(cachedChapterPagesDir.cachedFilePath, JSON.stringify(pageUrls));
          return { data: pageUrls, error: null };
        }

        return { data: [], error };
    } catch (error) {
        console.error("Fetch data error:", error);
        return { data: [], error };
    }
};

export const chapterNavigator = async (mangaUrl, targetIndex, abortSignal) => {
    
   try {
    const cachedChapterList = await getChapterList(mangaUrl, abortSignal)
    const targetChapter = cachedChapterList[targetIndex] 

    if(!targetChapter) throw new Error("Target chapter undefined")

    const fetchedNextChapter = await fetchData(mangaUrl, targetChapter.chapterUrl, abortSignal)

    return { ...fetchedNextChapter, targetChapter}

  } catch (error) {
    console.log(error)
    return {data: [], error}
   }

}
export const saveMangaConfigData = async (mangaUrl, chapterUrl, configObject, mangaOnly) => {
  try {
    const parentKey = shorthash.unique(mangaUrl);
    const chapterKey = shorthash.unique(chapterUrl);
    const path_mangaOnly = `${FileSystem.cacheDirectory}${parentKey}/configs`;
    const path_mangaWithChapter = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
    
    const cachedConfigFilePath = mangaOnly ? path_mangaOnly : path_mangaWithChapter
    const cachedFile = "/config.json";

    const existingConfig = await readMangaConfigData(mangaUrl, chapterUrl);

    if (!existingConfig.manga) {
      existingConfig.manga = {};
    }

    if(!existingConfig.manga.readingStatsList) {
      const controller = new AbortController()

      const fetchedChapterList = await mangaInfoFetchData(mangaUrl, controller.signal)

      if(fetchedChapterList.error) throw fetchedChapterList.error

      const readingStatsList = Array(fetchedChapterList.data.chapterList.length).fill(false)
      
      existingConfig.manga.readingStatsList = readingStatsList;

      await ensureDirectoryExists(path_mangaOnly);
      await FileSystem.writeAsStringAsync(`${FileSystem.cacheDirectory}${parentKey}/configs` + cachedFile, JSON.stringify(configToSave));

      // console.log("reading stats", existingConfig?.manga?.readingStatsList)
    }

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

export const readMangaConfigData = async (mangaUrl, chapterUrl) => {
try {
  const parentKey = shorthash.unique(mangaUrl);
  const chapterKey = shorthash.unique(chapterUrl);
  const path_mangaOnly = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
  const path_mangaWithChapter = `${FileSystem.cacheDirectory}${parentKey}/configs`;
  const cachedFile = "/config.json";
  let savedMangaConfig = {}
  let cachedConfig = "";

  await ensureDirectoryExists(path_mangaOnly);

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


export const deleteConfigData = async (mangaUrl, chapterUrl, type) => {
  try {
    const parentKey = shorthash.unique(mangaUrl);
    const chapterKey = shorthash.unique(chapterUrl);
    const cachedConfigFilePath = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
    // const cachedFile = `/config.json`;
    await FileSystem.deleteAsync(cachedConfigFilePath)
  } catch (error) {
    
  }
}

export const saveItemLayout = async (mangaUrl, chapterUrl, pageUrls, layoutArr) => {
  const parentKey = shorthash.unique(mangaUrl);
  const chapterKey = shorthash.unique(chapterUrl);
  const cachedConfigFilePath = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/layout`;
  const cachedFile = "/layout.json";
  let heightLayout = Array(pageUrls.length).fill(0);


  try {
    await ensureDirectoryExists(cachedConfigFilePath);
    const fileInfo = await FileSystem.getInfoAsync(cachedConfigFilePath + cachedFile);

    await FileSystem.writeAsStringAsync(cachedConfigFilePath + cachedFile, JSON.stringify(layoutArr));

    return { error: null };
  } catch (error) {
    console.error('Error saving item layout:', error);
    return { error };
  }
};

export const readItemLayout = async (mangaUrl, chapterUrl) => {
  const parentKey = shorthash.unique(mangaUrl);
  const chapterKey = shorthash.unique(chapterUrl);
  const cachedConfigFilePath = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/layout`;
  const cachedFile = "/layout.json";

  await ensureDirectoryExists(cachedConfigFilePath);
  const fileInfo = await FileSystem.getInfoAsync(cachedConfigFilePath + cachedFile);

  if (fileInfo.exists) {
    return JSON.parse(await FileSystem.readAsStringAsync(cachedConfigFilePath + cachedFile));
  } 
  
  return null
}

export const scrollToOffsetByIndex = (index, layoutArr) => {
  let offset = 0;

  if(index === 0) return index
  
  layoutArr.slice(0, index).forEach((item) => {
    offset += item;
  });

  return offset;
};


// -------------------------------- UTILITY FUNCTIONS ---------------------------------------------


const getCachedChapterList = async (mangaUrl) => {
    try {
          const parentKey = shorthash.unique(mangaUrl)
          const cachedChapterListPath = `${FileSystem.cacheDirectory}${parentKey}`
          const cachedChapterListFile = "chapterList.json"
          let chapterListData;
    
          await ensureDirectoryExists(cachedChapterListPath)
          const fileInfo = await FileSystem.getInfoAsync(cachedChapterListPath + cachedChapterListFile);
    
          if (fileInfo.exists) {
            const cachedChapterListData = await FileSystem.readAsStringAsync(cachedChapterListPath + cachedChapterListFile);
            chapterListData = JSON.parse(cachedChapterListData);
            } else {
            const requestedPageData = await getChapterList(mangaUrl);
            chapterListData = requestedPageData;
            await FileSystem.writeAsStringAsync(cachedChapterListPath + cachedChapterListFile, JSON.stringify(chapterListData));
          }

           const filteredList = chapterListData.map(chapter => chapter.chapterUrl)

           return { data: filteredList, error: null };
        
      } catch (error) {
        return { data: [], error };
      }

}

const getCacheFilePath = (mangaUrl, chapterUrl, type) => {
  const parentKey = shorthash.unique(mangaUrl);
  const chapterKey = shorthash.unique(chapterUrl);
  return `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/${type}.json`;
};