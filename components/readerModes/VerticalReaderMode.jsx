import { FlatList, TouchableWithoutFeedback, View, Dimensions } from 'react-native';
import React, { useImperativeHandle, forwardRef, useCallback, useEffect, useRef } from 'react';
import ChapterPage from '../ChapterPage';
import { PixelRatio } from 'react-native';

const ITEM_HEIGHT = 600; // Adjust this value based on your item height

const VerticalReaderMode = forwardRef(({ chapterUrls, onTap, onPageChange, initialPageNum }, ref) => {
  const flatRef = useRef(null);
  const pageHeights = useRef(Array(chapterUrls.length).fill(Dimensions.get('screen').height))

  useImperativeHandle(ref, () => ({
    onReadmodeChange: () => {
      console.log("Read mode in ver");
    },
    retryFetch: () => {
      console.log("retrying to fetch");
    }
  }));

  const onLoadPage = (pageNum, height) => {
    pageHeights.current[pageNum] = height
    console.log("pageNum:", pageNum, "height:", pageHeights.current[pageNum])
  }

  const calculateOffsetY = (pageNum) => {
    let result = 0
    pageHeights.current.slice(0, pageNum).forEach((height) => {
      result += height
    })
    // console.log(result)
    return result
  }

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    console.log(pageHeights.current)
    if (viewableItems.length > 0) {
      const currentViewableIndex = viewableItems[0].index;
      onPageChange(currentViewableIndex);
    }
  }, [onPageChange]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // percentage of item that must be visible to be considered viewable
  };

  useEffect(() => {
    if (flatRef.current && initialPageNum !== null && initialPageNum !== undefined) {
      // flatRef.current.scrollToIndex({ animated: true, index: 1 });
      console.log("offseY:", calculateOffsetY(initialPageNum))
      flatRef.current.scrollToOffset({ animated: true, offset: ((calculateOffsetY(initialPageNum))/PixelRatio.get())  });
    }
  }, [pageHeights]);

  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={() => onTap(index)}>
      <View>
        <ChapterPage pageUrl={item} pageNum={index} onLoadPage={onLoadPage}/>
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

  return (
    <FlatList
      ref={flatRef}
      disableIntervalMomentum
      disableVirtualization
      data={chapterUrls}
      renderItem={renderItem}
      keyExtractor={(item) => item}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      getItemLayout={getItemLayout}
      onScrollToIndexFailed={onScrollToIndexFailed}
    />
  );
});

export default VerticalReaderMode;
