import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import { getChapterPageImage } from '../../services/MangakakalotClient';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import { Image } from 'react-native';

export const savePageLayout = async (mangaUrl, chapterUrl, pageLayout) => {
    try {
        const cachedChapterPageLayoutDir =  getMangaDirectory(mangaUrl, chapterUrl, "chapterPageLayout", "pageLayout.json")
        await ensureDirectoryExists(cachedChapterPageLayoutDir.cachedFolderPath)

        await FileSystem.writeAsStringAsync(cachedChapterPageLayoutDir.cachedFilePath, JSON.stringify(pageLayout));
    } catch (error) {
        console.error(error)
    }
}