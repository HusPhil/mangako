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

const MAX_CONCURRENT_DOWNLOADS = 3; // Limit concurrent downloads to prevent memory issues

const download = () => {
  const params = useLocalSearchParams()
  const isListed = params.isListed === "true"
  const [downloadQueue, setDownloadQueue] = useState([]);
  const downloadQueueRef = useRef();
  const [completedDownloads, setCompletedDownloads] = useState([]);
  const controllerRef = useRef(null);
  const downloadItemsRef = useRef(new Map());
  const downloadItemsLengthRef = useRef(new Map());
  const downloadItemsPagesRef = useRef(new Map());
  const downloadResumablesRef = useRef(new Map());
  const updateProgressTimeoutRef = useRef(null);
  const downloadCancelPressedRef = useRef(false);
  const isFocused = useIsFocused();

  const handleDownloadResumableCallback = async (chapterUrl, pageNum, pageUrl, progress) => {
    // console.log("pageUrl", pageUrl, "mangaUrl", mangaUrl, "chapterUrl", chapterUrl)
    // console.log("DOWNLOAD REFS", downloadItemsRef.current[0])
    // console.log("CHAPTERURL:", chapterUrl, downloadItemsRef.current.get(chapterUrl))

    
    if(progress.totalBytesWritten/progress.totalBytesExpectedToWrite === 1 && isFocused) {
      const downloadItem = downloadItemsRef.current.get(chapterUrl)
      const downloadItemsLength = downloadItemsLengthRef.current.get(chapterUrl) 
      const mangaUrl = params.mangaUrl
      downloadItem.updateDownloadedPages(pageNum, downloadItemsLength) 

      // console.log("chapterDownloadProgress", chapterDownloadProgress)
      const pageFileName = shorthash.unique(pageUrl)
      const pageMangaDir = getMangaDirectory(
        mangaUrl, chapterUrl, 
        "chapterPageImages", pageFileName,
        `${isListed ? FileSystem.documentDirectory : FileSystem.cacheDirectory}`
        )
      
      //create completion certificate which can be used for download verification
      const certificateJsonFileName = "-certificate.json"
      const certificateFileUri = pageMangaDir.cachedFilePath + certificateJsonFileName
      
      await ensureDirectoryExists(pageMangaDir.cachedFolderPath)

      //save the certification as a json file
      await FileSystem.writeAsStringAsync(
        certificateFileUri,
        JSON.stringify(progress),
        {encoding: FileSystem.EncodingType.UTF8}
      );

    }
    // console.log("PROGRESS", progress.totalBytesWritten, progress.totalBytesExpectedToWrite)
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
        
    //use the download verification method to know if this page has been SUCCESSFULLY downloaded
    const downloadCompleted = await handleDownloadVerification(pageUrl, mangaUrl, chapterUrl);

    if(downloadCompleted) {
      return {
        uri: pageMangaDir.cachedFilePath, pageNum, 
        folderUri: pageMangaDir.cachedFolderPath,
        fileName: pageFileName,
        fileExist: true, savableDataUri
      }
    }

    //if not create a download resumable from a util func named downloadPageData which handles 
    //all the complexity of creating a download resumable with an existing save data
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
    // get the first downloadItem from the download queue
    const firstDownloadItem = downloadQueue[0]
    if (!firstDownloadItem) return; // Exit if no download item

    const mangaUrl = params.mangaUrl
    const chapterUrl = firstDownloadItem.chapterUrl

    try {
        const chapterPagesToDownloadResponse = await fetchChapterPages(
            mangaUrl, chapterUrl, 
            controllerRef.current.signal, params.isListed
        )
        
        if (chapterPagesToDownloadResponse.error != null) {
            ToastAndroid.show(
                "Failed to fetch download pages",
                ToastAndroid.SHORT
            )
            return;
        }

        const chapterPagesToDownload = chapterPagesToDownloadResponse.data
        downloadItemsLengthRef.current.set(chapterUrl, chapterPagesToDownload.length)

        // Check if download was cancelled before creating resumables
        if (!downloadQueue.some(item => item.chapterUrl === chapterUrl)) {
            return;
        }

        const chapterDownloadResumables = await Promise.all(
            chapterPagesToDownload.map(async (pageUrl, pageNum) => (
                await createPageDownloadResumable(pageNum, pageUrl, mangaUrl, chapterUrl)
            ))
        )

        downloadResumablesRef.current.set(chapterUrl, chapterDownloadResumables);
        // Store the download resumables for potential cancellation

        // Check again if download was cancelled before starting downloads
        if (!downloadQueue.some(item => item.chapterUrl === chapterUrl)) {
            return;
        }

        // Initialize results array and queue
        const results = [];
        const queue = chapterDownloadResumables.slice();
        
        const downloadItem = async (downloadResumable) => {
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
        };

        // Process downloads in batches
        const processQueue = async () => {
            const workers = Array(MAX_CONCURRENT_DOWNLOADS).fill(null).map(async () => {
                while (queue.length > 0) {
                    const downloadResumable = queue.shift();
                    if (downloadResumable) {
                        const result = await downloadItem(downloadResumable);
                        results.push(result);
                        
                        // Small delay between downloads to keep UI responsive
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                }
            });

            await Promise.all(workers);
        };

        await processQueue();
        const chapterDownloadResumablesResults = results;

        // Clean up download resumables
        downloadResumablesRef.current.delete(chapterUrl);

        const chapterSuccessfullyDownloaded = chapterDownloadResumablesResults.every(resultItem => resultItem.success);

        // console.log("chapterSuccessfullyDownloaded", chapterSuccessfullyDownloaded)

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
            )

            let downloadedChaptersToSave = {}

            if(mangaRetrievedConfigData?.manga?.downloadedChapters) {
          
              // console.log("mangaRetrievedConfigData?.manga?.downloadedChapters", mangaRetrievedConfigData?.manga?.downloadedChapters)
              downloadedChaptersToSave = {...mangaRetrievedConfigData?.manga?.downloadedChapters, [chapterUrl]: {"downloadStatus" : DOWNLOAD_STATUS.DOWNLOADED}}
            }
            else {
              downloadedChaptersToSave = {[chapterUrl]: {"downloadStatus" : DOWNLOAD_STATUS.DOWNLOADED}}
              console.log("no downloaded chapters found")
            }
            // console.log("downloadedChaptersToSave", downloadedChaptersToSave)

            await saveMangaConfigData(
              mangaUrl, 
              CONFIG_READ_WRITE_MODE.MANGA_ONLY, 
              {"downloadedChapters": downloadedChaptersToSave},
              isListed,
              CONFIG_READ_WRITE_MODE.MANGA_ONLY
            )

        } else {
            ToastAndroid.show(
                `Failed to download some pages from ${firstDownloadItem.chTitle}`,
                ToastAndroid.SHORT
            );
            // Remove failed download from queue
            setDownloadQueue(prev => prev.filter(item => item.chapterUrl !== chapterUrl));
        }
    } catch (error) {
        if (error.message === 'Download cancelled') {
            // Download was cancelled, just return
            return;
        }
        console.error('Download error:', error);
        ToastAndroid.show(
            `Error downloading ${firstDownloadItem.chTitle}`,
            ToastAndroid.SHORT
        );
        // Remove failed download from queue
        setDownloadQueue(prev => prev.filter(item => item.chapterUrl !== chapterUrl));
    }
}

  const handleCancelDownload = useCallback(async (chapterUrl) => {
    // Cancel all download resumables for this chapter
    downloadCancelPressedRef.current = true;
    
    const downloadToCancel = downloadResumablesRef.current.get(chapterUrl);
    
    try {
        // If there are downloads to cancel, pause them and cleanup
        if (downloadToCancel) {
            await Promise.all(downloadToCancel.map(async (resumable) => {
                if (resumable && resumable.downloadResumable) {
                    try {
                        await resumable.downloadResumable.pauseAsync();
                        // Delete the partially downloaded file if it exists
                        if (resumable.fileUri) {
                            await FileSystem.deleteAsync(resumable.fileUri, { idempotent: true });
                        }
                    } catch (err) {
                        console.warn("Error cleaning up download:", err);
                    }
                }
            }));

            // Clear the resumables for this chapter
            downloadResumablesRef.current.delete(chapterUrl);
        }
        
        // Update the queue and reset download state
        setDownloadQueue(prev => prev.filter(item => item.chapterUrl !== chapterUrl));
        
        // Update the download progress ref to remove this chapter
        if (downloadProgressRef.current) {
            const newProgress = { ...downloadProgressRef.current };
            delete newProgress[chapterUrl];
            downloadProgressRef.current = newProgress;
        }

        ToastAndroid.show(
            "Download cancelled",
            ToastAndroid.SHORT
        );
    } catch (error) {
        console.error("Error cancelling downloads:", error);
        // ToastAndroid.show(
        //     "Error while cancelling",
        //     ToastAndroid.SHORT
        // );
    } finally {
        // Reset the cancel flag
        downloadCancelPressedRef.current = false;
    }
}, []);

