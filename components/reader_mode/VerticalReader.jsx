import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';
import { debounce } from 'lodash';
import { FlashList } from '@shopify/flash-list';
import ChapterPage from '../chapters/ChapterPage';
import { savePageLayout, readPageLayout, scrollToPageNum, fetchPageData, getImageDimensions } from './_reader';

const VerticalReader = ({ currentManga, chapterPages, onTap, onPageChange, onScroll, currentPage, savedPageLayout, savedScrollOffsetY }) => {
  const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));
  const [errorData, setErrorData] = useState(null);

  const pagesRef = useRef([]);
  const isMounted = useRef(true);
  const controllerRef = useRef(new AbortController());
  const flashRef = useRef(null);
  const pageLayout = useRef(Array(chapterPages.length).fill(-1));

  const AsyncEffect = async () => {

    pageLayout.current = savedPageLayout;
    console.log("savedScrollOffsetY:", savedScrollOffsetY)

    if(flashRef.current) flashRef.current.scrollToOffset({animated: true, offset: savedScrollOffsetY})

    if (!isMounted.current) return;

    try {
      controllerRef.current = new AbortController();
      const signal = controllerRef.current.signal;
      const pageDataPromises = chapterPages.map((pageUrl, index) => 
        loadPageImages(index, pageUrl, signal)
      );
      
      await Promise.allSettled(pageDataPromises);
      

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

  const loadPageImages = async (pageNum, pageUrl, signal) => {
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
      }

      handlePageLoad(pageNum, imgSize)
    } catch (error) {
      console.log("Error loading pages:", error);
    }
  };

  const handleRetry = useCallback(async (pageNum) => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    await loadPageImages(pageNum, chapterPages[pageNum], signal);
  }, []);

  const getItemLayout = (savedPageLayout, index) => {
    if(savePageLayout.length !== chapterPages.length) return 0
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += savedPageLayout[i].height;
    }
    return { length: savedPageLayout[index].height, offset, index };
  };

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if(viewableItems.length > 0) {
      onPageChange(viewableItems.slice(-1)[0].index)
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
  
  const debouncedOnScroll = useCallback(debounce( (e) => {
    onScroll(e.nativeEvent.contentOffset.y)
  }, 500), []);

  const renderItem = useCallback(({ item, index }) => (
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
  ), []);

  return (
    <View className="h-full">
      <View className="flex-1 relative">
        <FlashList
          ref={flashRef}
          data={pageImages}
          // initialScrollIndex={currentPage}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          onScroll={handleScroll}
          keyExtractor={(item, index) => index.toString()}
          estimatedItemSize={500}
          onViewableItemsChanged={handleViewableItemsChanged}
        />
      </View>
    </View>
  );
};

export default VerticalReader;
