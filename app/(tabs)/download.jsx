import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, ToastAndroid, TouchableOpacity, View} from 'react-native';
import DragList, {DragListRenderItemInfo} from 'react-native-draglist';
import NumericRange from '../../components/NumericRange';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import colors from '../../constants/colors';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from '@shopify/flash-list';

import * as FileSystem from 'expo-file-system';

import { chapterNavigator, fetchData as fetchChapterPages } from '../../app/screens/_manga_reader';
import shorthash from 'shorthash'
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import DownloadListItem from '../../components/manga_download/DownloadListItem';
import { downloadPageData } from '../../components/manga_reader/_reader';
import HorizontalRule from '../../components/HorizontalRule';



const download = () => {
  const params = useLocalSearchParams()
  const isListed = params.isListed
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [completedDownloads, setCompletedDownloads] = useState([]);
  const controllerRef = useRef(null);
  const downloadItemsRef = useRef(new Map());
  const downloadItemsLengthRef = useRef(new Map());
  const downloadItemsPagesRef = useRef(new Map());
  const downloadResumablesRef = useRef(new Map());
  const downloadCancelPressedRef = useRef(false);

  const handleDownloadResumableCallback = (chapterUrl, pageNum, imgUrl, progress) => {
    // console.log("pageUrl", pageUrl, "mangaUrl", mangaUrl, "chapterUrl", chapterUrl)
    // console.log("DOWNLOAD REFS", downloadItemsRef.current[0])
    // console.log("CHAPTERURL:", chapterUrl, downloadItemsRef.current.get(chapterUrl))

    
    if(progress.totalBytesWritten/progress.totalBytesExpectedToWrite === 1) {
      const downloadItem = downloadItemsRef.current.get(chapterUrl)
      const downloadItemsLength = downloadItemsLengthRef.current.get(chapterUrl)

      downloadItem.updateDownloadedPages(downloadItemsLength)
      // console.log("chapterDownloadProgress", chapterDownloadProgress)

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
      console.log(pageMangaDir.cachedFilePath)
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

        // Store the download resumables for potential cancellation
        downloadResumablesRef.current.set(chapterUrl, chapterDownloadResumables);

        // Check again if download was cancelled before starting downloads
        if (!downloadQueue.some(item => item.chapterUrl === chapterUrl)) {
            return;
        }

        const chapterDownloadResumablesResults = await Promise.all(
            chapterDownloadResumables.map(async (downloadResumable) => {
                if (downloadResumable.fileExist) {
                    return { success: true };
                }
                try {
                    const result = await downloadResumable.downloadResumable.downloadAsync();
                    return { success: result != null};
                } catch (error) {
                    // Check if this was a cancellation
                    if (!downloadQueue.some(item => item.chapterUrl === chapterUrl)) {
                        throw new Error('Download cancelled');
                    }
                    return { success: false, error };
                }
            })
        )

        chapterDownloadResumablesResults.forEach((resultItem, index) => {
            console.log("SUCCESS:", resultItem.success)
            if (resultItem.result != null) {
              console.log("SUCCESSFULL DOWNLOAD")
            }
            else {
              console.log("RESULT:", resultItem.result)
            }
        });


        // Clean up download resumables as they're no longer needed
        downloadResumablesRef.current.delete(chapterUrl);

        const chapterSuccessfullyDownloaded = chapterDownloadResumablesResults.every(resultItem => resultItem.success);

        console.log("chapterSuccessfullyDownloaded", chapterSuccessfullyDownloaded)

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
          downloadCancelPressedRef.current = true
    
    const downloadToCancel = downloadResumablesRef.current.get(chapterUrl);
    
    try {
        // If there are downloads to cancel, pause them
        if (downloadToCancel) {
            await Promise.all(downloadToCancel.map(async (resumable) => {
                if (resumable && resumable.downloadResumable) {
                    await resumable.downloadResumable.pauseAsync();
                }
            }));
        }
        else {
        }
        
        // Always update the queue, whether there were downloads to cancel or not
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