const AsyncEffect = useCallback(async () => {
  
    console.log("downloadQueueREF", downloadQueueRef.current)
    if (!params.selectedChaptersCacheKey) return;

    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    try {
      // First get the current manga config to check downloaded chapters
      const mangaRetrievedConfigData = await readMangaConfigData(
        params.mangaUrl,
        CONFIG_READ_WRITE_MODE.MANGA_ONLY,
        isListed
      );

      const downloadedChapters = mangaRetrievedConfigData?.manga?.downloadedChapters || {};

      const chaptersToDownloadAsJsonString = await AsyncStorage.getItem(params.selectedChaptersCacheKey);
      if (!chaptersToDownloadAsJsonString) return;

      const newChaptersToDownload = JSON.parse(chaptersToDownloadAsJsonString);

      // Check for already downloaded chapters
      const alreadyDownloadedChapters = newChaptersToDownload.filter(chapter => 
        downloadedChapters[chapter.chapterUrl] && 
        downloadedChapters[chapter.chapterUrl].downloadStatus === DOWNLOAD_STATUS.DOWNLOADED
      );

      if (alreadyDownloadedChapters.length > 0) {
        ToastAndroid.show(
          `${alreadyDownloadedChapters.length} chapter(s) already downloaded`,
          ToastAndroid.SHORT
        ); 
      }

      // Safely update the download queue by merging with existing state
      setDownloadQueue(prevQueue => {
        const existingChapterUrls = new Set(prevQueue.map(item => item.chapterUrl));
        console.log("existingChapterUrls", existingChapterUrls)
        
        // Filter out chapters that are already downloaded or in queue
        const uniqueNewChapters = newChaptersToDownload.filter(chapter => 
          !existingChapterUrls.has(chapter.chapterUrl) && 
          (!downloadedChapters[chapter.chapterUrl] || 
           downloadedChapters[chapter.chapterUrl].downloadStatus !== DOWNLOAD_STATUS.DOWNLOADED)
        );

        downloadQueueRef.current = [...prevQueue, ...uniqueNewChapters];
        return [...prevQueue, ...uniqueNewChapters];
      });

      await AsyncStorage.removeItem(params.selectedChaptersCacheKey);
    } catch (error) {
      console.error("Error processing download queue:", error);
    }
  }, [params.selectedChaptersCacheKey, downloadQueueRef.current, params.mangaUrl, isListed]);

  // Handle initial load and cache key changes
  useFocusEffect(
    useCallback(() => {
      AsyncEffect();
      // if (params.selectedChaptersCacheKey) {
      // }
    }, [params.selectedChaptersCacheKey, AsyncEffect, downloadQueueRef.current])
  );

  // Handle download processing
  useEffect(() => {
    if (downloadQueue.length > 0 && !downloadCancelPressedRef.current) {
      const timeoutId = setTimeout(() => {
        processDownload();
      }, 100);
      return () => clearTimeout(timeoutId);
    }

    if(downloadCancelPressedRef.current === true) {
      downloadCancelPressedRef.current = false;
    }
  }, [downloadQueue]); // Remove AsyncEffect from dependencies

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
