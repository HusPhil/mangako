import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, ToastAndroid, TouchableOpacity, View} from 'react-native';
import DragList, {DragListRenderItemInfo} from 'react-native-draglist';
import NumericRange from '../../components/NumericRange';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import colors from '../../constants/colors';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';
import { useIsFocused } from '@react-navigation/native';

import * as FileSystem from 'expo-file-system';

import { chapterNavigator, fetchData as fetchChapterPages } from '../../app/screens/_manga_reader';
import shorthash from 'shorthash'
import { CONFIG_READ_WRITE_MODE, DOWNLOAD_STAT, DOWNLOAD_STATUS, ensureDirectoryExists, getMangaDirectory, readMangaConfigData, saveMangaConfigData } from '../../services/Global';
import DownloadListItem from '../../components/manga_download/DownloadListItem';
import { downloadPageData } from '../../components/manga_reader/_reader';
import HorizontalRule from '../../components/HorizontalRule';

import pLimit from 'p-limit';
import { debounce } from 'lodash';

const download = () => {
  const params = useLocalSearchParams()
  const isListed = params.isListed === "true"
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [completedDownloads, setCompletedDownloads] = useState([]);
  const controllerRef = useRef(null);
  const downloadItemsRef = useRef(new Map());
  const downloadItemsLengthRef = useRef(new Map());
  const downloadItemsPagesRef = useRef(new Map());
  const downloadResumablesRef = useRef(new Map());
  const downloadCancelPressedRef = useRef(false);
  const isFocused = useIsFocused();
  const downloadLimitRef = useRef(pLimit(3)); // Create a persistent pLimit instance

  // Debounced update function to reduce UI updates
  const debouncedProgressUpdate = useCallback(
    debounce((chapterUrl, pageNum, totalPages) => {
      const downloadItem = downloadItemsRef.current.get(chapterUrl);
      if (downloadItem) {
        downloadItem.updateDownloadedPages(pageNum, totalPages);
      }
    }, 100),
    []
  );

  const handleDownloadResumableCallback = async (chapterUrl, pageNum, pageUrl, progress) => {
    if(progress.totalBytesWritten/progress.totalBytesExpectedToWrite === 1 && isFocused) {
      const downloadItemsLength = downloadItemsLengthRef.current.get(chapterUrl) 
      const mangaUrl = params.mangaUrl
      // Use debounced update for progress
      debouncedProgressUpdate(chapterUrl, pageNum, downloadItemsLength);

      const pageFileName = shorthash.unique(pageUrl)
      const pageMangaDir = getMangaDirectory(
        mangaUrl, chapterUrl, 
        "chapterPageImages", pageFileName,
        `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`
        )
      
      const certificateJsonFileName = "-certificate.json"
      const certificateFileUri = pageMangaDir.cachedFilePath + certificateJsonFileName
      
      await ensureDirectoryExists(pageMangaDir.cachedFolderPath)

      await FileSystem.writeAsStringAsync(
        certificateFileUri,
        JSON.stringify(progress),
        {encoding: FileSystem.EncodingType.UTF8}
      );
    }
  }

  const handleDownloadVerification = async(pageUrl, mangaUrl, chapterUrl) => {
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(
      mangaUrl, chapterUrl, 
      "chapterPageImages", pageFileName,
      `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`
      )
    const certificateJsonFileName = "-certificate.json"
    const certificateFileUri = pageMangaDir.cachedFilePath + certificateJsonFileName

    await ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
    const pageFileInfo = await FileSystem.getInfoAsync(pageMangaDir.cachedFilePath)
    const certificateFileInfo = await FileSystem.getInfoAsync(certificateFileUri)
    
    if(!pageFileInfo.exists || !certificateFileInfo.exists) return false;

    const certificate = JSON.parse(await FileSystem.readAsStringAsync(certificateFileUri))

    if(certificate.totalBytesExpectedToWrite === pageFileInfo.size) {
      return true;
    }

    return false;
  }

  const createPageDownloadResumable = async (pageNum, pageUrl, mangaUrl, chapterUrl) => {
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(
      mangaUrl, chapterUrl, 
      "chapterPageImages", pageFileName,
      `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`
      )
    const savedataJsonFileName = "-saveData.json"
    const savableDataUri = pageMangaDir.cachedFilePath + savedataJsonFileName;

    await ensureDirectoryExists(pageMangaDir.cachedFolderPath)
        
    const downloadCompleted = await handleDownloadVerification(pageUrl, mangaUrl, chapterUrl);

    if(downloadCompleted) {
      const downloadItem = downloadItemsRef.current.get(chapterUrl)
      const downloadItemsLength = downloadItemsLengthRef.current.get(chapterUrl) 
      downloadItem.updateDownloadedPages(pageNum, downloadItemsLength) 
      return {
        uri: pageMangaDir.cachedFilePath, pageNum, 
        folderUri: pageMangaDir.cachedFolderPath,
        fileName: pageFileName,
        fileExist: true, savableDataUri
      }
    }

    const pageDownloadResumable = await downloadPageData (
      mangaUrl, 
      chapterUrl, 
      pageUrl,
      savableDataUri,
      isListed,
      handleDownloadResumableCallback,
      { pageNum, chapterUrl }
    )

    return {downloadResumable: pageDownloadResumable, pageNum, uri: pageMangaDir.cachedFilePath, savableDataUri}

  }

  const processDownload = async () => {
    const firstDownloadItem = downloadQueue[0]
    if (!firstDownloadItem) return;

    const mangaUrl = params.mangaUrl
    const chapterUrl = firstDownloadItem.chapterUrl

    try {
        const chapterPagesToDownloadResponse = await fetchChapterPages(
            mangaUrl, chapterUrl, 
            controllerRef.current.signal, params.isListed
        )
        
        if (chapterPagesToDownloadResponse.error != null) {
            ToastAndroid.show("Failed to fetch download pages", ToastAndroid.SHORT);
            return;
        }

        const chapterPagesToDownload = chapterPagesToDownloadResponse.data;
        downloadItemsLengthRef.current.set(chapterUrl, chapterPagesToDownload.length);

        if (!downloadQueue.some(item => item.chapterUrl === chapterUrl)) {
            return;
        }

        // Create all download resumables first
        const chapterDownloadResumables = await Promise.all(
            chapterPagesToDownload.map(async (pageUrl, pageNum) => {
                const resumable = await createPageDownloadResumable(pageNum, pageUrl, mangaUrl, chapterUrl);
                return { ...resumable, chapterUrl }; 
            })
        );

        downloadResumablesRef.current.set(chapterUrl, chapterDownloadResumables);

        if (!downloadQueue.some(item => item.chapterUrl === chapterUrl)) {
            return;
        }

        // Process downloads using pLimit for better concurrency control
        const results = await Promise.all(
            chapterDownloadResumables.map(downloadResumable =>
              downloadLimitRef.current(async () => {
                if (downloadResumable.fileExist) {
                  return { success: true };
                }
                try {
                  const result = await downloadResumable.downloadResumable.downloadAsync();
                  return { success: result != null };
                } catch (error) {
                  if (!downloadQueue.some(item => item.chapterUrl === chapterUrl)) {
                    throw new Error('Download cancelled');
                  }
                  return { success: false, error };
                }
              })
            )
        );

        downloadResumablesRef.current.delete(chapterUrl);

        const chapterSuccessfullyDownloaded = results.every(resultItem => resultItem.success);

        if (chapterSuccessfullyDownloaded) {
            ToastAndroid.show(
                `Successfully downloaded ${firstDownloadItem.chTitle}`,
                ToastAndroid.SHORT
            );

            setDownloadQueue(prev => {
                const newDownloadQueue = [...prev];
                const completedDownload = newDownloadQueue.shift();
                setCompletedDownloads(prev => [...prev, completedDownload]);
                return newDownloadQueue;
            });

            const mangaRetrievedConfigData = await readMangaConfigData(
                mangaUrl, 
                CONFIG_READ_WRITE_MODE.MANGA_ONLY, 
                isListed
            );

            const downloadedChaptersToSave = mangaRetrievedConfigData?.manga?.downloadedChapters
                ? {...mangaRetrievedConfigData.manga.downloadedChapters, [chapterUrl]: {"downloadStatus" : DOWNLOAD_STATUS.DOWNLOADED}}
                : {[chapterUrl]: {"downloadStatus" : DOWNLOAD_STATUS.DOWNLOADED}};

            await saveMangaConfigData(
                mangaUrl, 
                CONFIG_READ_WRITE_MODE.MANGA_ONLY, 
                {"downloadedChapters": downloadedChaptersToSave},
                isListed,
                CONFIG_READ_WRITE_MODE.MANGA_ONLY
            );
        } else {
            ToastAndroid.show(
                `Failed to download some pages from ${firstDownloadItem.chTitle}`,
                ToastAndroid.SHORT
            );
            setDownloadQueue(prev => prev.filter(item => item.chapterUrl !== chapterUrl));
        }
    } catch (error) {
        if (error.message === 'Download cancelled') return;
        
        console.error('Download error:', error);
        ToastAndroid.show(
            `Error downloading ${firstDownloadItem.chTitle}`,
            ToastAndroid.SHORT
        );
        setDownloadQueue(prev => prev.filter(item => item.chapterUrl !== chapterUrl));
    }
};

  const handleCancelDownload = useCallback(async (chapterUrl) => {
    downloadCancelPressedRef.current = true
    
    const downloadToCancel = downloadResumablesRef.current.get(chapterUrl);
    
    try {
        if (downloadToCancel) {
            await Promise.all(downloadToCancel.map(async (resumable) => {
                if (resumable && resumable.downloadResumable) {
                    await resumable.downloadResumable.pauseAsync();
                }
            }));
        }
        
        setDownloadQueue(prev => prev.filter(item => item.chapterUrl !== chapterUrl));
        
        ToastAndroid.show(
            "Download cancelled",
            ToastAndroid.SHORT
        );
    } catch (error) {
        console.error("Error cancelling downloads:", error);
        ToastAndroid.show(
            "Error while cancelling",
            ToastAndroid.SHORT
        );
    }
}, []);

  const AsyncEffect = useCallback(async () => { 
    if(Object.keys(params).length === 0) {
      ToastAndroid.show(
        "Nothing in queue",
        ToastAndroid.SHORT
      )
      return
    }

    controllerRef.current = new AbortController;
    const signal = controllerRef.current.signal;

    const chaptersToDownloadAsJsonString =  await AsyncStorage.getItem(params.selectedChaptersCacheKey)
    const chaptersToDownload = JSON.parse(chaptersToDownloadAsJsonString)

    setDownloadQueue(chaptersToDownload)

    await AsyncStorage.removeItem(params.selectedChaptersCacheKey)

  }, [])

  useEffect(() => {
    AsyncEffect()

    return () => {
      if(controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    console.log("DOWNLOAD QUEUE CHANGED")

    if (downloadQueue.length > 0 && !downloadCancelPressedRef.current) {
      console.log("Process the download queue")
      processDownload();
    }

    if(downloadCancelPressedRef.current === true) {
      downloadCancelPressedRef.current = false
    }

  }, [downloadQueue]);

  
  const renderItem = useCallback(({ item, index }) => {
    if(item) {
      return (
        <DownloadListItem 
          ref={(downloadItem) => { downloadItemsRef.current.set(item.chapterUrl, downloadItem); }} 
          key={item.chapterUrl}
          chapterTitle={item.chTitle} 
          isIndeterminate={true}
          onCancelPress={() => handleCancelDownload(item.chapterUrl)}
        />
      )
    }
  }, [handleCancelDownload])

  const renderDownloadedItem = useCallback(({ item, index }) => {
    if(item) {
      return (
        <DownloadListItem 
          key={item.chapterUrl}
          chapterTitle={item.chTitle} isIndeterminate={false} 
          isCompleted = {true}
        />
      )
    }
  }, [])

  const EmptyQueueMessage = () => (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-white text-center">No chapters in download queue</Text>
    </View>
  );

  const EmptyCompletedMessage = () => (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-white text-center">No completed downloads yet</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary justify-center items-center">
      <HorizontalRule displayText={"Download Queue"} otherStyles={'m-4'}/>
      <View className="flex-1 bg-primary  w-full h-full">
        <FlashList 
          data={downloadQueue}
          renderItem={renderItem}
          estimatedItemSize={500}
          ListEmptyComponent={EmptyQueueMessage}
        />
      </View>
      
      <HorizontalRule displayText={"Completed Downloads"} otherStyles={'m-4'}/>
      <View className="flex-1 bg-primary  w-full h-full">
        <FlashList 
          data={completedDownloads}
          renderItem={renderDownloadedItem}
          estimatedItemSize={500}
          ListEmptyComponent={EmptyCompletedMessage}
        />
      </View>
      {/* <MaterialIcons name="construction" size={125} color={colors.accent.DEFAULT} />
      <Text className="text-white font-pregular text-2xl">Under construction</Text> */}
    
    </SafeAreaView>
  );
}

export default download
