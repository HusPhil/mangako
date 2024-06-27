import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getChapterImageUrls } from '../../utils/MangakakalotClient';
import { prev } from 'cheerio/lib/api/traversing';


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

  

  
export const fetchData = async (mangaLink, url) => {
    try {
        const parentKey = shorthash.unique(mangaLink)
        const cacheKey = shorthash.unique(url);
        const cachedChapterPageUris = `${FileSystem.cacheDirectory}${parentKey}/${cacheKey}/chapterPages`;
        const cachedFile = "/data.json"
        let pageUrls = [];
        console.log(cachedChapterPageUris)

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

export const chapterNavigator = async (mangaLink, currentChapterUrl, next) => {
    if (!currentChapterUrl) return; 
    
    try {
        const cachedChapterList = await getCachedChapterList(mangaLink);
        if (cachedChapterList.error) {
            return { data: [], error: cachedChapterList.error };
        }

        const currentIndex = cachedChapterList.data.indexOf(currentChapterUrl);
        const targetIndex = next ? currentIndex - 1 : currentIndex + 1;
        const targetUrl = cachedChapterList.data[targetIndex];

        if (!targetUrl) {
            return { data: [], error: 'Target chapter not found' };
        }

        const fetchedNextData = await fetchData(mangaLink, targetUrl);
        return { ...fetchedNextData, url: targetUrl };

    } catch (error) {
      return { data: [], error };
    }
}





// -------------------------------- UTILITY FUNCTIONS ---------------------------------------------
const ensureDirectoryExists = async (directory) => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(directory);
        console.log("make dir:", dirInfo)
        if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }
    } catch (error) {
        console.error(`Error creating directory ${directory}:`, error);
        throw error;
    }
};

const getCachedChapterList = async (mangaLink) => {
    try {
          const parentKey = shorthash.unique(mangaLink)
          const cachedChapterListPath = `${FileSystem.cacheDirectory}${parentKey}`
          const cachedChapterListFile = "chapterList.json"
          let chapterListData;
    
          await ensureDirectoryExists(cachedChapterListPath)
          const fileInfo = await FileSystem.getInfoAsync(cachedChapterListPath + cachedChapterListFile);
    
          if (fileInfo.exists) {
            const cachedChapterListData = await FileSystem.readAsStringAsync(cachedChapterListPath + cachedChapterListFile);
            chapterListData = JSON.parse(cachedChapterListData);
            } else {
            const requestedPageData = await getChapterList(mangaLink);
            chapterListData = requestedPageData;
            await FileSystem.writeAsStringAsync(cachedChapterListPath + cachedChapterListFile, JSON.stringify(chapterListData));
          }

           const filteredList = chapterListData.map(chapter => chapter.chapterUrl)

           return { data: filteredList, error: null };
        
      } catch (error) {
        return { data: [], error };
      }

}