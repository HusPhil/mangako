import { BackHandler, FlatList, PixelRatio, TouchableWithoutFeedback, TouchableOpacity, View, Text} from 'react-native';
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
  const [lastPageReady, setLastPageReady] = useState(null)

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
    }

  }, []);

  const AsyncEffect = async () => {
    setIsLoading(true)
    const existingPageLayout = await backend.readItemLayout(currentManga.manga, currentManga.chapter)

    console.log("existingPageLayout:", existingPageLayout)
    pageLayout.current = existingPageLayout ? existingPageLayout : []

    
    setIsLoading(false)

    setTimeout(() => {
      
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
          initialScrollIndex={initialScrollIndex}
          pageLayout={pageLayout.current}
          onLoad={ async(pageNum, pageHeight) => {
            pageLayout.current[pageNum] = pageHeight
            await backend.saveItemLayout(currentManga.manga, currentManga.chapter, chapterUrls, pageLayout.current);
          }}
          pushNotif={(data)=>{
            setLastPageReady(data)
          }}
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
        initialNumToRender={90 + 1}
        // initialScrollIndex={90}
        keyExtractor={(item) => item}
        onViewableItemsChanged={onViewableItemsChanged}
        onTouchMove={() => { isInteracted.current = true }}
        // onScroll={(e) => {console.log(e)}}
        getItemLayout={getItemLayout}
        disableVirtualization
      />
      {lastPageReady && (
        <TouchableOpacity 
          onPress={() => {
            flatRef.current.scrollToOffset({ offset: backend.scrollToOffsetByIndex(lastPageReady.pageNum, pageLayout.current), animated: true });
          }}
        >

        <View className="p-3 rounded-xl absolute self-center bottom-10 bg-black-100 opacity-50">

          <Text className="text-white font-pregular">Go to {lastPageReady.pageNum}</Text>
        </View>
        </TouchableOpacity>
      )}
      </View>
      )}
    </View>
  );

});

export default VerticalReaderMode;
