import { View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { AntDesign } from '@expo/vector-icons';

import ChapterListItem from './ChapterListItem';

import { readMangaConfigData, CONFIG_READ_WRITE_MODE } from '../../services/Global';

const CHAPTER_LIST_MODE = Object.freeze({
  SELECT_MODE: "SELECT_MODE",
  MULTI_SELECT_MODE: "MULTI_SELECT_MODE",
})

const ChapterList = ({ 
  mangaUrl, chaptersData, 
  headerComponent, listStyles, 
  onRefresh, isListed
}) => {
  const [showBtnToBottom, setShowBtnToBottom] = useState(false)
  const [showBtnToTop, setShowBtnToTop] = useState(false)
  const [chapterList, setChapterList] = useState(chaptersData)
  const [selectedChapters, setSelectedChapters] = useState([])

  
  const flashListref = useRef(null)
  const previousScrollY = useRef(0);
  const listModeRef = useRef(CHAPTER_LIST_MODE.SELECT_MODE)

  const handleScrollToTop = () => {
    const flashList = flashListref.current
    if(flashList) {
      flashList.scrollToOffset({ offset: 0, animated: true })
    }
  } 

  const handleScrollToEnd = () => {
    const flashList = flashListref.current
    if(flashList) {
      flashList.scrollToEnd({animated:true})
    }
  } 

  const handleChapterPress = useCallback((chapterData) => {
    
    if(listModeRef.current !== CHAPTER_LIST_MODE.MULTI_SELECT_MODE) {
      router.push({
        pathname: "screens/manga_reader",
        params: {
          currentChapterData: JSON.stringify(chapterData),
          currentChapterIndex: chapterData.index,
          isListedAsString: isListed,
          mangaUrl, 
        }
      });
      return
    }

    console.log(`${chapterData.chTitle} was selected!`)

    //indicate that the item was selected or deselected
    setChapterList(prev => prev.map((item, index) => {
      if (index === chapterData.index) {
        return {
          ...item,
          isSelected: item.isSelected ? !item.isSelected : true 
        }
      }
      return item
    }))

  }, [])

  const handleLongPress = useCallback((chapterData) => {
    console.log("long press called in chapter list")
    listModeRef.current = CHAPTER_LIST_MODE.MULTI_SELECT_MODE

    //indicate that the item was selected or deselected
    setChapterList(prev => prev.map((item, index) => {
      if (index === chapterData.index) {
        return {
          ...item,
          isSelected: item.isSelected ? !item.isSelected : true 
        }
      }
      return item
    }))

  }, [chaptersData, mangaUrl])

  const handleScroll = (event) => {
    const {
      nativeEvent: {
        contentOffset: { y },
        contentSize: { height: contentHeight },
        layoutMeasurement: { height: visibleHeight }
      }
    } = event;
  
    const isScrollingDown = previousScrollY.current < y;
    const isScrollingUp = previousScrollY.current > y;
  
    const upwardThreshold = contentHeight * 0.95;
    const downwardThreshold = contentHeight * 0.05;
    const midPoint = contentHeight * 0.50;
  
    if (y === 0) {
      setShowBtnToTop(false);
    } else if (y + visibleHeight >= contentHeight) {
      setShowBtnToBottom(false);
    } else if (isScrollingDown) {
      setShowBtnToTop(false);
      setShowBtnToBottom(y > downwardThreshold && y < midPoint);
    } else if (isScrollingUp) {
      setShowBtnToBottom(false);
      setShowBtnToTop(y < upwardThreshold && y > midPoint);
    }
  
    previousScrollY.current = y;
  };

  const getChapterCurrentPageList = useCallback(async () => {
    try {
      const savedMangaConfigData = await readMangaConfigData(mangaUrl, CONFIG_READ_WRITE_MODE.MANGA_ONLY, isListed);

      let retrievedReadingStatusList = {};

      if (savedMangaConfigData?.manga?.readingStats) {
        retrievedReadingStatusList = savedMangaConfigData.manga.readingStats;
      }

      setChapterList(prev => prev.map(item => {
        if(retrievedReadingStatusList[item.chapterUrl]) {
          return {
            ...item,
            ...retrievedReadingStatusList[item.chapterUrl]
          }
        }
        return item
      }))
      
    } catch (error) {
      console.error("Error fetching chapter current page list:", error);
    }
  }, []);

  const handleFetchReadingStatus = useCallback((chapterUrl, readingStatus) => {

    setChapterList(prev => prev.map(item => {
      if(item.chapterUrl === chapterUrl) {
        return {
          ...item,
          finished: readingStatus
        }
      }
      return item
    }))

  }, [])
  
  useFocusEffect(
    useCallback(() => {
      console.log("isListed", isListed)
      getChapterCurrentPageList()
    }, [])
  );

  
  const renderItem = useCallback(({ item, index }) => (
    <View className="w-full px-2">
      <ChapterListItem
        chapterData={{...item, index}}
        currentManga={{ manga: mangaUrl, chapter: item.chapterUrl }}
        chapterTitle={item.chTitle}
        publishedDate={item.publishDate}
        onPress={handleChapterPress}
        onLongPress={handleLongPress}
        finished={item.finished}
        onFetchReadingStatus={handleFetchReadingStatus}
        currentPage={index}
        isListed={isListed}
        isSelected={item.isSelected}
        listMode={item.listMode}
      />
    </View>
  ), [handleChapterPress, handleLongPress, mangaUrl, listModeRef.current]);

  const keyExtractor = useCallback((item, index) => {
    return ` ${item.chapterUrl}-${index}`;
  }, [chapterList]);

  return (
    <View className="flex-1">
      <View className="h-full relative">
        <FlashList
          ref={flashListref}
          data={chapterList}
          renderItem={renderItem}
          estimatedItemSize={200}
          contentContainerStyle={listStyles}
          ListEmptyComponent={
            <View className="flex-1 w-full my-5 justify-center items-center">
              <MaterialIcons name="not-interested" size={50} color="white" />
              <Text className="text-white font-pregular mt-2">No available chapters..</Text>
              <Text className="text-white font-pregular mt-2 text-center">Pull down to refresh.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {headerComponent}
            </View>
          }
          onScroll={handleScroll}
          keyExtractor={keyExtractor}
        />
      </View>
      {showBtnToBottom && (
        <TouchableOpacity className="absolute bottom-5 p-3 bg-primary rounded-xl self-center" onPress={handleScrollToEnd}>
          <AntDesign name="downcircle" size={24} color="white" />
        </TouchableOpacity>
      )}
      {showBtnToTop && (
        <TouchableOpacity className="absolute bottom-5 p-3 bg-primary rounded-xl self-center" onPress={handleScrollToTop}>
          <AntDesign name="upcircle" size={24} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ChapterList;
