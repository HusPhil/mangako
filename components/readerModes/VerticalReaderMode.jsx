import { FlatList, TouchableWithoutFeedback, View, Text, TouchableOpacity } from 'react-native';
import React, { useImperativeHandle, forwardRef, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import ChapterPage from '../ChapterPage';
import { readMangaConfigData } from "../../app/screens/_mangaReader";


const VerticalReaderMode = forwardRef(({ 
  chapterUrls, onTap, 
  currentManga, onPageChange,
  initialScrollIndex, 
}, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [initialIndex, setInitialIndex] = useState(0)
  const [initialPageloaded, setInitialPageLoaded] = useState(null)

  const flatRef = useRef(null);
  const pagesRef = useRef([]);
  const isInteracted = useRef(false);
  const thisCurrentPage = useRef(0);

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
      thisCurrentPage.current = currentViewableIndex
      setIsLoading(initialIndex !== currentViewableIndex)
    }

  }, []);

  const scrollToLast = (index) => {
    console.log("loaded:", index)
    if(index === initialScrollIndex) {
      setInitialPageLoaded({index, loaded: true})
    }
  }

  const AsyncEffect = async () => {
    setIsLoading(true)
    const lastSavePage = await readMangaConfigData(currentManga.manga, currentManga.chapter);
    console.log(lastSavePage)
    setInitialIndex(lastSavePage ? lastSavePage.currentPage : 0)
    
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

  const onScrollToIndexFailed = (info) => {
    const wait = new Promise(resolve => setTimeout(resolve, 100));
    wait.then(() => {
    });
  };

  const memoizedData = useMemo(() => chapterUrls, [chapterUrls]);
  
  return (
    <View>
      <View className="h-full w-full relative">
      <FlatList
      // pointerEvents={isLoading ? 'none' : 'auto'}
      ref={flatRef}
      data={memoizedData}
      extraData={initialIndex}
      initialNumToRender={initialScrollIndex + 1}
      renderItem={renderItem}
      keyExtractor={(item) => item}
      onViewableItemsChanged={onViewableItemsChanged}
      onScrollToIndexFailed={onScrollToIndexFailed}
      onTouchMove={() => { isInteracted.current = true }}
      // contentContainerStyle={isLoading ? {opacity: 0.2} : {opacity: 1}}
      disableVirtualization
    />
      </View>
      {initialPageloaded && 
      
      <TouchableOpacity onPress={()=>{
        flatRef.current.scrollToIndex({index: initialPageloaded.index, animated: true})
        setInitialPageLoaded(null)
        }}>
      <View className="absolute self-center bg-black-200 bottom-10 p-2  rounded-lg" >
      <Text className="font-pregular text-white">Pick up where you left off</Text>
      </View>
    </TouchableOpacity>
      }
    
    </View>
  );

});

export default VerticalReaderMode;
