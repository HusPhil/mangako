import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getChapterList } from '../../services/MangakakalotClient';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import axios from 'axios';

// export const fetchData = async (mangaUrl) => {
//     try {
//         const controller = new AbortController()
//         console.log("eto ay controller:", controller)

//         const cachedChapterListDir =  getMangaDirectory(mangaUrl, "N/A", "chapterList", "chapterList.json")
//         let chapterListData;
        
//         await ensureDirectoryExists(cachedChapterListDir.cachedFolderPath)
//         const fileInfo = await FileSystem.getInfoAsync(cachedChapterListDir.cachedFilePath);
        
//         if (fileInfo.exists) {
//             const cachedChapterListData = await FileSystem.readAsStringAsync(cachedChapterListDir.cachedFilePath);
//             chapterListData = JSON.parse(cachedChapterListData);
//         } 
//         else {
//             const requestedChapterListData = await getChapterList(mangaUrl);
//             chapterListData = requestedChapterListData;
//             await FileSystem.writeAsStringAsync(cachedChapterListDir.cachedFilePath, JSON.stringify(chapterListData));
//         }
        
//         return {data: chapterListData, error: null}
//     } 
//     catch (error) {
//         return {data: [], error}
//     }
// }

export const fetchData = (mangaUrl, signal) => {

    const myPromise =  new Promise(async (resolve, reject) => {
        try {

            if(signal.aborted) {
                console.log("abort")
                return
            }

            const cachedChapterListDir = getMangaDirectory(mangaUrl, "N/A", "chapterList", "chapterList.json");
            let chapterListData;
            
            await ensureDirectoryExists(cachedChapterListDir.cachedFolderPath);
            const fileInfo = await FileSystem.getInfoAsync(cachedChapterListDir.cachedFilePath);
            
            if (fileInfo.exists) {
                const cachedChapterListData = await FileSystem.readAsStringAsync(cachedChapterListDir.cachedFilePath);
                chapterListData = JSON.parse(cachedChapterListData);
            } else {
                const requestedChapterListData = await getChapterList(mangaUrl);
                chapterListData = requestedChapterListData;
                await FileSystem.writeAsStringAsync(cachedChapterListDir.cachedFilePath, JSON.stringify(chapterListData));
            }
            
            resolve({ data: chapterListData, error: null });
        } catch (error) {
            reject({ data: [], error });
        }
    });
    return myPromise
};

// const fetchData = async () => {
//     try {
      
//       const parentKey = shorthash.unique(mangaLink)
//       const cachedChapterListPath = `${FileSystem.cacheDirectory}${parentKey}`
//       const cachedChapterListFile = "chapterList.json"
//       let chapterListData;

//       console.log(parentKey)

//       try {
//         const dirInfo = await FileSystem.getInfoAsync(cachedChapterListPath);
//         if (!dirInfo.exists) {
//         await FileSystem.makeDirectoryAsync(cachedChapterListPath, { intermediates: true });
//         }
//       } catch (error) {
//           console.error(`Error creating directory ${cachedChapterListPath}:`, error);
//           throw error;
//       }

//       const fileInfo = await FileSystem.getInfoAsync(cachedChapterListPath + cachedChapterListFile);

//       if (fileInfo.exists) {
//         const cachedChapterListData = await FileSystem.readAsStringAsync(cachedChapterListPath + cachedChapterListFile);
//         chapterListData = JSON.parse(cachedChapterListData);
//         } else {
//         const requestedPageData = await getChapterList(mangaLink);
//         chapterListData = requestedPageData;
//         await FileSystem.writeAsStringAsync(cachedChapterListPath + cachedChapterListFile, JSON.stringify(chapterListData));
//       }

//       console.log(chapterListData[chapterListData.length - 1])
//       setChaptersData(chapterListData);

//     } catch (error) {
//       setChaptersData([]);
//       Alert.alert("Error", error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

  

  

  