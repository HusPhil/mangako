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

const HorizontalReader = ({ currentManga, chapterPages, onTap, onPageChange, onScroll, currentPage, savedPageLayout, inverted }) => {
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

  const getPageUrlChunk = useCallback((pageNum) => {
    let pageUrlChunk = []

    for (let index = pageNum - 1; index <= pageNum + 1; index++) {
      if(index >= 0 && index < chapterPages.length) {
        pageUrlChunk.push(chapterPages[index])
      }
    }

    return pageUrlChunk

  }, [])

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
    let pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
    const savableDataUri = pageMangaDir.cachedFilePath + savedataJsonFileName;
    
    ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
    const pageFileInfo = await FileSystem.getInfoAsync(pageMangaDir.cachedFilePath)
    loadedPageImagesMap.current[pageNum] = {uri: pageMangaDir.cachedFilePath}
    
    // if(loadedPageImagesMap.current[pageMangaDir.cachedFilePath]) console.log("NASA LOADED EME NA")
    const saveDataFileInfo = await FileSystem.getInfoAsync(savableDataUri)

    if(pageFileInfo.exists) {
      console.log(pageNum, "fileSize:", pageFileInfo.size)
      if(!saveDataFileInfo.exists) {
        console.log(pageNum, "fileSize:", pageFileInfo.size)
        return {uri: pageMangaDir.cachedFilePath, pageNum, fileExist: true, savableDataUri}
      }
    }
    const pageDownloadResumable = await downloadPageData(
      currentManga.manga, 
      currentManga.chapter, 
      pageUrl,
      savableDataUri,
      handleCallBackTest,
      {pageNum}
    )

    return {downloadResumable: pageDownloadResumable, pageNum, uri: pageMangaDir.cachedFilePath, savableDataUri}

  }, [])

  const loadPageImages = useCallback(async (pageUrl, pageNum, signal) => {
    const currentPageNum = pageNum;
    const prevPageNum = currentPageNum - 1 >= 0 ? currentPageNum - 1 : 0;
    const nextPageNum = currentPageNum + 1 < chapterPages.length ? currentPageNum + 1 : chapterPages.length - 1;
    
    try {

      await Promise.all(
        pendingPageDownloadMap.current.map(async (pendingPageDownload) => {
          try {
            
            const { downloadResumable, savableDataUri, pageNum, resolved } = pendingPageDownload
            console.log("RESOLVED:", resolved)

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
            console.log('Error handling pending download:', error);
          }
        })
      );
      

      pendingPageDownloadMap.current = []


      if (
        loadedPageImagesMap.current[prevPageNum]?.loaded &&
        loadedPageImagesMap.current[currentPageNum]?.loaded &&
        loadedPageImagesMap.current[nextPageNum]?.loaded
      ) {
        return;
      }

      const downloadedPagesFileUris = []
      const downloadResumablesToCreate = [];
      const downloadPageNumMap = {}

      for (let index = pageNum - 1; index <= pageNum + 1; index++) {
        if(index < 0 || index >= chapterPages.length) continue

        const pageDownloadResumable = await createPageDownloadResumable(index)
        downloadPageNumMap[pageDownloadResumable.uri] = pageDownloadResumable.pageNum 

        if(pageDownloadResumable.fileExist) {
          downloadedPagesFileUris.push(pageDownloadResumable.uri)
          continue
        }
        downloadResumablesToCreate.push(pageDownloadResumable)
      }
      
      const savableDataUriMap = {}
      const pageDownloadResumables = await Promise.all(downloadResumablesToCreate.map((downloadResumableToCreate) => {
        savableDataUriMap[downloadResumableToCreate.uri] = {
          savableDataUri: downloadResumableToCreate.savableDataUri,
          pageNum: downloadResumableToCreate.pageNum,
        };
        return downloadResumableToCreate.downloadResumable
      }))
      // console.log(loadedPageImagesMap.current)
      
      const downloadResults = await Promise.all(pageDownloadResumables.map( async pageDownloadResumable => {
        const savableDataUri = savableDataUriMap[pageDownloadResumable.fileUri]?.savableDataUri
        const pageNum = savableDataUriMap[pageDownloadResumable.fileUri]?.pageNum
        pendingPageDownloadMap.current.push({
          downloadResumable: pageDownloadResumable, 
          savableDataUri, pageNum,
        })

        // console.log("pageDownloadResumable.data:", pageDownloadResumable.callback())

        const saveDataFileInfo = await FileSystem.getInfoAsync(savableDataUri)

        if(saveDataFileInfo.exists) {
          console.log("SAVEDATA CURRENT SIZE:", saveDataFileInfo.size)
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

        const allowedStatusCode = {
           200 : "SUCCESS",
           206: "PARTIAL",
        }
        
        if(!downloadResult) continue

        const downloadedFileInfo = await FileSystem.getInfoAsync(downloadResult.uri)
        const downloadContentLength = parseInt(downloadResult.headers['content-length'])

        let downloadedFileSize = 0;
        if(downloadedFileInfo.exists) downloadedFileSize = downloadedFileInfo.size
        
        const { pageNum, savableDataUri } = savableDataUriMap[downloadResult.uri]
        console.log("STATUS: ", downloadResult.status)
        console.log("BYTES:", downloadContentLength, downloadedFileSize )
        console.log("BYTES:", typeof(downloadContentLength), typeof(downloadedFileSize) )

        if(
          !allowedStatusCode[downloadResult.status] ||
          downloadContentLength !== downloadedFileSize 
        ) {
          console.warn(`Retrying to fetch: ${pageNum}`)

          ToastAndroid.show(
            `Retrying page: ${pageNum}`,
            ToastAndroid.SHORT
          )
          
          const retryDownloadResumable = await createPageDownloadResumable(pageNum)
          await FileSystem.deleteAsync(savableDataUri, {idempotent: true})
          await FileSystem.deleteAsync(retryDownloadResumable.uri, {idempotent: true})
          const retryDownloadResult = await retryDownloadResumable.downloadResumable.downloadAsync()

          if(!retryDownloadResult) {
            ToastAndroid.show(
              `Failed to retry page: ${pageNum}`,
              ToastAndroid.SHORT
            )
            continue
          }

          pendingPageDownloadMap.current.push({
            downloadResumable: retryDownloadResumable.downloadResumable, 
            savableDataUri, pageNum,
          })

          // console.log("retryDownloadCReatable:", retryDownloadResumable) 
          // console.log("retryDownloadResumable:", retryDownloadResumable.downloadResumable) 
          // console.log("retryDownloadResult:", retryDownloadResult) 


          if(!allowedStatusCode[retryDownloadResult.status]
            ) {
              console.error(`Failed to retry page: ${pageNum}\nStatus code: ${retryDownloadResult.status}`)
              setPageImages(prev => (
                prev.map((item, index) => {
                  if(index !== pageNum) return item;
                  return {
                    ...item,
                    imgUri: null,
                    imgError: new Error(`Status Code: ${downloadResult.status}`)
                  }
                })
              ))
              ToastAndroid.show(
                `Failed to retry page: ${pageNum}\nStatus code: ${retryDownloadResult.status}`,
                ToastAndroid.SHORT
              )
            continue
          }
          ToastAndroid.show(
            `Success retrying page: ${pageNum}\nStatus code: ${retryDownloadResult.status}`,
            ToastAndroid.SHORT
          )
          
          const newPageFileInfo = await FileSystem.getInfoAsync(retryDownloadResult.uri)

          console.log(newPageFileInfo)

          downloadedPagesFileUris.push(retryDownloadResult.uri)
          continue
        }

        downloadedPagesFileUris.push(downloadResult.uri)

        let targetPendingPageDownloadMap = pageNumToPendingDownloadMap[pageNum];

        if(!targetPendingPageDownloadMap) continue
        
        // console.log(pageNumToPendingDownloadMap, targetPendingPageDownloadMap)
        pendingPageDownloadMap.current[targetPendingPageDownloadMap.index]["resolved"] = true;

        await FileSystem.deleteAsync(savableDataUri, {idempotent: true})
      }

      await Promise.all(downloadedPagesFileUris.map(async (downloadedPageFileUri) => {

        try {
          const imgUri = downloadedPageFileUri
          const imgSize = await getImageDimensions(imgUri)

          if(imgSize.width > 0 && imgSize.height > 0) {
            const mappedPageNum = downloadPageNumMap[imgUri]
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
        console.log("prevPageData:", prevPageNum, pageImgSrcMap[prevPageNum])
        console.log("currentPageData:", currentPageNum, pageImgSrcMap[currentPageNum])
        console.log("nextPageData:", nextPageNum, pageImgSrcMap[nextPageNum])

        return prev.map((item, index) => {
          // If image is already loaded, return the current item
          if (item.imgUri) return item;
      
          let imgSrc = null;
      
          switch (index) {
            case nextPageNum:
              imgSrc = pageImgSrcMap[nextPageNum] || null;
              if (!imgSrc) return item;  // Return early if no image source
              loadedPageImagesMap.current[nextPageNum]["loaded"] = true;
              break;
      
            case prevPageNum:
              imgSrc = pageImgSrcMap[prevPageNum] || null;
              if (!imgSrc) return item;  // Return early if no image source
              loadedPageImagesMap.current[prevPageNum]["loaded"] = true;
              break;
      
            case currentPageNum:
              imgSrc = pageImgSrcMap[currentPageNum] || null;
              if (!imgSrc) return item;  // Return early if no image source
              loadedPageImagesMap.current[currentPageNum]["loaded"] = true;
              break;
      
            default:
              return item;  // Return the current item for pages not of interest
          }
      
          // Check if imgSrc is properly defined and contains necessary data
          if (imgSrc && imgSrc.imgUri && imgSrc.imgSize) {
            return {
              ...item,
              imgSize: imgSrc.imgSize,
              imgError: imgSrc.error,
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
          switch (index) {
            case nextPageNum:
            case prevPageNum:
            case currentPageNum:
              return {
                ...item,
                imgUri: null,
                imgError: new Error("Loading Image Failed"),
              };
              // loadedPageImagesMap.current[currentPageNum]["loaded"] = true;
              break;
      
            default:
              return item;  // Return the current item for pages not of interest
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
          // contentWidth={screenWidth}
          // contentHeight={screenHeight}
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
          estimatedItemSize={screenHeight}
          onViewableItemsChanged={handleViewableItemsChanged}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          // pagingEnabled  
          // horizontal
          ListFooterComponent={ListFooterComponent}
        />
        </ReactNativeZoomableView>
      {/* <View className="flex-1 relative">
      </View> */}
    </View>
  );
};

export default HorizontalReader;