import { View, Text, Button, Dimensions } from 'react-native'
import React, {useCallback, useRef, useState} from 'react'
import { downloadPageData } from '../../components/manga_reader/_reader'
import { getMangaDirectory, ensureDirectoryExists } from '../../services/Global'
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen')

const more = () => {
  const [downloadedPageUri, setDownloadedPageUri] = useState(null)
  const pendingDownloads = useRef([])

  const chapterPages = [
    "https://cataas.com/cat?width=200&height=302",
    "https://cataas.com/cat?width=250&height=350",
    "https://cataas.com/cat?width=300&height=400",
    "https://cataas.com/cat?width=350&height=450",
    "https://cataas.com/cat?width=400&height=500",
    "https://cataas.com/cat?width=450&height=550",
    "https://cataas.com/cat?width=500&height=600",
    "https://cataas.com/cat?width=550&height=650",
    "https://cataas.com/cat?width=600&height=700",
    "https://cataas.com/cat?width=650&height=750"
  ];

  const handleCallBackTest = (pageNum, pageUrl, progress) => {
    console.log(`${pageUrl}: ${progress.totalBytesWritten}/${progress.totalBytesExpectedToWrite}`)
  }
  
  const createPageDownloadResumable = useCallback(async (pageNum) => {
    if(pageNum < 0 && pageNum >= chapterPages.length) return null
    
    const pageUrl = chapterPages[pageNum]

    const currentManga = {
      manga: "https://cataas.com/cat-folder",
      chapter: "https://cataas.com/cat-chapter"
    }

    const savedataJsonFileName = "-saveData.json"
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
    const savableDataUri = pageMangaDir.cachedFilePath + savedataJsonFileName;
    
    ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
    const pageFileInfo = await FileSystem.getInfoAsync(pageMangaDir.cachedFilePath)
    
    const saveDataFileInfo = await FileSystem.getInfoAsync(savableDataUri)

    const pageDownloadResumable = await downloadPageData(
      currentManga.manga, 
      currentManga.chapter, 
      pageUrl,
      savableDataUri,
      handleCallBackTest,
      { pageNum }
    )

    return {downloadResumable: pageDownloadResumable, pageNum, uri: pageMangaDir.cachedFilePath, savableDataUri}

  }, [])

  return (
    <View className="h-full justify-center items-center">
      <Button title='download' onPress={async () => {
        setDownloadedPageUri(null)
        const pageDownloadResumable = await createPageDownloadResumable(5);
        console.log(pageDownloadResumable)
        pendingDownloads.current.push({
          downloadResumable: pageDownloadResumable.downloadResumable, 
        })
        await pageDownloadResumable.downloadResumable.downloadAsync()
        
      }}/>
      <Button title='getResult' onPress={async () => {
        const pageDownloadResumable = pendingDownloads.current[0]
        const pageDownloadResult = pageDownloadResumable.downloadResumable.fileUri
        console.log("pageDownloadResult:",  pageDownloadResult)
        setDownloadedPageUri(pageDownloadResult)
      }}/>
      {downloadedPageUri && (
        <Image 
          source={{uri: downloadedPageUri}}
          style={{height: undefined, width: screenWidth, aspectRatio: 1}}
        />
      )}
    </View>
  )
}

export default more