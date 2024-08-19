import { View, Text, RefreshControl, TouchableOpacity, Vibration } from 'react-native';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { AntDesign } from '@expo/vector-icons';

import ChapterListItem from './ChapterListItem';
import { readMangaConfigData, CONFIG_READ_WRITE_MODE, saveMangaConfigData } from '../../services/Global';
import { CHAPTER_LIST_MODE, READ_MARK_MODE } from '../../app/screens/_manga_info';
import colors from '../../constants/colors';
import HorizontalRule from '../HorizontalRule';
import { slice } from 'cheerio/lib/api/traversing';

const ChapterList = ({ 
  mangaUrl, chaptersData, 
  headerComponent, listStyles, 
  onRefresh, isListed,
  onListModeChange, onChapterSelect
}) => {
  const [showBtnToBottom, setShowBtnToBottom] = useState(false)
  const [showBtnToTop, setShowBtnToTop] = useState(false)
  const [chapterList, setChapterList] = useState(chaptersData)
  
  const flashListref = useRef(null)
  const previousScrollY = useRef(0);
  const listModeRef = useRef(CHAPTER_LIST_MODE.SELECT_MODE)
  const readMarkModeRef = useRef(READ_MARK_MODE.MARK_AS_READ)
  const selectedChapters = useRef([])

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

    //indicate that the item was selected or deselected
    setChapterList(prev => {
      const newChapterList = [...prev]
      newChapterList[chapterData.index] = {
        ...newChapterList[chapterData.index],
        isSelected: newChapterList[chapterData.index].isSelected ? !newChapterList[chapterData.index].isSelected : true 
      }
      return newChapterList
    })

    // add or remove (if already selected)
    const chapterUrlToDataMap = new Map()
    selectedChapters.current.forEach((item) => {
      chapterUrlToDataMap.set(item.chapterUrl, item)
    })
    

    if(chapterUrlToDataMap.has(chapterData.chapterUrl)) {
      console.log("meron na")
      selectedChapters.current = selectedChapters.current.filter(
        item => item.chapterUrl !== chapterData.chapterUrl
      )
    }
    else {
      selectedChapters.current.push(chapterData)
    }

    if(selectedChapters.current.length < 1) {
      listModeRef.current = CHAPTER_LIST_MODE.SELECT_MODE
    }
    
    
  }, [])

  const handleLongPress = useCallback((chapterData) => {
    console.log("long press called in chapter list bago")

    console.log(chapterList[chapterData.index])

    readMarkModeRef.current = chapterList[chapterData.index]?.finished ?
      READ_MARK_MODE.MARK_AS_UNREAD : READ_MARK_MODE.MARK_AS_READ

    listModeRef.current = CHAPTER_LIST_MODE.MULTI_SELECT_MODE
    Vibration.vibrate(100)

    //indicate that the item was selected or deselected
    setChapterList(prev => {
      const newChapterList = [...prev]
      newChapterList[chapterData.index] = {
        ...newChapterList[chapterData.index],
        isSelected: newChapterList[chapterData.index].isSelected ? !newChapterList[chapterData.index].isSelected : true 
      }
      return newChapterList
    })

    // add or remove (if already selected)
    const chapterUrlToDataMap = new Map()
    selectedChapters.current.forEach((item) => {
      chapterUrlToDataMap.set(item.chapterUrl, item)
    })

    if(chapterUrlToDataMap.has(chapterData.chapterUrl)) {
      console.log("meron na")
      selectedChapters.current = selectedChapters.current.filter(
        item => item.chapterUrl !== chapterData.chapterUrl
      )
    }
    else {
      selectedChapters.current.push(chapterData)
    }    

    if(selectedChapters.current.length < 1) {
      listModeRef.current = CHAPTER_LIST_MODE.SELECT_MODE
    }

  }, [chaptersData, mangaUrl, chapterList])

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

  const switchToSelectMode = useCallback(() => {
    listModeRef.current = CHAPTER_LIST_MODE.SELECT_MODE;
    setChapterList(prev => prev.map((item) => {
      if (item.isSelected) {
        return {
          ...item,
          isSelected: false 
        }
      }
      return item
    }))
  }, [])

  const multiSelectModeClose = useCallback(() => {
     switchToSelectMode()
     selectedChapters.current = []
  }, [])

  const handleMarkAsRead = useCallback(async () => {
    switchToSelectMode()

    if(selectedChapters.current.length < 1) return

    const savedMangaConfigData = await readMangaConfigData(
      mangaUrl,
      CONFIG_READ_WRITE_MODE.MANGA_ONLY,
      isListed
    );
    
    let newReadingStats = {};

    if (savedMangaConfigData?.manga?.readingStats) {
      newReadingStats = savedMangaConfigData.manga.readingStats;
    }

    const chapterUrlToDataMap = new Map()
    
    selectedChapters.current.forEach(item => {
      newReadingStats[item.chapterUrl] = {
        finished: readMarkModeRef.current === READ_MARK_MODE.MARK_AS_READ
      }
      chapterUrlToDataMap.set(item.chapterUrl, item)
    })

    setChapterList(prev => prev.map(item => {
      if(chapterUrlToDataMap.has(item.chapterUrl)) {
        return {
          ...item,
          finished: readMarkModeRef.current === READ_MARK_MODE.MARK_AS_READ
        }
      }
      return item;
    }))

    await saveMangaConfigData(
      mangaUrl, 
      'N/A', 
      {readingStats: newReadingStats}, 
      isListed,
      CONFIG_READ_WRITE_MODE.MANGA_ONLY
    )

    selectedChapters.current = [];

  }, [chaptersData, mangaUrl, listModeRef.current])

  const handleSelectAll = useCallback(() => {
    //indicate that the item was selected or deselected
    setChapterList(prev => prev.map(item => (
      {...item, isSelected: true }
    )))
    selectedChapters.current = chapterList

  }, [chapterList])

  const handleSelectInverse = useCallback(() => {
    //indicate that the item was selected or deselected
    selectedChapters.current = []
    setChapterList(prev => prev.map(item => {
      if(!item.isSelected) {
        selectedChapters.current.push(item)
      }
      return {
        ...item, 
        isSelected: item.isSelected ? !item.isSelected : true  
      }

    }))

  }, [chapterList])
  
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
          estimatedItemSize={500}
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
      {listModeRef.current === CHAPTER_LIST_MODE.MULTI_SELECT_MODE && (
          <View className="bg-primary w-full py-1 px-1 justify-between absolute top-0"
            key={listModeRef.current}>
              <View className=" flex-row justify-start items-center my-2">
                <TouchableOpacity className="px-2 flex-row justify-center items-center" onPress={multiSelectModeClose}>
                    <View>
                      <MaterialIcons name="close" size={18} color={colors.accent.DEFAULT} />
                    </View> 
                    <Text className="text-white ml-2 font-pregular text-xs text-left">Close</Text>
                </TouchableOpacity>
                <TouchableOpacity className="px-2 flex-row justify-center items-center" onPress={handleSelectAll}>
                    <View>
                      <MaterialIcons name="select-all" size={18} color={colors.accent.DEFAULT} />
                    </View> 
                    <Text className="text-white ml-2 font-pregular text-xs text-left">Select all</Text>
                </TouchableOpacity>
                <TouchableOpacity className="px-2 flex-row justify-center items-center" onPress={handleSelectInverse}>
                    <View>
                      <MaterialCommunityIcons name="select-group" size={18} color={colors.accent.DEFAULT} />
                    </View> 
                    <Text className="text-white ml-2 font-pregular text-xs text-left">Select inverse</Text>
                </TouchableOpacity>
              </View>

              <HorizontalRule otherStyles={"mx-2"}/>

              <View className="flex-row flex-1 my-3">
                <TouchableOpacity className="flex-row justify-center items-center flex-1"
                  onPress={handleMarkAsRead} key={readMarkModeRef.current}>
                  <View>
                    <MaterialIcons name={readMarkModeRef.current  === READ_MARK_MODE.MARK_AS_READ ? "check-box" : "indeterminate-check-box"} size={24} color="white" />
                  </View> 
                  
                  <Text className="text-white ml-2 font-pregular text-xs text-left">
                    {readMarkModeRef.current === READ_MARK_MODE.MARK_AS_READ ? "Mark as read" : "Mark as unread"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity className="flex-row justify-center items-center flex-1">
                  <View>
                    <MaterialIcons name="file-download" size={24} color="white" />
                  </View> 
                  <Text className="text-white ml-2 font-pregular text-xs text-left">Download</Text>
                </TouchableOpacity>
              </View>

          </View>
        )}
    </View>
  );
};

export default ChapterList;
