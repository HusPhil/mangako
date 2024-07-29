import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Dimensions, PixelRatio, Button } from 'react-native';
import { debounce } from 'lodash';
import { FlashList } from '@shopify/flash-list';
import { ToastAndroid } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions } from './_reader';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

const VerticalReader = ({ currentManga, chapterPages, onTap, onPageChange, onScroll, currentPage, savedPageLayout, inverted }) => {
  const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(null));
  const [panEnabled, setPanEnabled] = useState(false);
  const [errorData, setErrorData] = useState(null);

  const {height: screenHeight, width: screenWidth} = Dimensions.get('screen')

  const pagesRef = useRef([]);
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
        loadPageImages(pageUrl, pageNum, signal)
      })

      Promise.all(pageImagePromises)
      

    } catch (error) {
      setErrorData(error);
    }
  };

  useEffect(() => {
    AsyncEffect();

    return () => {
      isMounted.current = false;
      controllerRef.current.abort();
    };
  }, []);

  const loadPageImages = useCallback(async (pageUrl, pageNum, signal) => {
    try {
      const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
      if (fetchedImgSrc.error) {
        setPageImages(prev => {
          const newPageImages = [...prev];
          newPageImages[pageNum] = { imgUri: undefined, imgSize: null, error: fetchedImgSrc.error };
          return newPageImages;
        });
        throw fetchedImgSrc.error;
      }

      const imgSize = await getImageDimensions(fetchedImgSrc.data);
      if (isMounted.current) {
        setPageImages(prev => {
          const newPageImages = [...prev];
          newPageImages[pageNum] = { imgUri: fetchedImgSrc.data, imgSize };
          return newPageImages;
        });
        // console.log("page:", pageNum, "was loaded in verMode!")

        
        // if(pageNum === currentPage && !navigatedToCurrentPage.current) {
        //   // handleReaderNavigation({mode: "jump", jumpIndex: pageNum});
        // }

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
      const currentPageNum = viewableItems.slice(-1)[0].index;
      readerCurrentPage.current = currentPageNum;
      onPageChange(currentPageNum);
      // if(currentZoomLevel.current > 1) zoomRef.current.zoomTo(1)
      console.log(currentPageNum, currentPage)
      console.log("navigatedToCurrentPage.current:", navigatedToCurrentPage.current)

      if(currentPageNum !== currentPage && !navigatedToCurrentPage.current) {
        handleReaderNavigation({mode: "jump", jumpIndex: currentPage});
      }
      else {
        navigatedToCurrentPage.current = true
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

  const handleScroll = (e) => {
    e.persist(); // Persist the event
    debouncedOnScroll(e);
  };

  const handleReaderNavigation = useCallback((navigationMode) => {

    if(flashRef.current) {
      console.log("natawag ang navigation ng flashRef:", navigationMode)
      if(!navigationMode.mode) throw Error("No mentioned navigation mode.")
      let targetIndex;
      switch (navigationMode.mode) {
        case "prev":
          targetIndex = inverted ? readerCurrentPage.current + 1 : readerCurrentPage.current - 1 
          flashRef.current.scrollToIndex({index: targetIndex, animated: true})
          break;
        case "next":
          targetIndex = inverted ? readerCurrentPage.current - 1 : readerCurrentPage.current + 1 
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
        pageLayout={savedPageLayout}
        onRetry={handleRetry}
        onTap={onTap}
        vertical
      />
      <Button title='jumpToIndex' onPress={() => {
        handleReaderNavigation({mode: 'jump', jumpIndex: 20})
      }}/>
      <Button title='jumpToOffset' onPress={() => {
        handleReaderNavigation({mode: 'jumpToOffset', jumpOffset: screenWidth * 22})
      }}/>

    </View>
  ), []);

  const keyExtractor = useCallback((item, index) => {
    return ` ${item}-${index}`;
  }, []);

  const getItemLayout = useCallback(
    
    (data, index) => {
      return {
        length: (10),
        offset: (10) * index,
        index,
      }
    },
    []
  );
  const overrideItemLayout = (layout, item, index, maxColumns) => {
    // Custom logic for determining the span and size
   console.log("layout from override item layout:", layout)
  };

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
            currentZoomLevel.current = zoomLevel;
          }}
          onDoubleTapAfter={() => {
            if(currentZoomLevel.current > 1) {
              // zoomRef.current.zoomBy(-30);
              zoomRef.current.zoomTo(1);
              handleReaderNavigation({mode: 'prev'})
            }
          }}
          overrideItemLayout={overrideItemLayout}
          disablePanOnInitialZoom
          bindToBorders
          contentWidth={screenWidth}
          contentHeight={screenHeight}
          onShiftingEnd={(e1, e2, zoomableViewEvent)=>{
            const scaledOffsetX = zoomableViewEvent.offsetX * zoomableViewEvent.zoomLevel

            if((Math.abs(zoomableViewEvent.offsetX )+ screenWidth/4) > screenWidth/2 + 50) {
              if(scaledOffsetX < 0) {
                handleReaderNavigation({mode: "next"})
              } 
              else {
                handleReaderNavigation({mode: "prev"})
              }
              zoomRef.current.zoomTo(1)
            }

            
          }}
          onShouldBlockNativeResponder={(e1,e2,zoomableViewEvent)=>{
            console.log("zoomlevel sa block native respinder", zoomableViewEvent.zoomLevel)
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
