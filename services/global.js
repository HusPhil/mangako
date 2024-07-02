import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';

export const ensureDirectoryExists = async (directory) => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }
    } catch (error) {
        console.error(`Error creating directory ${directory}:`, error);
        throw error;
    }
};

export const getMangaDirectory = (mangaUrl, chapterUrl, type, filename) => {
    const parentKey = shorthash.unique(mangaUrl)
    const cacheKey = shorthash.unique(chapterUrl);

    const cachedFolderPath = chapterUrl === "N/A" ?  
    `${FileSystem.cacheDirectory}${parentKey}/${type}` :
    `${FileSystem.cacheDirectory}${parentKey}/${cacheKey}/${type}`;

    const cachedFilePath = cachedFolderPath + "/" + filename

    return {cachedFolderPath, cachedFilePath}
}