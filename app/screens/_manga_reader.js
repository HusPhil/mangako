import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getChapterImageUrls } from '../../services/MangakakalotClient';


// --------------------------------------- VARIABLES ONLY ---------------------------------------*/}

export const readerModeOptions = [
    {
      label: "Horizontal", value: "hor",
      desc: "Standard left-to-right viewing mode. Most commonly used for reading manhwas."
    },
    {
      label: "Horizontal (inverted)", value: "hor-inv",
      desc: "Reading direction is right-to-left. Most commonly used for reading mangas."
    },
    {
      label: "Vertical", value: "ver",
      desc: "Vertical top-to-bottom viewing mode. Perfect fit for reading manhuas."
    },
  ]


// --------------------------------------- VARIABLES ONLY ---------------------------------------*/}

  

  
export const fetchData = async (mangaUrl, url) => {
    try {
        const parentKey = shorthash.unique(mangaUrl)
        const cacheKey = shorthash.unique(url);
        const cachedChapterPageUris = `${FileSystem.cacheDirectory}${parentKey}/${cacheKey}/chapterPages`;
        const cachedFile = "/data.json"
        let pageUrls = [];

        await ensureDirectoryExists(cachedChapterPageUris)
        const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageUris + cachedFile);

        if (fileInfo.exists) {
        const cachedPageData = await FileSystem.readAsStringAsync(cachedChapterPageUris + cachedFile);
        pageUrls = JSON.parse(cachedPageData);
        } else {
        const requestedPageData = await getChapterImageUrls(url);
        pageUrls = requestedPageData;
        await FileSystem.writeAsStringAsync(cachedChapterPageUris + cachedFile, JSON.stringify(pageUrls));
        }

        return { data: pageUrls, error: null };

    } catch (error) {
        console.error("Fetch data error:", error);
        return { data: [], error };
    }
};

export const chapterNavigator = async (mangaUrl, currentChapterUrl, next) => {
    if (!currentChapterUrl) return; 
    
    try {
        const cachedChapterList = await getCachedChapterList(mangaUrl);
        if (cachedChapterList.error) {
            return { data: [], error: cachedChapterList.error };
        }

        const currentIndex = cachedChapterList.data.indexOf(currentChapterUrl);
        const targetIndex = next ? currentIndex - 1 : currentIndex + 1;
        const targetUrl = cachedChapterList.data[targetIndex];

        if (!targetUrl) {
            return { data: [], error: 'Target chapter not found' };
        }

        const fetchedNextData = await fetchData(mangaUrl, targetUrl);
        return { ...fetchedNextData, url: targetUrl };

    } catch (error) {
      return { data: [], error };
    }
}

export const saveMangaConfigData = async (mangaUrl, chapterUrl, configObject) => {
  try {
    const parentKey = shorthash.unique(mangaUrl);
    const chapterKey = shorthash.unique(chapterUrl);
    const cachedConfigFilePath = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
    const cachedFile = "/config.json";

    // Read the existing config data
    const existingConfig = await readMangaConfigData(mangaUrl, chapterUrl);

    // Merge existing config with new config object
    const configToSave = { ...existingConfig, ...configObject };

    // Ensure directory exists
    await ensureDirectoryExists(cachedConfigFilePath);

    // Write the merged config data to the file
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
    const cachedConfigFilePath = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/configs`;
    const cachedFile = "/config.json";
    let cachedConfig = "";

    await ensureDirectoryExists(cachedConfigFilePath);
    const fileInfo = await FileSystem.getInfoAsync(cachedConfigFilePath + cachedFile);

    if (fileInfo.exists) {
      cachedConfig = await FileSystem.readAsStringAsync(cachedConfigFilePath + cachedFile);
    } else {
      // Handle the case where the file does not exist
      return null;  // or any default value you wish to return
    }

    try {
      return JSON.parse(cachedConfig);
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      return { error: jsonError };
    }

  } catch (error) {
    console.error("Fetch data error:", error);
    return { error };
  }
};

export const deleteConfigData = async (mangaUrl, chapterUrl, type) => {
  try {
    const parentKey = shorthash.unique(mangaUrl);
    const chapterKey = shorthash.unique(chapterUrl);
    const cachedConfigFilePath = `${FileSystem.cacheDirectory}${parentKey}/${chapterKey}/${type}`;
    const cachedFile = `/${type}.json`;
    await FileSystem.deleteAsync(cachedConfigFilePath + cachedFile)
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