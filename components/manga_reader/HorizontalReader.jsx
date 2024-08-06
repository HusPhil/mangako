import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Dimensions, PixelRatio, Button } from 'react-native';
import { debounce, isEqual } from 'lodash';
import shorthash from 'shorthash';
import { FlashList } from '@shopify/flash-list';
import { ToastAndroid } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import * as FileSystem from 'expo-file-system';
import { getImageDimensions, downloadPageData } from './_reader';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { ensureDirectoryExists, getMangaDirectory } from '../../services/Global';
import { Image } from 'expo-image';

const allowedStatusCode = Object.freeze({
  200 : "SUCCESS",
  206: "PARTIAL",
})

const HorizontalReader = ({ 
    currentManga, chapterPages, 
    onTap, onPageChange, onScroll, 
    currentPage, inverted,
    horizontal, vertical,
  }) => {
  const [pageImages, setPageImages] = useState(() => 
    chapterPages.map((pageUrl) => ({
      id: pageUrl,
      imgUri: null,  
      imgSize: null, 
      imgError: null,  
    }))
  );
  const [panEnabled, setPanEnabled] = useState(false);
  const [errorData, setErrorData] = useState(null);

  const {height: screenHeight, width: screenWidth} = Dimensions.get('screen')
  
  const pagesRef = useRef([]);
  const isMounted = useRef(true);
  const zoomableViewRef = useRef(null);
  const flashListRef = useRef(null);
  const controllerRef = useRef(new AbortController());
  
  const loadedPageImagesMap = useRef({});
  const pendingPageDownloadMap = useRef([])
  
  const readerCurrentPage = useRef(currentPage)
  const currentZoomLevel = useRef(1);
  const lastTouchTimeStamp = useRef(0);

  useEffect(() => {
    
    if(currentPage) {
      ToastAndroid.show(
        `Previuos page: ${currentPage + 1}`,
        ToastAndroid.SHORT
      )
    }

    return () => {
      isMounted.current = false;
      controllerRef.current.abort();
      cancelPendingDownloads()
    };

  }, []);

  const handleDownloadResumableCallback = useCallback((pageNum, pageurl, progress) => {
    if(pagesRef.current[pageNum]) {
      pagesRef.current[pageNum].toggleDownloadProgress(progress)
    }
  }, [])
  
  const handleImgOnLoadError = useCallback(async (pageNum, error, imgUri) => {
    setPageImages(prev => (
      prev.map((item, index) => {
        if(index !== pageNum) return item;
        return {
          ...item,
          imgUri: null,
          imgError: new Error(`Error on loading the image in expo-image: ${error}`)
        }
      })
    ))
  }, [])

  const createPageDownloadResumable = useCallback(async (pageNum) => {
    if(pageNum < 0 && pageNum >= chapterPages.length) return null
    
    const pageUrl = chapterPages[pageNum]
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
    const savedataJsonFileName = "-saveData.json"
    const savableDataUri = pageMangaDir.cachedFilePath + savedataJsonFileName;
    
    ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
    const pageFileInfo = await FileSystem.getInfoAsync(pageMangaDir.cachedFilePath)
    loadedPageImagesMap.current[pageNum] = {uri: pageMangaDir.cachedFilePath}
    
    const saveDataFileInfo = await FileSystem.getInfoAsync(savableDataUri)

    if(pageFileInfo.exists && !saveDataFileInfo.exists) {
      return {
        uri: pageMangaDir.cachedFilePath, pageNum, 
        fileExist: true, savableDataUri
      }
    }

    const pageDownloadResumable = await downloadPageData(
      currentManga.manga, 
      currentManga.chapter, 
      pageUrl,
      savableDataUri,
      handleDownloadResumableCallback,
      { pageNum }
    )

    return {downloadResumable: pageDownloadResumable, pageNum, uri: pageMangaDir.cachedFilePath, savableDataUri}

  }, [])

  const cancelPendingDownloads = useCallback(async () => {
    await Promise.all(
      pendingPageDownloadMap.current.map(async (pendingPageDownload) => {
        try {
          
          const { downloadResumable, savableDataUri, pageNum, resolved } = pendingPageDownload

          if(resolved) return
          
          await downloadResumable.pauseAsync();
          console.warn("Cancelled:", pageNum)

          const savableData = downloadResumable.savable()
          loadedPageImagesMap.current[pageNum]["loaded"] = false;

          await FileSystem.writeAsStringAsync(
            savableDataUri,
            JSON.stringify(savableData),
            {encoding: FileSystem.EncodingType.UTF8}
          );
    
        } catch (error) {
          console.log('Error cancelling pending download:', error);
        }
      })
    );
    pendingPageDownloadMap.current = []
  }, [])

  const initializePageDownloads = useCallback(async (pageNumbersLoadingRange) => {
    const downloadedPagesFileUris = []
    const downloadResumablesToCreate = [];
    
    const downloadPageFileUriMap = {} 
    

    for (let index = Math.min(...pageNumbersLoadingRange); index <= Math.max(...pageNumbersLoadingRange); index++) {

      const pageDownloadResumable = await createPageDownloadResumable(index)

      downloadPageFileUriMap[pageDownloadResumable.uri] = {
        pageNum: pageDownloadResumable.pageNum,
        savableDataUri: pageDownloadResumable.savableDataUri,
      } 

      if(pageDownloadResumable.fileExist) {
        downloadedPagesFileUris.push(pageDownloadResumable.uri)
        continue
      }
      downloadResumablesToCreate.push(pageDownloadResumable)
    }

    return {
      downloadedPagesFileUris,
      downloadResumablesToCreate,
      downloadPageFileUriMap
    }
  }, [])

  const generatePageNumbers = (pageNum, range, chapterPagesLength) => {
    try {
      const pageNumbers = new Set()
      for (let index = pageNum - range ; index <= pageNum + range; index++) {
        if(index < 0 || index >= chapterPagesLength) continue
        pageNumbers.add(index)
      }
      return pageNumbers
    } catch (error) {
      console.error("Error generating page numbers")
    }
  }

  const retryPageDownload = async (pageNum, imgFileUri, imgSavableDataUri) => {
      const imgSrc = {imgSize: null, imgUri: null}
      const imgFileInfo = await FileSystem.getInfoAsync(imgFileUri)

      if(imgFileInfo.exists && imgFileUri) {
        await FileSystem.deleteAsync(imgFileUri)
      }

      const retryDownloadResumable = await createPageDownloadResumable(pageNum)
      const retryDownloadResult = await retryDownloadResumable.downloadResumable.downloadAsync()

      if(!retryDownloadResult) {
        console.log(`Failed to retry page: ${pageNum}`)
        return {
          ...imgSrc,
          imgError: new Error("Failed to retry")
        }
      }

      pendingPageDownloadMap.current.push({
        downloadResumable: retryDownloadResumable.downloadResumable, 
        savableDataUri: imgSavableDataUri, 
        pageNum,
      })

      if(!allowedStatusCode[retryDownloadResult.status]) {
          console.error(`Failed to retry page: ${pageNum}\nStatus code: ${retryDownloadResult.status}`)
          ToastAndroid.show(
            `Failed to retry page: ${pageNum}\nStatus code: ${retryDownloadResult.status}`,
            ToastAndroid.SHORT
          )
          return {
            ...imgSrc,
            imgError: new Error("Failed to retry")
          }

      }

      const pageNumToPendingDownloadMap = {};
      pendingPageDownloadMap.current.forEach((item, index) => {
        pageNumToPendingDownloadMap[item.pageNum] = { index, item };
      });

      let targetPendingPageDownloadMap = pageNumToPendingDownloadMap[pageNum];

      if(targetPendingPageDownloadMap) {
        pendingPageDownloadMap.current[targetPendingPageDownloadMap.index] = {
          ...pendingPageDownloadMap.current[targetPendingPageDownloadMap.index],
          resolved: true,
        };
      }
      
      const retryImgSize = await getImageDimensions(retryDownloadResult.uri)
      if(retryImgSize.width > 0 && retryImgSize.height > 0) {
        ToastAndroid.show(
          `Success retrying page: ${pageNum}\nStatus code: ${retryDownloadResult.status}`,
          ToastAndroid.SHORT
        )
        return {
          imgSize: retryImgSize, 
          imgUri: retryDownloadResult.uri
        }
      }

      return {
        ...imgSrc,
        imgError: new Error("Failed to retry")
      }
  }

  const loadPageImages = useCallback(async (pageUrl, pageNum, signal) => {
    const LOADING_RANGE = 1
    
    const pageNumbersLoadingRange = generatePageNumbers(pageNum, LOADING_RANGE, chapterPages.length)

    try {
      //cancell all pendjing download (so only new pages are downloaded when changing into new page)
      await cancelPendingDownloads()

      // make sure already loaded images are not loaded again
     
      let loadedPagesCount = 0

      for (const pageNumber of pageNumbersLoadingRange) {
        if(!loadedPageImagesMap.current[pageNumber]?.loaded) continue
        loadedPagesCount++
      }

      if(loadedPagesCount === pageNumbersLoadingRange.size) return

      console.log("Not all are loaded:", loadedPagesCount)

      // determine the already downloaded pages and thos that have to be downloaded 
      // also create a map of uri to other info of page
      const {
        downloadedPagesFileUris,
        downloadResumablesToCreate,
        downloadPageFileUriMap,
      } = await initializePageDownloads(pageNumbersLoadingRange)

      //CREATE THE DOWNLOAD RESUMABLES 
      const pageDownloadResumables = await Promise.all(downloadResumablesToCreate.map((downloadResumableToCreate) => {
        return downloadResumableToCreate.downloadResumable
      }))      
      
     // CALL THE DOWNLOAD OR THE RESUME OPERATION DEPENDING ON THE STATUS OF THE PAGE 
      const downloadResults = await Promise.all(pageDownloadResumables.map( async pageDownloadResumable => {
        const { savableDataUri, pageNum } = downloadPageFileUriMap[pageDownloadResumable.fileUri];

        pendingPageDownloadMap.current.push({
          downloadResumable: pageDownloadResumable, 
          savableDataUri, pageNum,
        })

        const saveDataFileInfo = await FileSystem.getInfoAsync(savableDataUri)

        if(saveDataFileInfo.exists) {
          return pageDownloadResumable.resumeAsync()
        }

        return pageDownloadResumable.downloadAsync()
      }))

      // ADD ALL THE CREATED DOWNLOAD RESUMABLES TO THE PENDING DOWNLOAD LIST SO WE CAN TRACK THEIR SATATUS
      const pageNumToPendingDownloadMap = {};
      pendingPageDownloadMap.current.forEach((item, index) => {
        pageNumToPendingDownloadMap[item.pageNum] = { index, item };
      });

      // CREATE A MAP TO COMPILE ALL THE PAGES AND SHOW THEM ALL AT ONCE
      let pageNumToImgSrcMap = {}
      
      for (let index = 0; index < downloadResults.length; index++) {
        const downloadResult = downloadResults[index];
        if(!downloadResult) continue

        const downloadedFileInfo = await FileSystem.getInfoAsync(downloadResult.uri)
        const downloadContentLength = parseInt(downloadResult.headers['content-length'])

        let downloadedFileSize = 0;
        let imgUri = downloadResult.uri
        if(downloadedFileInfo.exists) downloadedFileSize = downloadedFileInfo.size
        const { pageNum, savableDataUri } = downloadPageFileUriMap[downloadResult.uri]
        
        
        if(
          !allowedStatusCode[downloadResult.status] ||
          downloadContentLength !== downloadedFileSize 
        ) {
          console.warn("An error occurred, trying to retry.")
          let targetPendingPageDownloadMap = pageNumToPendingDownloadMap[pageNum];

          if(!targetPendingPageDownloadMap) continue
          pendingPageDownloadMap.current[targetPendingPageDownloadMap.index] = {
            ...pendingPageDownloadMap.current[targetPendingPageDownloadMap.index],
            resolved: true,
          };

          await FileSystem.deleteAsync(savableDataUri, {idempotent: true})
            

          const retryImgSrc = await retryPageDownload(pageNum, downloadResult.uri)
          if(!retryImgSrc.imgError) {
            imgUri = retryImgSrc.imgUri
            console.warn("Success retrying to fetch the image.")
          } else {
            imgUri = null
      }
        }

        const imgSize = await getImageDimensions(imgUri)

        if(imgSize.width > 0 && imgSize.height > 0) {
          pageNumToImgSrcMap[pageNum] = {
            imgSize,
            imgUri,
          }
        } 
        else {
          console.error("An error occured during setting of NEWLY downloaded images.")
          pageNumToImgSrcMap[pageNum] = {
            imgSize,
            imgUri: null,
            imgError: new Error("failed to load even if already downloaded")
          }
        }

        


      }

      //LOAD THE ALREADY DOWNLOADED PAGE IMAGES TO THE PAGENUM TO IMGSRC MAP
      await Promise.all(downloadedPagesFileUris.map(async (item, index) => {
        const imgUri = item
        const imgSize = await getImageDimensions(imgUri)
        const imgFileInfo = await FileSystem.getInfoAsync(imgUri)
        const { pageNum, savableDataUri} = downloadPageFileUriMap[imgUri]

        if(!imgFileInfo.exists) {
          console.error("The supplied imgUri does not exist")
          return
        }

        if(imgSize.width > 0 && imgSize.height > 0) {
          pageNumToImgSrcMap[pageNum] = {
            imgSize,
            imgUri,
          }
        } 
        else {
          console.error("An error occured. Page:", pageNum)
          pageNumToImgSrcMap[pageNum] = {
            imgSize,
            imgUri: null,
            imgError: new Error("failed to load even if already downloaded")
          }
        }

      }))

      // USE THE PAGENUM TO IMGSRC MAP TO SHOW THE PAGE IMAGES
      setPageImages(prev => {
        let imgSrc;
        return prev.map((prevPageImage, prevPageImageIdx) => {
          const loadedPageImagesMapItem = loadedPageImagesMap.current[prevPageImageIdx]

          if(pageNumToImgSrcMap[prevPageImageIdx]) {
            imgSrc = pageNumToImgSrcMap[prevPageImageIdx];
            loadedPageImagesMap.current[prevPageImageIdx] = {
              ...loadedPageImagesMapItem,
              loaded: true,
            }

            return {
              ...prevPageImage, 
              imgUri: imgSrc.imgUri,
              imgSize: imgSrc.imgSize,
              imgError: imgSrc.imgError,
            }
          }
          return prevPageImage;
        })
      })
      
    } catch (error) {
      console.error("Error loading pages:", error);
     
    }
  }, [])

  const debouncedLoadPageImages = useCallback(debounce(async(pageUrl, currentPageNum, signal) => {
    await loadPageImages(pageUrl, currentPageNum, signal)
  }, [500]), [])

  const handleRetry = useCallback(async (pageNum, pageUrl) => {

    setPageImages(prev => {
      return prev.map((prevPageImage, prevPageImageIdx) => {
        if(prevPageImageIdx === pageNum) {
          return {
            ...prevPageImage, 
            imgRetry: `Retrying to get page: ${pageNum}`,
            imgError: null, 
          }
        }
        return prevPageImage;
      })
    })

    ToastAndroid.show(
      `Retrying page: ${pageNum}`,
      ToastAndroid.SHORT
    )
    
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
    const savedataJsonFileName = "-saveData.json"
    const savableDataUri = pageMangaDir.cachedFilePath + savedataJsonFileName;
    
    ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
    const imgUri = pageMangaDir.cachedFilePath
    console.log("BAGO:", pageNum, imgUri)
    const retryDownloadResult = await retryPageDownload(pageNum, imgUri, savableDataUri)

    if(retryDownloadResult.imgError){
      setPageImages(prev => {
        return prev.map((prevPageImage, prevPageImageIdx) => {
          if(prevPageImageIdx === pageNum) {
            return {
              ...prevPageImage, 
              imgError: retryDownloadResult.imgError, 
              imgRetry: null,
            }
          }
          return prevPageImage;
        })
      })
      return
    }

    console.log("retryDownloadResult:", retryDownloadResult)

    setPageImages(prev => {
      return prev.map((prevPageImage, prevPageImageIdx) => {
        const loadedPageImagesMapItem = loadedPageImagesMap.current[prevPageImageIdx]

        if(prevPageImageIdx === pageNum) {
          const imgSrc = retryDownloadResult
          loadedPageImagesMap.current[prevPageImageIdx] = {
            ...loadedPageImagesMapItem,
            loaded: true,
          }

          return {
            ...prevPageImage, 
            imgUri: imgSrc.imgUri,
            imgSize: imgSrc.imgSize,
            imgError: imgSrc.imgError,
          }
        }
        return prevPageImage;
      })
    })
  }, []);

  const handleViewableItemsChanged = useCallback(async({ viewableItems }) => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    if(viewableItems.length > 0) {
      const currentPageNum = viewableItems.splice(-1)[0].index;
      readerCurrentPage.current = currentPageNum;
      const pageUrl = chapterPages[currentPageNum]

      onPageChange(currentPageNum)
      await debouncedLoadPageImages(pageUrl, currentPageNum, signal)

    }
  }, [pageImages])

  const handleReaderNavigation = useCallback((navigationMode) => {

    if(flashListRef.current) {
      console.log("natawag ang navigation ng flashListRef:", navigationMode)
      if(!navigationMode.mode) throw Error("No mentioned navigation mode.")
      let targetIndex;
      switch (navigationMode.mode) {
        case "prev":
          targetIndex = readerCurrentPage.current - 1 
          flashListRef.current.scrollToIndex({index: targetIndex, animated: true})
          break;
        case "next":
          targetIndex = readerCurrentPage.current + 1 
          flashListRef.current.scrollToIndex({index: targetIndex, animated: true})
          break;
        case "jump":
          if(!navigationMode.jumpIndex) throw Error("No mentioned jumpIndex.")
          if(navigationMode.jumpIndex === readerCurrentPage.current) {
            console.log("finished")
            return
          }
          flashListRef.current.scrollToIndex({index: navigationMode.jumpIndex, animated: true})

          break;
        case "jumpToOffset":
          if(!navigationMode.jumpOffset) throw Error("No mentioned jumpOffset.")
          flashListRef.current.scrollToOffset({offset: navigationMode.jumpOffset, animated: true})
          break;
        default:
          break;
      }

    } 
  }, [])

  const handleEndReached = useCallback(() => {
    onPageChange(chapterPages.length - 1, {finished: true})
  }, [])
  
  const renderItem = useCallback(({ item, index }) => {
    const LOADING_RANGE = 3;
    const pageNumbersLoadingRange = generatePageNumbers(readerCurrentPage.current, LOADING_RANGE, chapterPages.length)

    if(pageNumbersLoadingRange.has(index)) {
    }
    return (
      <View
        className=" h-full justify-center items-center"
        onStartShouldSetResponder={() => {
          return currentZoomLevel.current <= 1
        }}
      > 
        <ChapterPage
          ref={(page) => { pagesRef.current[index] = page; }}
          currentManga={currentManga}
          imgSrc={item}
          pageUrl={chapterPages[index]}
          pageNum={index}
          onRetry={handleRetry}
          onError={handleImgOnLoadError}
        />
        {/* <Button title='jumpToIndex' onPress={async () => {
          await downloadImage(chapterPages[0])
        }}/> */}
      </View>
    )
    
    
  }, [readerCurrentPage.current]);

  const keyExtractor = useCallback((item, index) => {
    return ` ${item?.id}-${index}`;
  }, []);

  const ListFooterComponent = () => {
    return (
      <View className="h-full">
        <Image
          source={{uri: 'file:///data/user/0/host.exp.exponent/files/Fl6py.jpg'} }
          style={{height:undefined, width: screenWidth, aspectRatio: 1}}
        />
      </View>
    )
  }

  const handleOnTouchStart = useCallback(async (gestureEvent) => {
    console.log("Touch start:", gestureEvent.nativeEvent.touches[0])


    const DOUBLE_TAP_TIME_THRESHOLD = 200
    const currentTouchTimeStamp = gestureEvent.nativeEvent.timestamp

    const calculatedTimeStamp = currentTouchTimeStamp - lastTouchTimeStamp.current 
    const pageX = gestureEvent.nativeEvent.pageX
    const pageY = gestureEvent.nativeEvent.pageY
    const numOfTouch = gestureEvent.nativeEvent.touches.length

    

    if(numOfTouch > 1 && currentZoomLevel.current <= 1) {
      await zoomableViewRef.current.zoomBy(0.5)
      return
    }
    
    if(
      calculatedTimeStamp <= DOUBLE_TAP_TIME_THRESHOLD &&
      currentZoomLevel.current <= 1 && numOfTouch === 1
    ) {
      await zoomableViewRef.current.zoomTo(2)
      setTimeout(async () => {
        await zoomableViewRef.current.moveTo(pageX, pageY)
      }, 500);
    }

    lastTouchTimeStamp.current = currentTouchTimeStamp;
  }, [])

  const handleOnTransform = useCallback(({zoomLevel}) => {
    if(zoomLevel === 1) setPanEnabled(false) 
    else setPanEnabled(true)
    currentZoomLevel.current = zoomLevel;
  }, [])

  const handleOnDoubleTapAfter = useCallback(() => {
    if(currentZoomLevel.current > 1) {
      zoomableViewRef.current.zoomTo(1);
    }
  }, [])

  const handleOnShiftingEnd = useCallback((gestureEvent, panGesture, zoomableViewEvent)=>{

    const halfScaledWidth = (zoomableViewEvent.zoomLevel * zoomableViewEvent.originalWidth) / 2
    const quarterScreenWidth = screenWidth/4
    const screenOffsetXConstant = screenWidth / (2 * halfScaledWidth) 
    const scrollToNextThreshold =  (screenWidth/2) - (quarterScreenWidth * screenOffsetXConstant)

    if((Math.abs(zoomableViewEvent.offsetX)) < scrollToNextThreshold) return
    
    zoomableViewRef.current.zoomTo(1) 
    if(zoomableViewEvent.offsetX < 0) {
      handleReaderNavigation({mode: "next"})
      return
    } 
    handleReaderNavigation({mode: "prev"})

  }, [])
 
  return (
    <View className="h-full w-full"
      onTouchStart={handleOnTouchStart}
      onTouchEnd={(e) => {
        onTap()
      }}
    >
      <ReactNativeZoomableView
          ref={zoomableViewRef}
          zoomStep={3}
          minZoom={1}
          maxZoom={3.5}
          pinchToZoomInSensitivity={1.5}
          bindToBorders
          contentWidth={screenWidth}
          contentHeight={screenHeight}
          onTransform={handleOnTransform}
          onDoubleTapAfter={handleOnDoubleTapAfter} 
          onShiftingEnd={handleOnShiftingEnd}
        >
        <FlashList
          pointerEvents={panEnabled ? 'none' : 'auto'}
          ref={flashListRef}
          data={pageImages}
          initialScrollIndex={currentPage}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={screenHeight}
          // estimatedItemSize={horizontal ? screenWidth : screenHeight}
          onViewableItemsChanged={handleViewableItemsChanged}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListFooterComponent={ListFooterComponent}
          // pagingEnabled  
          // horizontal
        />
        </ReactNativeZoomableView>
      {/* <View className="flex-1 relative">
      </View> */}
    </View>
  );
};

export default HorizontalReader;