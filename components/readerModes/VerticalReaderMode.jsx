import { FlatList, TouchableWithoutFeedback, View } from 'react-native';
import React, { useImperativeHandle, forwardRef, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ChapterPage from '../ChapterPage';
import { readMangaConfigData } from "../../app/screens/_mangaReader";

const ITEM_HEIGHT_ESTIMATE = 600;

const VerticalReaderMode = forwardRef(({ chapterUrls, onTap, currentManga, currentPageNum, onPageChange, initialNumToRender }, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [thisCurrentPageNum, setThisCurrentPageNum] = useState(currentPageNum);
  const [isDelayed, setIsDelayed] = useState(false);
  const [itemHeights, setItemHeights] = useState({});

  const flatRef = useRef(null);
  const isInteracted = useRef(false);
  const initialNum = useRef(currentPageNum);

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
    setIsLoading(currentViewableIndex !== initialNum.current && !isInteracted.current);
  }, []);

  const AsyncEffect = async () => {
    const lastSavePage = await readMangaConfigData(currentManga.manga, currentManga.chapter);
    setThisCurrentPageNum(lastSavePage.currentPage);
  };

  useEffect(() => {
    AsyncEffect();
  }, [onPageChange, thisCurrentPageNum]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDelayed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleLayout = (event, index) => {
    const { height } = event.nativeEvent.layout;
    setItemHeights((prevHeights) => ({
      ...prevHeights,
      [index]: height,
    }));
  };
  
  const getItemLayout = (data, index) => {
    const offset = Object.keys(itemHeights).reduce((acc, key) => {
      if (key < index) {
        return acc + itemHeights[key];
      }
      return acc;
    }, 0);
  
    return {
      length: itemHeights[index] || ITEM_HEIGHT_ESTIMATE,
      offset,
      index,
    };
  };
  
  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={() => onTap(index)}>
      <View onLayout={(event) => handleLayout(event, index)}>
        <ChapterPage pageUrl={item} pageNum={index} />
      </View>
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
    initialScrollIndex={thisCurrentPageNum}
    initialNumToRender={initialNumToRender}
    renderItem={renderItem}
    keyExtractor={(item) => item}
    onViewableItemsChanged={onViewableItemsChanged}
    onScrollToIndexFailed={onScrollToIndexFailed}
    onTouchMove={() => { isInteracted.current = true }}
    getItemLayout={getItemLayout}
    disableVirtualization
  />
);
});

export default VerticalReaderMode;
