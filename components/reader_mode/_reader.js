import * as FileSystem from 'expo-file-system';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';

export const savePageLayout = async (mangaUrl, chapterUrl, pageLayout) => {
    console.log("save page layout called")
    try {
        const cachedChapterPageLayoutDir =  getMangaDirectory(mangaUrl, chapterUrl, "chapterPageLayout", "pageLayout.json")
        await ensureDirectoryExists(cachedChapterPageLayoutDir.cachedFolderPath)

        await FileSystem.writeAsStringAsync(cachedChapterPageLayoutDir.cachedFilePath, JSON.stringify(pageLayout));
    } catch (error) {
        console.error(error)
    }
}

export const readPageLayout = async (mangaUrl, chapterUrl) => {
    console.log("read page layout called")
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

