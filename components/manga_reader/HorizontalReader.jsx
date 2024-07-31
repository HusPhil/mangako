import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Dimensions, PixelRatio, Button } from 'react-native';
import { debounce, isEqual } from 'lodash';
import { FlashList } from '@shopify/flash-list';
import { ToastAndroid } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions, fetchPageDataAsPromise } from './_reader';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { getChapterPageImage } from '../../services/MangakakalotClient';

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

  const pagesRef = useRef([]);
  const loadedPageImages = useRef([]);
  const loadedPageImagesRealCount = useRef(0);
  const currentZoomLevel = useRef(1);
  const readerCurrentPage = useRef(currentPage)
  const navigatedToCurrentPage = useRef(false)
  const zoomRef = useRef(null);
  const isMounted = useRef(true);
  const controllerRef = useRef(new AbortController());
  const flashRef = useRef(null);
  const pageLayout = useRef(Array(chapterPages.length).fill(-1));

  const AsyncEffect = async () => {

    pageLayout.current = savedPageLayout;

    
    

    if (!isMounted.current) return;

    try {
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;
      
      const pageImagePromises = chapterPages.map(async (pageUrl, pageNum) => {
        //  loadPageImages(pageUrl, pageNum, signal)
        const fetchedImgSrc = await getChapterPageImage(currentManga.manga, currentManga.chapter, pageUrl, signal)
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
    if(loadedPageImagesRealCount.current == chapterPages.length && loadedPageImagesRealCount.current > 0) {
      ToastAndroid.show(
        'Loading finished',
        ToastAndroid.SHORT
      )
    }
  }, [loadedPageImagesRealCount.current])

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
        loadedPageImagesRealCount.current++;
        throw fetchedImgSrc.error;
      }


      const imgSize = {width: 1, height: 1};
      if (isMounted.current) {
        
        loadedPageImages.current[pageNum] = {
          ...pageImages[pageNum], 
          imgUri: fetchedImgSrc,
          imgSize,
        }

        loadedPageImagesRealCount.current++;

        if(readerCurrentPage.current === pageNum || currentZoomLevel.current === 1) {
          console.log("na set ang page:", pageNum);
        } 
        setPageImages((prev) => {

          if (prev[pageNum]?.imgUri === fetchedImgSrc.data) return prev; // Avoid unnecessary update
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
      if(loadedPageImages.current.length) {
        setPageImages(() => loadedPageImages.current)
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
    <View className="justify-center"
      onStartShouldSetResponder={() => {
        return currentZoomLevel.current <= 1
      }}
      style={{height: screenHeight, width:screenWidth}}
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
    <View className="h-full">
      <ReactNativeZoomableView
          ref={zoomRef}
          zoomStep={3}
          minZoom={1}
          maxZoom={3.5}
          onTransform={({zoomLevel}) => {
            if(zoomLevel === 1) setPanEnabled(false) 
            else setPanEnabled(true)

            if(loadedPageImages.current.length === chapterPages.length) {
              // setPageImages(prev => {
              //   return loadedPageImages.current
              // }) 
              // console.log("loadedPageImages:", loadedPageImages.current.length)
            }

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

            if((Math.abs(zoomableViewEvent.offsetX) + screenWidth/4) < screenWidth/2 + 50) return
            
            zoomRef.current.zoomTo(1) 
            
            if(zoomableViewEvent.offsetX < 0) {
              handleReaderNavigation({mode: "next"})
              return
            } 

            handleReaderNavigation({mode: "prev"})

          }}
          onShouldBlockNativeResponder={(e1,e2,zoomableViewEvent)=>{
            return zoomableViewEvent.zoomLevel > 1
          }}    
        >
        <FlashList
          pointerEvents={panEnabled ? 'none' : 'box-only'}
          ref={flashRef}
          data={pageImages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          // getItemLayout={getItemLayout}
          estimatedItemSize={screenWidth}
          onViewableItemsChanged={handleViewableItemsChanged}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          pagingEnabled
          horizontal
        />
        </ReactNativeZoomableView>
      {/* <View className="flex-1 relative">
      </View> */}
    </View>
  );
};

export default VerticalReader;
