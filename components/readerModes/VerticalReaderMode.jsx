import { BackHandler, FlatList, TouchableWithoutFeedback, View, } from 'react-native';
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
  const pageLayout = useRef([])
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
    }

  }, []);

  const AsyncEffect = async () => {
    setIsLoading(true)
    const existingPageLayout = await backend.
  };

  useEffect(() => {
    AsyncEffect();
  }, []);
  
  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={() => onTap()}>
      <View>
        <ChapterPage ref={(page) => { pagesRef.current[index] = page; }} pageUrl={item} pageNum={index} 
          initialScrollIndex={initialScrollIndex}
          onLoad={(index) => {scrollToLast(index)}}
        />
      </View>
    </TouchableWithoutFeedback>
  ), [chapterUrls, onTap]);

  const memoizedData = useMemo(() => chapterUrls, [chapterUrls]);
  
  return (
    <View className="h-full w-full relative">
      <FlatList
        ref={flatRef}
        data={memoizedData}
        renderItem={renderItem}
        initialNumToRender={initialScrollIndex + 1}
        keyExtractor={(item) => item}
        onViewableItemsChanged={onViewableItemsChanged}
        onTouchMove={() => { isInteracted.current = true }}
        disableVirtualization
      />
    </View>
  );

});

export default VerticalReaderMode;
