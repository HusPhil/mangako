import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback, Dimensions, PixelRatio, Button } from 'react-native';
import { debounce, isEqual } from 'lodash';
import { FlashList } from '@shopify/flash-list';
import { ToastAndroid } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions, fetchPageDataAsPromise } from './_reader';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { downloadImage, getChapterPageImage } from '../../services/MangakakalotClient';
import { Image } from 'expo-image';

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
  const loadedPageImagesMap = useRef({});
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

  const handleCallBackTest = (progress) => {
    console.log("DOWNLOADPROGRESS:", progress)
  }

  const loadPageImages = useCallback(async (pageUrl, pageNum, signal) => {
    try {
      const currentPageUrl = chapterPages[pageNum]
      const prevPageUrl = pageNum - 1 >= 0 ? chapterPages[pageNum - 1] : null;
      const nextPageUrl = pageNum + 1 < chapterPages.length ? chapterPages[pageNum + 1] : null


      if(
        loadedPageImagesMap.current[nextPageUrl] &&
        loadedPageImagesMap.current[prevPageUrl] &&
        loadedPageImagesMap.current[currentPageUrl] 
      ) return


      const [nextPageImgSrc, prevPageImgSrc, currentPageImgSrc] = await Promise.all([
        nextPageUrl ? fetchPageData(currentManga.manga, currentManga.chapter, nextPageUrl, signal, handleCallBackTest) : null,
        prevPageUrl ? fetchPageData(currentManga.manga, currentManga.chapter, prevPageUrl, signal, handleCallBackTest) : null,
        currentPageUrl ? fetchPageData(currentManga.manga, currentManga.chapter, currentPageUrl, signal, handleCallBackTest) : null
      ])

      
      if (isMounted.current) {
        setPageImages((prev) => {
          let imgSrc;
          
          return prev.map((item, index) => {
            switch(index) {
              case pageNum + 1:
                imgSrc = nextPageImgSrc;
                loadedPageImagesMap.current[nextPageUrl] = imgSrc.data.imgUri;
                break;
              case pageNum - 1:
                imgSrc = prevPageImgSrc;
                loadedPageImagesMap.current[prevPageUrl] = imgSrc.data.imgUri;
                break;
              case pageNum:
                imgSrc = currentPageImgSrc;
                loadedPageImagesMap.current[currentPageUrl] = imgSrc.data.imgUri;
                break;
              default: 
                return item;
            }

            return {
              ...item,
              imgSize: imgSrc.data.imgSize,
              imgError: imgSrc.error,
              imgUri: imgSrc.data.imgUri,
            }
          });                  
        });

        
      console.log('DONE LOADING:', pageNum)
        
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

  const handleViewableItemsChanged = useCallback(async({ viewableItems }) => {
    controllerRef.current.abort()
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    if(viewableItems.length > 0) {
      const currentPageNum = viewableItems[0].index;
      readerCurrentPage.current = currentPageNum;
      const pageUrl = chapterPages[currentPageNum]

      onPageChange(currentPageNum)

      await loadPageImages(pageUrl, currentPageNum, signal)

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
      <Button title='jumpToIndex' onPress={async () => {
        await downloadImage(chapterPages[0])
      }}/>

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
          estimatedItemSize={screenWidth}
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

export default VerticalReader;