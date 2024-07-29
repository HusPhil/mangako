import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Dimensions, PixelRatio, Button } from 'react-native';
import { debounce } from 'lodash';
import { FlashList } from '@shopify/flash-list';
import { ToastAndroid } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions } from './_reader';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

const VerticalReader = ({ currentManga, chapterPages, onTap, onPageChange, onScroll, currentPage, savedPageLayout, inverted }) => {
  const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));
  const [errorData, setErrorData] = useState(null);

  const {height: screenHeight, width: screenWidth} = Dimensions.get('screen')

  const pagesRef = useRef([]);
  const currentZoomLevel = useRef(1);
  const readerCurrentPage = useRef(currentPage)
  const readerCurrentViewportLocation = useRef({leftBound:0, rightBound:screenWidth})
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
      
      for (let pageNum = 0; pageNum < chapterPages.length; pageNum++) {
        await loadPageImages(chapterPages[pageNum], pageNum, signal);
      }
      

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

  const loadPageImages = async (pageUrl, pageNum, signal) => {
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
      }

    } catch (error) {
      console.log("Error loading pages:", error);
    }
  };

  const handleRetry = useCallback(async (pageNum) => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    await loadPageImages(pageNum, chapterPages[pageNum], signal);
  }, []);

  const getItemLayout = useCallback(
    (data, index) => ({
      length: (screenWidth),
      offset: (screenWidth / PixelRatio.get()) * index,
      index,
    }),
    []
  );

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if(viewableItems.length > 0) {
      const currentPageNum = viewableItems.slice(-1)[0].index;
      readerCurrentPage.current = currentPageNum;
      onPageChange(currentPageNum);
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
          break;
        case "next":
          targetIndex = inverted ? readerCurrentPage.current - 1 : readerCurrentPage.current + 1 
          break;
        default:
          break;
      }

      flashRef.current.scrollToIndex({index: targetIndex, animated: true})
    } 
  }, [])

  const handleEndReached = useCallback(() => {
    onPageChange(chapterPages.length - 1, {finished: true})
  }, [])
  
  const debouncedOnScroll = useCallback(debounce( (e) => {
    onScroll(e.nativeEvent.contentOffset.y)
  }, 500), []);

  const renderItem = useCallback(({ item, index }) => (
    <View className="h-full justify-center"
      pointerEvents='auto'
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
        pageLayout={savedPageLayout}
        onRetry={handleRetry}
        onTap={onTap}
        vertical
      />
    </View>
  ), []);

  const keyExtractor = useCallback((item, index) => {
    return ` ${item}-${index}`;
  }, []);

  return (
    <View className="h-full">
      <ReactNativeZoomableView
          ref={zoomRef}
          zoomStep={3}
          minZoom={1}
          maxZoom={3.5}
          onTransform={({zoomLevel}) => {
            currentZoomLevel.current = zoomLevel;
          }}
          onDoubleTapAfter={() => {
            if(currentZoomLevel.current > 1) {
              // zoomRef.current.zoomBy(-30);
              zoomRef.current.zoomTo(1);
              handleReaderNavigation({mode: 'prev'})
            }
          }}
          disablePanOnInitialZoom
          bindToBorders
          contentWidth={screenWidth}
          contentHeight={screenHeight}
          onShiftingEnd={(e1, e2, e3)=>{
            const scaledOffsetX = e3.offsetX * e3.zoomLevel
            const scaledOriginalWidth = e3.originalWidth / 2;
            console.log("scaledOffsetX:", scaledOffsetX, "scaledOriginalWidth:", scaledOriginalWidth / 2)
            
            if(Math.abs(e2.vx) > 0.5 ) {
              readerCurrentViewportLocation.current.leftBound += e2.dx
              readerCurrentViewportLocation.current.rightBound += e2.dx
            }
            
          }}
          onPanResponderTerminate={(e1, e2, e3) => {
            console.log(e2, e3)
          }}
          onPanResponderMove={(e1, e2, e3)=>{
            const scaledOffsetX = e3.offsetX * e3.zoomLevel
            const scaledOriginalWidth = e3.originalWidth * e3.zoomLevel;

            console.log("OnResPandermove was called\n",
            `dx: ${e2.dx}\n`,
            `dy: ${e2.dy}\n`,  
            `vx: ${e2.vx}\n`,
            `vy: ${e2.vy}\n`,
            `x0: ${e2.x0}\n`,
            `offsetX: ${e3.offsetX}, ${e2.x0 + e3.offsetX}\n`,
            `readerCurrentViewportLocation: ${readerCurrentViewportLocation.current.leftBound}, ${readerCurrentViewportLocation.current.rightBound}\n`,
            `y0: ${e2.y0}\n`,
            `moveX: ${e2.moveX}\n`,
            `viewPortX + originalWidth: ${(e3.originalWidth + e3.offsetX)}\n`,
            `**ANOTHERTEST**: ${Math.abs(e3.offsetX )+ (e3.zoomLevel * e3.originalWidth/2)}\n`,
            `screenWidth: ${screenWidth}\n`,
            `scaledOffsetX: ${scaledOffsetX}\n`,
            `offsetX, offset2X : ${e3.offsetX}, ${Math.abs(e3.offsetX * 2)}\n`,
            `moveX + dx: ${e2.moveX + Math.abs(e2.dx)}\n`,
            `x0 + dx: ${e2.x0 + Math.abs(e2.dx)}\n`,
          )



            
            if(Math.abs(scaledOffsetX) > Math.abs(scaledOriginalWidth / 2)) {
              if(scaledOffsetX < 0) {
                console.log("lumampas na sya sa right")
                // ToastAndroid.show(
                //   "lumampas na sya sa right",
                //   ToastAndroid.LONG
                // )
              } 
              else {
                console.log("lumampas na sya sa left")
                // ToastAndroid.show(
                //   "lumampas na sya sa left",
                //   ToastAndroid.LONG
                // )
              }
            }

            
          }}
          onSingleTap={(e1, e2,)=>{
            console.log("onSingleTap was called\n", "\n\noffsetX:", e2.offsetX, "\n\scaledOriginalWidth:", e2.originalWidth * e2.zoomLevel)
          }}
          onZoomEnd={()=>{ 
            // if(currentZoomLevel.current <= 1) {
            //   zoomRef.current.moveTo(0, 0);
            // }
            console.log("onZoomEnd was called")
          }}
        >
        <FlashList
          ref={flashRef}
          data={pageImages}
          initialScrollIndex={0}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={500}
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
