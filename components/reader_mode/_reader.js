import * as FileSystem from 'expo-file-system';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import { PixelRatio } from 'react-native';

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

