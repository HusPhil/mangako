import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { loadMangaData, updateMangaData } from "./mangaCacheUtils";
import { MangaCache, MangaLastRead, MangaLastReadProgress } from "./types";



const useReadingProgress = (mangaId: string) => {

    const [readingProgress, setReadingProgress] = useState<MangaLastReadProgress>();
    const [isReadingProgressLoading, setIsReadingProgressLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const loadReadingProgress = async () => {
                setIsReadingProgressLoading(true);
                const mangaData = await loadMangaData(mangaId);
                if(mangaData?.readingProgress) {
                    setReadingProgress(mangaData.readingProgress);
                }
                setIsReadingProgressLoading(false);
            }
            loadReadingProgress()
        }, [])
    );

    // export interface ReadingProgress {
    //     lastRead: MangaLastRead;
    //     progress: {
    //       [chapterId: string]: {
    //         lastPage: number;
    //         lastPageUrl: string;
    //       };
    //     };
    //   };
    //export interface MangaLastRead {
//   chapterId: string;
//   chapterUrl: string;
//   page: number;
// }

    const addEntryToReadingProgress = async (lastRead: MangaLastRead, lastPageUrl: string) => {
        const mangaData = await loadMangaData(mangaId);
        const updatedReadingProgress: MangaLastReadProgress = {
            lastRead: lastRead,
            progress: {
                ...mangaData?.readingProgress?.progress,
                [lastRead.chapterId]: {lastPage: lastRead.page, lastPageUrl: lastPageUrl}
            }
        }
        const updatedMangaData: MangaCache = {
            ...mangaData,
            readingProgress: updatedReadingProgress
        }
        await updateMangaData(mangaId, updatedMangaData);
    }
    
    return {
        readingProgress,
        isReadingProgressLoading,
        addEntryToReadingProgress,
    }
}

export default useReadingProgress;
