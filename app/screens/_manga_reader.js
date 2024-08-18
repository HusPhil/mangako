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

export const loadingRangeDesc = "Range to load from the current page. Higher values improve reading smoothness but increase processing power usage."

// --------------------------------------- VARIABLES ONLY ---------------------------------------*/}


export const fetchData = async (mangaUrl, chapterUrl, abortSignal, isListed) => {
    try {
        const cachedChapterPagesDir =  getMangaDirectory(
          mangaUrl, chapterUrl, 
          "chapterPages", "pages.json", 
          `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`)
        
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

        throw new Error("Failed to fetch chapter pages")

    } catch (error) {
        console.error("Fetch data error:", error);
        return { data: [], error };
    }
};

export const chapterNavigator = async (mangaUrl, targetIndex, chapterList, abortSignal, isListed) => {
    
   try {
    const targetChapter = chapterList[targetIndex] 

    if(!targetChapter) throw new Error("Target chapter undefined")

    const fetchedNextChapter = await fetchData(mangaUrl, targetChapter.chapterUrl, abortSignal, isListed)

    return { ...fetchedNextChapter, targetChapter}

  } catch (error) {
    console.log(error)
    return {data: [], error}
   }

}


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