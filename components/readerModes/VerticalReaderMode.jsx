import { FlatList, TouchableWithoutFeedback, View, Dimensions, StatusBar } from 'react-native';
import React, { useImperativeHandle, forwardRef, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ChapterPage from '../ChapterPage';
import { PixelRatio } from 'react-native';

const ITEM_HEIGHT = 600; // Adjust this value based on your item height

const VerticalReaderMode = forwardRef(({ chapterUrls, onTap, currentPageNum, onPageChange  }, ref) => {
  const [isLoading, setiIsLoading] = useState(true)
  const thisCurrentPageNum = useRef(currentPageNum)
  
  const flatRef = useRef(null);
  const isInteracted = useRef(false)
  const initialNum = useRef(chapterUrls.length-1 -5)
  

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
      currentViewableIndex = viewableItems[0].index;
      onPageChange(currentViewableIndex)
    }
    console.log("kineme:", currentViewableIndex,  initialNum.current)
    setiIsLoading(currentViewableIndex !== initialNum.current && !isInteracted.current)
  }, []);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // percentage of item that must be visible to be considered viewable
  };

  useEffect(() => {
    if (flatRef.current && currentPageNum !== null && currentPageNum !== undefined && !isInteracted.current) {
      flatRef.current.scrollToIndex({ animated: true, index: initialNum.current });
    }
  }, [onPageChange]);

  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={() => onTap(index)}>
      <View>
        <ChapterPage pageUrl={item} pageNum={index}/>
      </View>
    </TouchableWithoutFeedback>
  ), [chapterUrls, onTap]);

  const getItemLayout = (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

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
      disableIntervalMomentum
      disableVirtualization
      data={memoizedData}
      initialNumToRender={initialNum.current + 1}
      renderItem={renderItem}
      keyExtractor={(item) => item}
      onViewableItemsChanged={onViewableItemsChanged}
      onScrollToIndexFailed={onScrollToIndexFailed}
      onTouchMove={()=>{isInteracted.current = true}}
      contentContainerStyle={isLoading ? {opacity: 0} : {opacity: 1}}
    />
  );
});

export default VerticalReaderMode;
