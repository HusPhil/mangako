import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Dimensions, ScrollView, Button, PixelRatio } from 'react-native';
import { debounce, isEqual } from 'lodash';
import { FlashList } from '@shopify/flash-list';
import { ToastAndroid } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions, fetchPageDataAsPromise } from './_reader';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { getChapterPageImage } from '../../services/MangakakalotClient';
import { ResumableZoom, ScaleMode, ResumableZoomAssignableState, PanMode } from 'react-native-zoom-toolkit';

const VerticalReader = ({ currentManga, chapterPages, onTap, onPageChange, onScroll, currentPage, savedPageLayout, inverted }) => {
  const [pageImages, setPageImages] = useState(() => 
    chapterPages.map((pageUrl) => ({
      id: pageUrl,
      imgUri: null,  
      imgSize: null, 
      error: null,  
    }))
  );

  const [panEnabled, setPanEnabled] = useState(false);
  const [errorData, setErrorData] = useState(null);

  const {height: screenHeight, width: screenWidth} = Dimensions.get('screen')

  const pagesRef = useRef(Array(chapterPages.length));
  const pagesZoomRef = useRef(Array(chapterPages.length))
  const flashRef = useRef(null);
  const lastTouchTimestampRef = useRef(0);

  const pageLayout = useRef(Array(chapterPages.length).fill(-1));
  const currentZoomLevel = useRef(1);
  const readerCurrentPage = useRef(currentPage)
  const navigatedToCurrentPage = useRef(false)

  const controllerRef = useRef(new AbortController());
  const isMounted = useRef(true);

  const AsyncEffect = async () => {

    pageLayout.current = savedPageLayout;

    if (!isMounted.current) return;

    try {
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;
      
      const pageImagePromises = chapterPages.map(async (pageUrl, pageNum) => {
         loadPageImages(pageUrl, pageNum, signal)
      })

      Promise.all(pageImagePromises)
      

    } catch (error) {
      setErrorData(error);
    }
  };

  useEffect(() => {
    AsyncEffect();

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

  useEffect(() => {
    

    // const currentPageZoomState = pagesZoomRef.current[readerCurrentPage.current].requestState()
    // console.log(currentPageZoomState.scale)


  }, [currentZoomLevel.current])

  const loadPageImages = useCallback(async (pageUrl, pageNum, signal) => {
    try {
      // const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
      let fetchedImgSrc = await getChapterPageImage(currentManga.manga, currentManga.chapter, pageUrl, signal)

      if (fetchedImgSrc?.error) {
        setPageImages(prev => {
          const newPageImages = [...prev];
          newPageImages[pageNum] = { imgUri: undefined, imgSize: null, error: fetchedImgSrc.error };
          return newPageImages;
        });
        throw fetchedImgSrc.error;
      }


      const imgSize = await getImageDimensions(fetchedImgSrc.data)
      if (isMounted.current) {
    
        setPageImages((prev) => {
          return prev.map((item, index) => {
            if (index === pageNum) {
              return {
                ...item,
                imgUri: fetchedImgSrc.data,
                imgSize
              };
            }
            return item;
          });
        });
        
        console.log("page:", fetchedImgSrc, "was loaded in horrMode!")
      }

    } catch (error) {
      console.log("Error loading pages:", error);
    }
  }, [])

  const handleRetry = useCallback(async (pageNum) => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    await loadPageImages(pageNum, chapterPages[pageNum], signal);
  }, []);

  

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if(viewableItems.length > 0) {
      const currentPageNum = viewableItems[0].index;
      readerCurrentPage.current = currentPageNum;
      onPageChange(currentPageNum);
      // if(currentZoomLevel.current > 1) zoomRef.current.zoomTo(1)
      console.log(currentPageNum, currentPage)
      if(currentPageNum !== currentPage && !navigatedToCurrentPage.current) {
        // console.log("navigatedToCurrentPage.current:", navigatedToCurrentPage.current)
        console.log("navigating:", navigatedToCurrentPage.current)
        handleReaderNavigation({mode: "jump", jumpIndex: currentPage});
      }
      else {
        navigatedToCurrentPage.current = true
      }
      if(pagesZoomRef.current[readerCurrentPage.current]) {
        // pagesZoomRef.current[readerCurrentPage.current].reset()
      }
    }
  }, [])
  
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
    <View className="justify-center overflow-hidden"
      style={{height: screenHeight, width:screenWidth}}
      onStartShouldSetResponder={() => {
        const scrollView = flashRef.current.getScrollableNode();
        
      }}
    > 
    <ResumableZoom
      ref={(pageZoom) => { pagesZoomRef.current[index] = pageZoom; }}
      minScale={1}
      maxScale={3.5}
      // panMode={PanMode.FREE}
      scaleMode={ScaleMode.CLAMP}
      onPinchEnd={() => {
        
        const currentPageZoomState = pagesZoomRef.current[readerCurrentPage.current].requestState()
        console.log(currentPageZoomState.scale)
        currentZoomLevel.current = currentPageZoomState.scale

        if(currentZoomLevel.current > 1) setPanEnabled(true)
        else setPanEnabled(false)
        
      }}
      onPanEnd={(panGesture) => {
        if (pagesZoomRef.current[readerCurrentPage.current]) {
          console.log('**********************************')
          const currentPageZoomRef = pagesZoomRef.current[readerCurrentPage.current]
          const currentPageZoomState = currentPageZoomRef.requestState()
          
          const boundX = 180 - Math.abs(currentPageZoomState.translateX/currentPageZoomState.scale)
          const moveX = Math.abs(panGesture.translationX) * 0.8
          
          // console.log(currentPageZoomState.translateX / PixelRatio.get())
          // console.log(Math.abs(panGesture.translationX) + Math.abs(currentPageZoomState.translateX))
          // console.log((currentPageZoomState.scale * currentPageZoomState.width) / 4)
          
          console.log(
            "moveX:", moveX,
            "boundX:", boundX
          )
          // console.log(Math.abs(currentPageZoomState.translateX/currentPageZoomState.scale) + currentPageZoomState.width / 4 * PixelRatio.get
          // ())

          // (Math.abs(zoomableViewEvent.offsetX) + screenWidth/4) < screenWidth/2

          if(Math.abs(moveX > boundX)) {
            if(currentPageZoomState.translateX < 0) {
              handleReaderNavigation({mode: 'next'})
            }
            else {
              handleReaderNavigation({mode: 'prev'})
            }
            currentPageZoomRef.reset()
            setPanEnabled(false) 
          }
        }
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
        vertical
      />
    </ResumableZoom>
      <Button title='jumpToIndex' onPress={() => {
        console.log(readerCurrentPage.current)
        console.log(keyExtractor(pageImages[readerCurrentPage.current], readerCurrentPage.current))
      }}/>

    </View>
  ), []);

  const keyExtractor = useCallback((item, index) => {
    return ` ${item?.id}-${index}`;
  }, []);

  return (
    <View className="h-full"
      onStartShouldSetResponder={(gestureResponder) => {
        const currentPageZoomRef = pagesZoomRef.current[readerCurrentPage.current]
        if (!currentPageZoomRef) return
        
        const currentPageZoomState = currentPageZoomRef.requestState()
        const numOfTouch = gestureResponder.nativeEvent.touches.length

        if(numOfTouch <= 1) return

        currentPageZoomRef.assignState({
          scale: currentPageZoomState.scale + 0.5,
          translateX: 0,
          translateY: 0,
        })

        setPanEnabled(true)
      }}      
      onTouchEndCapture={(gestureResponder) => {
        const DOUBLE_TAP_THRESHOLD = 300;

        const currentPageZoomRef = pagesZoomRef.current[readerCurrentPage.current]
        if (!currentPageZoomRef) return

        
        const currentPageZoomState = currentPageZoomRef.requestState()
        const currentTouchTimestamp = gestureResponder.nativeEvent.timestamp
        
        
        const timestampSinceLastTouch = currentTouchTimestamp - lastTouchTimestampRef.current

        if (timestampSinceLastTouch < DOUBLE_TAP_THRESHOLD) {
          if(Math.round(currentPageZoomState.scale) > 1) {
            setPanEnabled(false) 
          }
          else {
            setPanEnabled(true) 
          }

          ToastAndroid.show (
            'Double Tap ' + Math.round(currentPageZoomState.scale),
            ToastAndroid.SHORT
          )
        }


        lastTouchTimestampRef.current = currentTouchTimestamp

      }}    
    >
        <FlashList
          ref={flashRef}
          // pointerEvents='none'/
          data={pageImages}
          // pointerEvents={panEnabled ? 'none' : 'auto'}
          
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          // getItemLayout={getItemLayout}
          estimatedItemSize={screenWidth}
          onViewableItemsChanged={handleViewableItemsChanged}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          pagingEnabled
          horizontal
          scrollEnabled={!panEnabled}
        />
      {/* <View className="flex-1 relative">
      </View> */}
    </View>
  );
};

export default VerticalReader;
