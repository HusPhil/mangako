import { BackHandler, FlatList, PixelRatio, TouchableWithoutFeedback, View, } from 'react-native';
import React, { useImperativeHandle, forwardRef, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ChapterPage from '../ChapterPage';
import { readMangaConfigData } from "../../app/screens/_mangaReader";

import * as backend from "../../app/screens/_mangaReader"


const VerticalReaderMode = forwardRef(({ 
  chapterUrls, onTap, 
  currentManga, onPageChange,
  initialScrollIndex, 
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);

  const flatRef = useRef(null);
  const pagesRef = useRef([]);
  const pageLayout = useRef(Array(chapterUrls.length).fill(0))
  const isInteracted = useRef(false);

  useImperativeHandle(ref, () => ({
    onReadmodeChange: () => {
      console.log("Read mode in ver");
    },
    retryFetch: () => {
      console.log("retrying to fetch page:", pagesRef.current[initialScrollIndex].getPageNum());
    }
  }));

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    let currentViewableIndex;
    if (viewableItems.length > 0) {
      currentViewableIndex = viewableItems[viewableItems.length - 1].index;
      onPageChange(currentViewableIndex);
      backend.saveItemLayout(currentManga.manga, currentManga.chapter, chapterUrls, pageLayout.current)
    }

  }, []);

  const AsyncEffect = async () => {
    setIsLoading(true)
    const existingPageLayout = await backend.readItemLayout(currentManga.manga, currentManga.chapter)

    console.log(existingPageLayout)
    pageLayout.current = existingPageLayout ? existingPageLayout : []

    
    setIsLoading(false)

    setTimeout(() => {
      flatRef.current.scrollToIndex({ index: 1, animated: true });
    }, 1000);
    
  };

  useEffect(() => {
    AsyncEffect();
  }, []);
  
  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={() => onTap()}>
      <View>
        <ChapterPage ref={(page) => { pagesRef.current[index] = page; }} pageUrl={item} pageNum={index} 
          initialScrollIndex={initialScrollIndex}
          onLoad={(pageNum, pageHeight) => {
            pageLayout.current[pageNum] = pageHeight 
          }}
        />
      </View>
    </TouchableWithoutFeedback>
  ), [chapterUrls, onTap]);


  const precomputedOffsets = pageLayout.current.reduce((acc, height, index) => {
    acc.push(index === 0 ? 0 : acc[index - 1] + pageLayout.current[index - 1]);
    return acc;
  }, []);
  
  const getItemLayout = (data, index) => ({
    length: pageLayout.current[index],
    offset: precomputedOffsets[index],
    index,
  });


  const memoizedData = useMemo(() => chapterUrls, [chapterUrls]);
  
  return (
    <View className="h-full w-full relative">
      {!isLoading && (
        <FlatList
        ref={flatRef}
        data={memoizedData}
        renderItem={renderItem}
        initialNumToRender={initialScrollIndex + 1}
        // getItemLayout={getItemLayout}
        keyExtractor={(item) => item}
        onViewableItemsChanged={onViewableItemsChanged}
        onTouchMove={() => { isInteracted.current = true }}
        disableVirtualization
      />
      )}
    </View>
  );

});

export default VerticalReaderMode;
