import { BackHandler, FlatList, PixelRatio, TouchableWithoutFeedback, TouchableOpacity, View, Text} from 'react-native';
import React, { useImperativeHandle, forwardRef, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ChapterPage from '../ChapterPage';
import { readMangaConfigData } from "../../app/screens/_mangaReader";

import * as backend from "../../app/screens/_mangaReader"
import shorthash from 'shorthash';


const VerticalReaderMode = forwardRef(({ 
  chapterUrls, onTap, 
  currentManga, onPageChange,
  initialScrollIndex, 
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastPageReady, setLastPageReady] = useState(null)
  const [scrollOffset, setScrollOffset] = useState(0);

  const flatRef = useRef(null);
  const pagesRef = useRef([]);
  const pageLayout = useRef(Array(chapterUrls.length).fill(0))
  const isInteracted = useRef(false);
  const isOnLast = useRef(false);


  const onScroll =  async (event) => {
    const offset = event.nativeEvent.contentOffset.y;
    await backend.saveMangaConfigData( currentManga.manga, currentManga.chapter, {offsetY: offset})
    setScrollOffset(offset);
  };


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
    console.log(initialScrollIndex)
    const existingPageLayout = await backend.readItemLayout(currentManga.manga, currentManga.chapter)
    const savedConfig = await backend.readMangaConfigData(currentManga.manga, currentManga.chapter)

    pageLayout.current = existingPageLayout ? existingPageLayout : []

    console.log("savedoffset:", savedConfig)
    setScrollOffset(savedConfig ? savedConfig.offsetY : 0)
    if(flatRef.current) {

    }
    
    setTimeout(() => {
      setIsLoading(false)
      
      
    }, 500);


    
  };

  useEffect(() => {
    AsyncEffect();
  }, []);

  const precomputedOffsets = pageLayout.current.reduce((acc, height, index) => {
    acc.push(index === 0 ? 0 : acc[index - 1] + pageLayout.current[index - 1]);
    return acc;
  }, []);
  
  const getItemLayout = (data, index) => ({
    length: pageLayout.current[index],
    offset: precomputedOffsets[index],
    index,
  });
  
  const renderItem = useCallback(({ item, index }) => (
    <TouchableWithoutFeedback onPress={() => onTap()}>
      <View>
        <ChapterPage ref={(page) => { pagesRef.current[index] = page; }} pageUrl={item} pageNum={index} 
          // initialScrollIndex={initialScrollIndex}
          pageLayout={pageLayout.current}
          onLoad={ async(pageNum, pageHeight) => {
            pageLayout.current[pageNum] = pageHeight
            await backend.saveItemLayout(currentManga.manga, currentManga.chapter, chapterUrls, pageLayout.current);
          }}
          pushNotif={(data)=>{
            console.log("nataway:", data)
            setLastPageReady(data)
          }}
          currentManga={{...currentManga, chapterUrls}}
        />
      </View>
    </TouchableWithoutFeedback>
  ), [chapterUrls, onTap]);

  const memoizedData = useMemo(() => chapterUrls, [chapterUrls]);
  
  return (
    <View >
      {!isLoading && (
    <View className="h-full w-full relative">
        <FlatList
        ref={flatRef}
        data={memoizedData}
        renderItem={renderItem}
        initialScrollIndex={initialScrollIndex}
        keyExtractor={(item) => { return shorthash.unique(item)}}
        onViewableItemsChanged={onViewableItemsChanged}
        onTouchMove={() => { isInteracted.current = true }}
        onScrollToIndexFailed={()=>{}}
        onContentSizeChange={(w, h) => {
          console.log("height:", h)
          if(h > scrollOffset && !isOnLast.current) {
            flatRef.current.scrollToOffset({ offset: scrollOffset, animated: true });
            isOnLast.current = true
          }
        }}
        onScroll={onScroll}
        removeClippedSubviews
        windowSize={20}
        maxToRenderPerBatch={15}
        disableVirtualization
      />
      {/* {lastPageReady && flatRef.current && (
        <TouchableOpacity 
          onPress={() => {
            flatRef.current.scrollToOffset({ offset: backend.scrollToOffsetByIndex(lastPageReady.pageNum, pageLayout.current), animated: true });
            setLastPageReady(null)
          }}
        >

        <View className="p-3 rounded-xl absolute self-center bottom-10 bg-primary opacity-75">

          <Text className="text-white font-pregular">Last viewed: {lastPageReady.pageNum}</Text>
        </View>
        </TouchableOpacity>
      )} */}
      </View>
      )}
    </View>
  );

});

export default VerticalReaderMode;
