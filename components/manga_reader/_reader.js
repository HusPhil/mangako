import * as FileSystem from 'expo-file-system';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import { PixelRatio } from 'react-native';
import shorthash from 'shorthash';
import { getChapterPageImage } from '../../services/MangakakalotClient';
import { Image } from 'react-native';

export const SWIPE_DIRECTION = {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    DOWN: "DOWN",
    UP: "UP",
}

export const savePageLayout = async (mangaUrl, chapterUrl, pageLayout) => {
    try {
        const cachedChapterPageLayoutDir =  getMangaDirectory(mangaUrl, chapterUrl, "chapterPageLayout", "pageLayout.json")
        await ensureDirectoryExists(cachedChapterPageLayoutDir.cachedFolderPath)

        await FileSystem.writeAsStringAsync(cachedChapterPageLayoutDir.cachedFilePath, JSON.stringify(pageLayout));
    } catch (error) {
        console.error(error)
    }
}

export const readPageLayout = async (mangaUrl, chapterUrl) => {
    try {
        
        const cachedChapterPageLayoutDir =  getMangaDirectory(mangaUrl, chapterUrl, "chapterPageLayout", "pageLayout.json")
        const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageLayoutDir.cachedFilePath);
        if (!fileInfo.exists) return {data: [], error: new Error("No page layout found")}

        const pageLayout = await FileSystem.readAsStringAsync(cachedChapterPageLayoutDir.cachedFilePath);
        return {data: JSON.parse(pageLayout), error: null}

    } catch (error) {
        console.error(error)
    }
}

export const scrollToPageNum = (pageNum, pageLayout) => {
    let offSet = 0
    pageLayout.slice(0, pageNum).forEach(height => {
        offSet += height
    })
    return offSet / PixelRatio.get()
}

export const fetchPageData = async (mangaUrl, chapterUrl, pageUrl, abortSignal) => {
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

export const fetchPageDataAsPromise = (mangaUrl, chapterUrl, pageUrl, abortSignal) => {
    const pageFileName = shorthash.unique(pageUrl);
    const cachedChapterPageImagesDir = getMangaDirectory(mangaUrl, chapterUrl, "chapterPageImages", pageFileName);

    return new Promise((resolve, reject) => {
        ensureDirectoryExists(cachedChapterPageImagesDir.cachedFolderPath)
            .then(() => FileSystem.getInfoAsync(cachedChapterPageImagesDir.cachedFilePath))
            .then(fileInfo => {
                if (fileInfo.exists) {
                    resolve({ data: cachedChapterPageImagesDir.cachedFilePath, error: null });
                } else {
                    getChapterPageImage(pageUrl, abortSignal)
                        .then(requestedPageData => {
                            if (requestedPageData) {
                                const pageImg = requestedPageData;
                                FileSystem.writeAsStringAsync(cachedChapterPageImagesDir.cachedFilePath, JSON.stringify(pageImg), { encoding: FileSystem.EncodingType.Base64 })
                                    .then(() => resolve({ data: cachedChapterPageImagesDir.cachedFilePath, error: null }))
                                    .catch(error => {
                                        console.log("Failed to save:", error);
                                        resolve({ data: [], error: new Error("failed to save") });
                                    });
                            } else {
                                resolve({ data: [], error: new Error("failed to retrieve page data") });
                            }
                        })
                        .catch(error => {
                            console.log("Failed to get chapter page image:", error);
                            resolve({ data: [], error });
                        });
                }
            })
            .catch(error => {
                console.log("Fetch data error:", error);
                resolve({ data: [], error });
            });
    });
};


export const getSwipeDirection = (
    distanceX, distanceY, 
    velocityX, velocityY,
    pageWidth, pageHeight,
) => {
    
    const Threshold = pageHeight
    let swipeDirection;
    
    if(Math.abs(distanceX) > Math.abs(distanceY)) {
        swipeDirection = 0
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

const useLoadPageImages = (currentManga) => {
    const [pageImages, setPageImages] = useState([]);
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const loadPageImages = async (pageNum, pageUrl, signal) => {
        try {
            const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
            if (fetchedImgSrc.error) {
                setPageImages(prev => {
                    const newPageImages = [...prev];
                    newPageImages[pageNum] = { imgUri: undefined, imgSize: null, error: fetchedImgSrc.error };
                    return newPageImages;
                });
                throw fetchedImgSrc.error;
            }

            const imgSize = await getImageDimensions(fetchedImgSrc.data);
            if (isMounted.current) {
                setPageImages(prev => {
                    const newPageImages = [...prev];
                    newPageImages[pageNum] = { imgUri: fetchedImgSrc.data, imgSize };
                    return newPageImages;
                });
            }
        } catch (error) {
            console.log("Error loading pages:", error);
        }
    };

    return { pageImages, loadPageImages };
};


export default useLoadPageImages



