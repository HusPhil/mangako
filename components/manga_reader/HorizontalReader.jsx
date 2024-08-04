import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Dimensions, PixelRatio, Button } from 'react-native';
import { debounce, isEqual } from 'lodash';
import shorthash from 'shorthash';
import { FlashList } from '@shopify/flash-list';
import { ToastAndroid } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import * as FileSystem from 'expo-file-system';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions, fetchPageDataAsPromise, downloadPageData } from './_reader';
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
    currentPage, savedPageLayout, inverted,
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
  const loadedPageImagesMap = useRef({});
  const pendingPageDownloadMap = useRef([])
  const currentZoomLevel = useRef(1);
  const readerCurrentPage = useRef(currentPage)
  const navigatedToCurrentPage = useRef(false)
  const zoomRef = useRef(null);
  const isMounted = useRef(true);
  const controllerRef = useRef(new AbortController());
  const flashRef = useRef(null);
  const pageLayout = useRef(Array(chapterPages.length).fill(-1));

  useEffect(() => {
    pageLayout.current = savedPageLayout;

    if(currentPage) {
      ToastAndroid.show(
        `Previuos page: ${currentPage + 1}`,
        ToastAndroid.SHORT
      )
    }

    return () => {
      isMounted.current = false;
      controllerRef.current.abort();
    };
  }, []);

  const handleCallBackTest = (pageNum, pageurl, progress,) => {

    if(pagesRef.current[pageNum]) {
      pagesRef.current[pageNum].toggleDownloadProgress(progress)
    }

    console.log("DOWNLOADING:", progress)
    if(progress.totalBytesWritten/progress.totalBytesExpectedToWrite === 1) {
      console.log("DOWNLOAD COMPLETE")
    }

  }

  const handleImgOnLoadError = useCallback(async (pageNum, error, imgUri) => {
    await FileSystem.deleteAsync(imgUri, {idempotent: true})
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
    const savedataJsonFileName = "-saveData.json"
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
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
      handleCallBackTest,
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
          console.log("Cancelled:", pageNum)

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
    
          const retryDownloadResumable = await createPageDownloadResumable(pageNum)
          const imgSize = await getImageDimensions(imgFileUri)

          if(imgSize.width > 0 && imgSize.height > 0) {
            return {
              imgSize,
              imgUri: imgFileUri
            }
          }

          await FileSystem.deleteAsync(imgFileUri)
          await FileSystem.deleteAsync(imgSavableDataUri)

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
              await FileSystem.deleteAsync(imgFileUri)
              await FileSystem.deleteAsync(imgSavableDataUri)
              ToastAndroid.show(
                `Failed to retry page: ${pageNum}\nStatus code: ${retryDownloadResult.status}`,
                ToastAndroid.SHORT
              )
              return {
                ...imgSrc,
                imgError: new Error("Failed to retry")
              }

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
    const LOADING_RANGE = 4

    // const currentPageNum = pageNum;
    // const prevPageNum = currentPageNum - 1 >= 0 ? currentPageNum - 1 : 0;
    // const nextPageNum = currentPageNum + 1 < chapterPages.length ? currentPageNum + 1 : chapterPages.length - 1;
    
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

      const pageDownloadResumables = await Promise.all(downloadResumablesToCreate.map((downloadResumableToCreate) => {
        return downloadResumableToCreate.downloadResumable
      }))      
      
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

      const pageImgSrcMap = {}
      const pageNumToPendingDownloadMap = {};
      

      pendingPageDownloadMap.current.forEach((item, index) => {
        pageNumToPendingDownloadMap[item.pageNum] = { index, item };
      });


      for (let index = 0; index < downloadResults.length; index++) {
        const downloadResult = downloadResults[index];
        if(!downloadResult) continue

        const downloadedFileInfo = await FileSystem.getInfoAsync(downloadResult.uri)
        const downloadContentLength = parseInt(downloadResult.headers['content-length'])

        let downloadedFileSize = 0;
        let downloadedValidImgUri = downloadResult.uri
        if(downloadedFileInfo.exists) downloadedFileSize = downloadedFileInfo.size
        
        const { pageNum, savableDataUri } = downloadPageFileUriMap[downloadResult.uri]
        // console.log("STATUS: ", downloadResult.status)
        // console.log("BYTES:", downloadContentLength, downloadedFileSize )
        // console.log("BYTES:", typeof(downloadContentLength), typeof(downloadedFileSize) )

        if(
          !allowedStatusCode[downloadResult.status] ||
          downloadContentLength !== downloadedFileSize 
        ) {
          console.warn("An error occurred, trying to retry.")
          const retryImgSrc = await retryPageDownload(pageNum, downloadResult.uri)
          if(!retryImgSrc.imgError) {
            downloadedValidImgUri = retryImgSrc.imgUri
            console.warn("Success retrying to fetch the image.")
          } else {
            downloadedValidImgUri = null
          }
        }

        downloadedPagesFileUris.push(downloadedValidImgUri)

        let targetPendingPageDownloadMap = pageNumToPendingDownloadMap[pageNum];

        if(!targetPendingPageDownloadMap) continue
        pendingPageDownloadMap.current[targetPendingPageDownloadMap.index] = {
          ...pendingPageDownloadMap.current[targetPendingPageDownloadMap.index],
          resolved: true,
        };

        // console.log("pendingPageDownloadMap.current[targetPendingPageDownloadMap.index]:", pendingPageDownloadMap.current[targetPendingPageDownloadMap.index])

        await FileSystem.deleteAsync(savableDataUri, {idempotent: true})
      }

      await Promise.all(downloadedPagesFileUris.map(async (downloadedPageFileUri) => {
        try {
          const imgUri = downloadedPageFileUri
          const imgSize = await getImageDimensions(imgUri)
          
          if(imgSize.width > 0 && imgSize.height > 0) {
            const { pageNum: mappedPageNum  } = downloadPageFileUriMap[imgUri]
            downloadedPagesFileUris.push(imgUri) 
            pageImgSrcMap[mappedPageNum] = {imgUri, imgSize}
          } else {
            await FileSystem.deleteAsync(imgUri, {idempotent: true})
          }

        } catch (error) {
          throw error
        }

      }))


      setPageImages((prev) => {
        console.log("setting the new pages")

        return prev.map((item, index) => {
          if (item.imgUri) return item;
          let imgSrc = null;

          if(pageNumbersLoadingRange.has(index)) {
            console.log(`Page${index+1}:`, pageImgSrcMap[index])
            imgSrc = pageImgSrcMap[index] || null;
            if (!imgSrc) return item;  // Return early if no image source
            loadedPageImagesMap.current[index]["loaded"] = true;
          }
          
          if (imgSrc && imgSrc.imgUri && imgSrc.imgSize) {
            return {
              ...item,
              imgSize: imgSrc.imgSize,
              imgError: imgSrc.imgError,
              imgUri: imgSrc.imgUri,
            };
          }
      
          return item;  // Return current item if imgSrc isn't valid
        });
      });
    
      
    } catch (error) {
      console.log("Error loading pages:", error);
      setPageImages((prev) => {
        return prev.map((item, index) => {
          if (item.imgUri) return item;
          let imgSrc = null;

          if(pageNumbersLoadingRange.has(index)) {
            console.log(`Page${index+1}:`, pageImgSrcMap[index])
            return {
              ...item,
              imgUri: null,
              imgError: new Error("Loading Image Failed"),
            };
          }
        });
      });
    }
  }, [])

  const debouncedLoadPageImages = useCallback(debounce(async(pageUrl, currentPageNum, signal) => {
    await loadPageImages(pageUrl, currentPageNum, signal)
  }, [300]), [])

  const handleRetry = useCallback(async (pageNum) => {
    // controllerRef.current = new AbortController();
    // const signal = controllerRef.current.signal;
    // await loadPageImages(pageNum, chapterPages[pageNum], signal);
    ToastAndroid.show(
      `Retrying page: ${pageNum}`,
      ToastAndroid.SHORT
    )
  }, []);

  const handleViewableItemsChanged = useCallback(async({ viewableItems }) => {
    controllerRef.current.abort()
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    if(viewableItems.length > 0) {
      const currentPageNum = viewableItems[0].index;
      readerCurrentPage.current = currentPageNum;
      const pageUrl = chapterPages[currentPageNum]

      onPageChange(currentPageNum)

      await debouncedLoadPageImages(pageUrl, currentPageNum, signal)

      if(currentPageNum !== currentPage && !navigatedToCurrentPage.current) {
        handleReaderNavigation({mode: "jump", jumpIndex: currentPage});
      }
      else {
        navigatedToCurrentPage.current = true
      }
    }
  }, [pageImages])
  
  const handlePageLoad = useCallback((pageNum, pageHeight) => {
    if(pageLayout.current[pageNum] !== - 1) return
    console.log("modifying existing page layout:" , pageNum, pageHeight)
    pageLayout.current[pageNum] = pageHeight;
    debouncedSaveDataToCache();
  }, [debouncedSaveDataToCache]);
  
  const debouncedSaveDataToCache = useCallback(debounce(async () => {
    console.log("saving:", pageLayout.current)
    await savePageLayout(currentManga.manga, currentManga.chapter, pageLayout.current);
  }, 500), [currentManga, savedPageLayout, pageLayout]);

  const handleReaderNavigation = useCallback((navigationMode) => {

    if(flashRef.current) {
      console.log("natawag ang navigation ng flashRef:", navigationMode)
      if(!navigationMode.mode) throw Error("No mentioned navigation mode.")
      let targetIndex;
      switch (navigationMode.mode) {
        case "prev":
          targetIndex = readerCurrentPage.current - 1 
          flashRef.current.scrollToIndex({index: targetIndex, animated: true})
          break;
        case "next":
          targetIndex = readerCurrentPage.current + 1 
          flashRef.current.scrollToIndex({index: targetIndex, animated: true})
          break;
        case "jump":
          if(!navigationMode.jumpIndex) throw Error("No mentioned jumpIndex.")
          if(navigationMode.jumpIndex === readerCurrentPage.current) {
            console.log("finished")
            navigatedToCurrentPage.current = true;
            return
          }
          flashRef.current.scrollToIndex({index: navigationMode.jumpIndex, animated: true})

          break;
        case "jumpToOffset":
          if(!navigationMode.jumpOffset) throw Error("No mentioned jumpOffset.")
          flashRef.current.scrollToOffset({offset: navigationMode.jumpOffset, animated: true})
          break;
        default:
          break;
      }

    } 
  }, [])

  const handleEndReached = useCallback(() => {
    onPageChange(chapterPages.length - 1, {finished: true})
  }, [])
  
  const debouncedOnScroll = useCallback(debounce( (e) => {
    onScroll(e.nativeEvent.contentOffset.y)
  }, 500), []);

  const renderItem = useCallback(({ item, index }) => (
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
        onPageLoad={handlePageLoad}
        onRetry={handleRetry}
        onError={handleImgOnLoadError}
        vertical
      />
      {/* <Button title='jumpToIndex' onPress={async () => {
        await downloadImage(chapterPages[0])
      }}/> */}
    </View>
  ), []);

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
 
  return (
    <View className="h-full w-full">
      <ReactNativeZoomableView
          ref={zoomRef}
          zoomStep={3}
          minZoom={1}
          maxZoom={3.5}
          onTransform={({zoomLevel}) => {
            if(zoomLevel === 1) setPanEnabled(false) 
            else setPanEnabled(true)
            currentZoomLevel.current = zoomLevel;
          }}
          onDoubleTapAfter={() => {
            if(currentZoomLevel.current > 1) {
              zoomRef.current.zoomTo(1);
            }
          }}
          disablePanOnInitialZoom
          bindToBorders
          contentWidth={screenWidth}
          contentHeight={screenHeight}
          onShiftingEnd={(e1, e2, zoomableViewEvent)=>{
            const absOffsetX = (Math.abs(zoomableViewEvent.offsetX))
            const scaledWidth = zoomableViewEvent.zoomLevel * zoomableViewEvent.originalWidth
            const halfScaledWidth = scaledWidth / 2
            const quarterScreenWidth = screenWidth/4
            const screenOffsetXConstant = screenWidth / (2 * halfScaledWidth) 
            const screenOffsetX =  (screenWidth/2) - (quarterScreenWidth * screenOffsetXConstant)

            if((Math.abs(zoomableViewEvent.offsetX)) < screenOffsetX) return
            
            zoomRef.current.zoomTo(1) 
            
            if(zoomableViewEvent.offsetX < 0) {
              handleReaderNavigation({mode: "next"})
              return
            } 

            handleReaderNavigation({mode: "prev"})

          }}
        >
        <FlashList
          pointerEvents={panEnabled ? 'none' : 'auto'}
          ref={flashRef}
          data={pageImages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          // getItemLayout={getItemLayout}
          estimatedItemSize={horizontal ? screenWidth : screenHeight}
          onViewableItemsChanged={handleViewableItemsChanged}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          pagingEnabled  
          horizontal
          ListFooterComponent={ListFooterComponent}
        />
        </ReactNativeZoomableView>
      {/* <View className="flex-1 relative">
      </View> */}
    </View>
  );
};

export default HorizontalReader;