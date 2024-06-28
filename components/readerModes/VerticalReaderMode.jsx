import { FlatList, TouchableWithoutFeedback, View } from 'react-native';
import React, { useImperativeHandle, forwardRef, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ChapterPage from '../ChapterPage';
import { readMangaConfigData } from "../../app/screens/_mangaReader";


const VerticalReaderMode = forwardRef(({ chapterUrls, onTap, currentManga, onPageChange, initialNumToRender }, ref) => {
  const [isLoading, setIsLoading] = useState(true);

  const flatRef = useRef(null);
  const isInteracted = useRef(false);

  useImperativeHandle(ref, () => ({
    onReadmodeChange: () => {
      console.log("Read mode in ver");
    },
    retryFetch: () => {
      console.log("retrying to fetch");
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
    const lastSavePage = await readMangaConfigData(currentManga.manga, currentManga.chapter);
  };

  useEffect(() => {
    AsyncEffect();
  }, []);
  
  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={() => onTap(index)}>
        <ChapterPage pageUrl={item} pageNum={index} />
    </TouchableWithoutFeedback>
  ), [chapterUrls, onTap]);

  const onScrollToIndexFailed = (info) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      flatRef.current.scrollToIndex({ index: info.index, animated: true });
    });
  };

  const memoizedData = useMemo(() => chapterUrls, [chapterUrls]);

  
  return (
    <FlatList
      ref={flatRef}
      data={memoizedData}
      initialScrollIndex={0}
      initialNumToRender={initialNumToRender}
      renderItem={renderItem}
      keyExtractor={(item) => item}
      onViewableItemsChanged={onViewableItemsChanged}
      onScrollToIndexFailed={onScrollToIndexFailed}
      onTouchMove={() => { isInteracted.current = true }}
      disableVirtualization
    />
  );

});

export default VerticalReaderMode;
