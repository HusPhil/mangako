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
  const controllerRef = useRef(null);
  const downloadItemsRef = useRef([]);

  const handleDownloadResumableCallback = (pageNum, imgUrl, progress) => {
    // console.log("pageUrl", pageUrl, "mangaUrl", mangaUrl, "chapterUrl", chapterUrl)
    console.log("DOWNLOAD REFS", downloadItemsRef.current)
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
      { pageNum }
    )

    return {downloadResumable: pageDownloadResumable, pageNum, uri: pageMangaDir.cachedFilePath, savableDataUri}

  }

  const processDownload = async () => {
    // get the first downloadItem from the download queue
    const firstDownloadItem = downloadQueue[0]
    const mangaUrl = params.mangaUrl
    const chapterUrl = firstDownloadItem.chapterUrl

    const chapterPagesToDownloadResponse = await fetchChapterPages(
      mangaUrl, chapterUrl, 
      controllerRef.current.signal, params.isListed
    )
    
    if (chapterPagesToDownloadResponse.error != null) {
      ToastAndroid.show(
        "Failed to fetch download pages",
        ToastAndroid.SHORT
      )
      return
    }

    const chapterPagesToDownload = chapterPagesToDownloadResponse.data

    const chapterDownloadResumables = await Promise.all(
        chapterPagesToDownload.map(async (pageUrl, pageNum) => (
            await createPageDownloadResumable(pageNum, pageUrl, mangaUrl, chapterUrl)
        ))
    )

    const chapterDownloadResumablesResults = await Promise.all(
        chapterDownloadResumables.map(async (downloadResumable) => {
            if (downloadResumable.fileExist) {
                return { success: true };
            }
            try {
                const result = await downloadResumable.downloadResumable.downloadAsync();
                return { success: true, result };
            } catch (error) {
                return { success: false, error };
            }
        })
    )

    const chapterSuccessfullyDownloaded = chapterDownloadResumablesResults.every(result => result.success);

    if (chapterSuccessfullyDownloaded) {
        ToastAndroid.show(
            `Successfully downloaded ${firstDownloadItem.chTitle}`,
            ToastAndroid.SHORT
        );
        // Remove the downloaded chapter from the queue

        setDownloadQueue(prev => prev.slice(1));
    } else {
        ToastAndroid.show(
            `Failed to download some pages from ${firstDownloadItem.chTitle}`,
            ToastAndroid.SHORT
        );
    }
    
    console.log("chapterDownloadResumablesResults", chapterDownloadResumablesResults, "isListed", isListed)

  } 

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
    if (downloadQueue.length > 0) {
      processDownload();
    }
  }, [downloadQueue]);

  
  const renderItem = useCallback(({ item, index }) => {
    if(item) {
      return (
        <DownloadListItem 
          ref={(downloadItem) => { downloadItemsRef.current[index] = downloadItem; }} 
          chapterTitle={item.chTitle} isDeterminate={true} 
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
          data={downloadQueue}
          renderItem={renderItem}
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
