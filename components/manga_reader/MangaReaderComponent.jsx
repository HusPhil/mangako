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

const MangaReaderComponent = ({ 
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
  const pendingPageDownloadMap = useRef({})
  
  const readerCurrentPage = useRef(currentPage)
  const currentZoomLevel = useRef(1);
  const lastTouchStartTimeStamp = useRef(0);  
  const lastTouchEndTimeStamp = useRef(0);  
  const touchStartPageLocation = useRef({pageX: 0, pageY: 0});
  const singleTapTimeout = useRef(null)

  useEffect(() => {
    
    // print the previous page where the user left off
    if(currentPage > 0) {
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

  const handleDownloadResumableCallback = useCallback(async (pageNum, pageUrl, progress) => {
    if(pagesRef.current[pageNum]) {
      // show the download progress of each page
      pagesRef.current[pageNum].toggleDownloadProgress(progress)
    }

    // take care of events for when the download finish
    if(progress.totalBytesWritten/progress.totalBytesExpectedToWrite === 1) {
      const pageFileName = shorthash.unique(pageUrl)
      const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
      
      //create completion certificate which can be used for download verification
      const certificateJsonFileName = "-certificate.json"
      const certificateFileUri = pageMangaDir.cachedFilePath + certificateJsonFileName
      
      await ensureDirectoryExists(pageMangaDir.cachedFolderPath)

      //make sure to update the pending download maps that this download has been resolved
      pendingPageDownloadMap.current[pageNum] = {
        ...pendingPageDownloadMap.current[pageNum],
        resolved: true,
      }

      //save the certification as a json file
      await FileSystem.writeAsStringAsync(
        certificateFileUri,
        JSON.stringify(progress),
        {encoding: FileSystem.EncodingType.UTF8}
      );

    }
  }, [])

  const handleDownloadVerification = useCallback(async(pageNum) => {
    const pageUrl = chapterPages[pageNum]
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
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
  }, [])
  
  const handleImgOnLoadError = useCallback(async (pageNum, error, imgUri) => {
    //show the user that this page had an error
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
    //make sure to only create a download if it is within the range of the chapter pages
    if(pageNum < 0 && pageNum >= chapterPages.length) return null
    
    const pageUrl = chapterPages[pageNum]
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
    const savedataJsonFileName = "-saveData.json"
    const savableDataUri = pageMangaDir.cachedFilePath + savedataJsonFileName;
    
    await ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
    //add this page to the loaded page images but do not indicate that is is already loaded (might need to be removed)
    loadedPageImagesMap.current[pageNum] = {uri: pageMangaDir.cachedFilePath}
    
    //use the download verification method to know if this page has been SUCCESSFULLY downloaded
    const downloadCompleted = await handleDownloadVerification(pageNum);

    if(downloadCompleted) {
      return {
        uri: pageMangaDir.cachedFilePath, pageNum, 
        fileExist: true, savableDataUri
      }
    }

    //if not create a download resumable from a util func named downloadPageData which handles 
    //all the complexity of creating a download resumable with an existing save data
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
      //get all the pending download resumables (only the values from the map)  
      Object.values(pendingPageDownloadMap.current).map(async (pendingPageDownload, pageNum) => {
        try {
          const { downloadResumable, savableDataUri, resolved } = pendingPageDownload

          if(resolved) return
          
          //pause the download so we can continue later if a save data exists
          await downloadResumable.pauseAsync();
          console.warn("Download paused in page:", pageNum)

          //get the savable data if there is any (it is important to pause the download before getting the savable)
          const savableData = downloadResumable.savable()

          //save the savable data to cache
          await FileSystem.writeAsStringAsync(
            savableDataUri,
            JSON.stringify(savableData),
            {encoding: FileSystem.EncodingType.UTF8}
          );

          //make sure that the page which this download is for is not marked as NOT LOADED in the mapping 
          loadedPageImagesMap.current[pageNum] = {
            ...loadedPageImagesMap.current[pageNum],
            loaded: false,
          };
    
        } catch (error) {
          console.error('Error cancelling pending download:', error);
        }
      })
    );
    pendingPageDownloadMap.current = {}
  }, [])

  const initializePageDownloads = useCallback(async (pageNumbersLoadingRange) => {
    
    //for sorting which pages is already downloaded so we don't have to create a download resumable for them
    const downloadedPagesFileUris = []
    //for sorting which pages still needs to be downloaded and thus create a download resumable for them
    const downloadResumablesToCreate = [];
    
    //this is used to access different properties that belongs to a specific page just by using the fileUri
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
      //using Set to generate the loading range for 0(1) lookup
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
      //initialize the imgSrc that will be returned
      const imgSrc = {imgSize: null, imgUri: null}
      
      try {
        const imgFileInfo = await FileSystem.getInfoAsync(imgFileUri)
        const imgSavableFileInfo = await FileSystem.getInfoAsync(imgSavableDataUri)
  
        if(imgFileInfo.exists && imgFileUri) {
          console.warn("Downloaded file data was deleted")
          await FileSystem.deleteAsync(imgFileUri)
        }
  
        if(imgSavableFileInfo.exists && imgSavableDataUri) {
          console.warn("Saved savable data was deleted")
          await FileSystem.deleteAsync(imgSavableDataUri)
        }
        
        //create a download resumable for retrying to download a page
        const retryDownloadResumable = await createPageDownloadResumable(pageNum)
        
        //make sure to update the mapping that a new pending download has been made
        pendingPageDownloadMap.current[pageNum] = {
          downloadResumable: retryDownloadResumable.downloadResumable, 
          savableDataUri: imgSavableDataUri,
        }
        
        //get the result
        const retryDownloadResult = await retryDownloadResumable.downloadResumable.downloadAsync()
        
        //update the mapping that this download has been resolved (regardless if successful or not)
        pendingPageDownloadMap.current[pageNum] = {
          ...pendingPageDownloadMap.current[pageNum],
          resolved: true,
        }
        
        //get the verification if the download was a success
        const downloadCompleted = await handleDownloadVerification(pageNum)

  
        if(!retryDownloadResult || !allowedStatusCode[retryDownloadResult.status] || !downloadCompleted) {
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

      } catch (error) {

        console.error("An error occured while retrying.", error)
        return {
          ...imgSrc,
          imgError: new Error("Failed to retry")
        }
      }
  }

  const loadPageImages = useCallback(async (pageNum) => {
    const LOADING_RANGE = 1  //this is supposed to be adjustable thru UI, how?
    
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

      console.log(`Not all are loaded: ${loadedPagesCount}/${pageNumbersLoadingRange.size}` )

      // determine the already downloaded pages and thos that have to be downloaded 
      // also create a map of uri to other info of page
      const {
        downloadedPagesFileUris,
        downloadResumablesToCreate,
        downloadPageFileUriMap,
      } = await initializePageDownloads(pageNumbersLoadingRange)

      //CREATE THE DOWNLOAD RESUMABLES 
      const pageDownloadResumables = await Promise.all(
        downloadResumablesToCreate.map((downloadResumableToCreate) => {
          return downloadResumableToCreate.downloadResumable
        })
      )      
      
     // CALL THE DOWNLOAD OR THE RESUME OPERATION DEPENDING ON THE STATUS OF THE PAGE 
      const downloadResults = await Promise.all(
        pageDownloadResumables.map(async pageDownloadResumable => {
          const { savableDataUri, pageNum } = downloadPageFileUriMap[pageDownloadResumable.fileUri];
  
          // ADD ALL THE CREATED DOWNLOAD RESUMABLES TO THE PENDING DOWNLOAD LIST SO WE CAN TRACK THEIR SATATUS
          pendingPageDownloadMap.current[pageNum] = {
            downloadResumable: pageDownloadResumable, 
            savableDataUri,
          }
          
          //CHECK IF THERE IS A SAVABLE DATA FOR THIS PAGE
          //THIS CAN BE USED TO KNOW IF WE CAN RESUME DOWLOAD OR START ANEW
          const saveDataFileInfo = await FileSystem.getInfoAsync(savableDataUri)
  
          if(saveDataFileInfo.exists) {
            return pageDownloadResumable.resumeAsync()
          }
  
          return pageDownloadResumable.downloadAsync()
        })
      )

      // CREATE A MAP TO COMPILE ALL THE PAGES AND SHOW THEM ALL AT ONCE
      let pageNumToImgSrcMap = {}
      
      for (let index = 0; index < downloadResults.length; index++) {
        //update the pending downloads map (this download has completed meaning it is resolved whether failed or successful)
        pendingPageDownloadMap.current[pageNum] = {
          ...pendingPageDownloadMap.current[pageNum],
          resolved: true,
        }
        
        const downloadResult = downloadResults[index];
        if(!downloadResult) continue

        
        //using this download result's uri, we can know for which 
        //page this download result is for using the downloadPageFileUriMap
        const { pageNum, savableDataUri } = downloadPageFileUriMap[downloadResult.uri]
        
        //determine if the download DOWNLOADED SUCCESSFULLY
        const downloadCompleted = await handleDownloadVerification(pageNum)
        let imgUri = downloadResult.uri
        
        if(!allowedStatusCode[downloadResult.status] || !downloadCompleted) {
          console.warn("An error occurred, trying to retry.")
          
          //retry downlaoding the image if failed
          const retryImgSrc = await retryPageDownload(pageNum, downloadResult.uri)
          if(!retryImgSrc.imgError) {
            console.warn("Success retrying to fetch the image.")
            imgUri = retryImgSrc.imgUri
          }
          else {
            imgUri = null
          }

        }

        //getting the image dimensions also can be used to check if the file is a valid image
        const imgSize = await getImageDimensions(imgUri)

        if(imgSize.width > 0 && imgSize.height > 0) {
          pageNumToImgSrcMap[pageNum] = {
            imgSize,
            imgUri,
          }
        } 
        else {
          console.error("An error occured during setting of NEWLY downloaded images:", imgUri)
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

          if(pageNumToImgSrcMap[prevPageImageIdx]) {
            imgSrc = pageNumToImgSrcMap[prevPageImageIdx];
            //indicate that this particular page has already been loaded
            loadedPageImagesMap.current[prevPageImageIdx] = {
              ...loadedPageImagesMap.current[prevPageImageIdx],
              loaded: true,
            }
            //return the imgSrc data
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
      
      //if an error occured set the current page to show an error 
      setPageImages(prev => {
        return prev.map((prevPageImage, prevPageImageIdx) => {
          if(prevPageImageIdx === pageNum) {
            return {
              ...prevPageImage, 
              imgError: new Error("An error occured while loading the page"), 
              imgRetry: null,
            }
          }
          return prevPageImage;
        })
      })
    }
  }, [])

  const debouncedLoadPageImages = useCallback(debounce(async(currentPageNum) => {
    await loadPageImages(currentPageNum)
  }, [500]), [])

  const handleRetry = useCallback(async (pageNum, pageUrl) => {
    //indicate that the this page is in retry state
    setPageImages(prev => {
      return prev.map((prevPageImage, prevPageImageIdx) => {
        if(prevPageImageIdx === pageNum) {
          console.log("naset ang page:", pageNum)
          return {
            ...prevPageImage, 
            imgRetry: `Retrying to get page: ${pageNum}`,
            imgError: null, 
          }
        }
        return prevPageImage;
      })
    })

    //show toast that of retry message
    ToastAndroid.show(
      `Retrying page: ${pageNum}`,
      ToastAndroid.SHORT
    )
    
    const pageFileName = shorthash.unique(pageUrl)
    const pageMangaDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)
    const savedataJsonFileName = "-saveData.json"
    const savableDataUri = pageMangaDir.cachedFilePath + savedataJsonFileName;
    const TIMEOUT_THRESHOLD = 60000;
    
    await ensureDirectoryExists(pageMangaDir.cachedFolderPath)
    
    const imgUri = pageMangaDir.cachedFilePath
    
    //initialize the result to have an error (to make sure that the imgsrc has an error if the download fails)
    let retryDownloadResult = {imgError: new Error("Timeout")};
    
    //createa a timeout promise for when to indicate that the retry fetching has taken too long
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(async () => {

        cancelPendingDownloads()
          .then(() => (
              resolve({
                  imgError: new Error(`No response after ${TIMEOUT_THRESHOLD}ms`)
                } 
              )
            )
          )
        
      }, TIMEOUT_THRESHOLD);
    })

    //set the retry download result to which one finish first
    retryDownloadResult = await Promise.race([
      timeoutPromise,
      retryPageDownload(pageNum, imgUri, savableDataUri),
    ])

    console.log("retryDownloadResult sa HANDLEretry", retryDownloadResult)

    const downloadCompleted = await handleDownloadVerification(pageNum)

    if(!retryDownloadResult || retryDownloadResult?.imgError || !downloadCompleted) {
      //show that this page is in error
      setPageImages(prev => {
        return prev.map((prevPageImage, prevPageImageIdx) => {
          if(prevPageImageIdx === pageNum) {
            return {
              ...prevPageImage, 
              imgError: retryDownloadResult?.imgError, 
              imgRetry: null,
            }
          }
          return prevPageImage;
        })
      })
      return
    }

    //show the result
    setPageImages(prev => {
      return prev.map((prevPageImage, prevPageImageIdx) => {

        if(prevPageImageIdx === pageNum) {
          console.warn("Success retyring:", pageNum)
          loadedPageImagesMap.current[prevPageImageIdx] = {
            ...loadedPageImagesMap.current[prevPageImageIdx],
            loaded: true,
          }

          return {
            ...prevPageImage, 
            imgUri: retryDownloadResult.imgUri,
            imgSize: retryDownloadResult.imgSize,
            imgError: null,
            imgRetry: null,
          }
        }
        return prevPageImage;
      })
    })
  }, []);

  const handleViewableItemsChanged = useCallback(async({ viewableItems }) => {

    if(viewableItems.length > 0) {
      const currentPageNum = horizontal ? viewableItems[0].index : viewableItems.splice(-1)[0].index;
      readerCurrentPage.current = currentPageNum;
      // call the callback func to update the ui back in the parent component
      onPageChange(currentPageNum)
      await debouncedLoadPageImages(currentPageNum)

    }
  }, [pageImages])

  const handleReaderNavigation = useCallback((navigationMode) => {

    if(flashListRef.current) {
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
    return (
      <View
        className=" h-full justify-center items-center"
        onStartShouldSetResponder={() => {
          return currentZoomLevel.current <= 1
        }}
      > 
        <ChapterPage
          ref={(page) => { pagesRef.current[index] = page; }}
          id={item.id}
          currentManga={currentManga}
          imgSrc={item}
          pageUrl={chapterPages[index]}
          pageNum={index}
          onRetry={handleRetry}
          onError={handleImgOnLoadError}
        />
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

    const currentTouchTimeStamp = gestureEvent.nativeEvent.timestamp
    const { pageX, pageY, } = gestureEvent.nativeEvent

    // set the new info to share with other components
    touchStartPageLocation.current = {pageX, pageY}
    lastTouchStartTimeStamp.current = currentTouchTimeStamp; 
  }, [])

  const onDoubleTap = useCallback(() => {

    if(currentZoomLevel.current <= 1) {
      zoomableViewRef.current.zoomBy(0.5)
      return
    }
    
    if(currentZoomLevel.current <= 1) {
      zoomableViewRef.current.zoomTo(2)
    }

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
      onTouchEnd={(gestureEvent) => {
        const TAP_DURATION_THRESHOLD = 200; //in ms
        const DOUBLE_TAP_TIME_THRESHOLD = 350; // in ms
        const TAP_DISTANCE_THRESHOLD = 10; //in px

        const currentTouchTimeStamp = gestureEvent.nativeEvent.timestamp
        const touchDuration = currentTouchTimeStamp - lastTouchStartTimeStamp.current;
        const numOfTouch =  gestureEvent.nativeEvent.touches.length

        console.log("numOfTouch", numOfTouch)

        const { pageX:touchEndPageX, pageY:touchEndPageY } = gestureEvent.nativeEvent;
        const { pageX:touchStartPageX, pageY:touchStartPageY } = touchStartPageLocation.current;

        const distanceX = Math.abs(touchEndPageX - touchStartPageX)
        const distanceY = Math.abs(touchEndPageY - touchStartPageY)

        const isTapGesture = touchDuration < TAP_DURATION_THRESHOLD &&
          distanceX < TAP_DISTANCE_THRESHOLD &&
          distanceY < TAP_DISTANCE_THRESHOLD 
          // numOfTouch === 0
        
        const isDoubleTapGesture = currentTouchTimeStamp - lastTouchEndTimeStamp.current < DOUBLE_TAP_TIME_THRESHOLD;
        
        console.log("touchDuration", touchDuration)
        console.log("distanceX", distanceX)
        console.log("distanceY", distanceY)

        if(!isTapGesture) {
          lastTouchEndTimeStamp.current = currentTouchTimeStamp
          return
        }

        if(isDoubleTapGesture && singleTapTimeout.current) {

          clearTimeout(singleTapTimeout.current)
          onDoubleTap()
          
          lastTouchEndTimeStamp.current = currentTouchTimeStamp
          return
        }

        singleTapTimeout.current = setTimeout(() => {
          onTap()
        }, DOUBLE_TAP_TIME_THRESHOLD);

        lastTouchEndTimeStamp.current = currentTouchTimeStamp        
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
            estimatedItemSize={horizontal ? screenWidth : screenHeight}
            onViewableItemsChanged={handleViewableItemsChanged}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
            ListFooterComponent={ListFooterComponent}
            pagingEnabled={horizontal}
            horizontal={horizontal}
            inverted={inverted} 
          />
         </ReactNativeZoomableView>
    </View>
  );
};

export default React.memo(MangaReaderComponent);