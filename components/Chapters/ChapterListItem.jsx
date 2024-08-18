import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { readMangaConfigData } from '../../services/Global';

const CHAPTER_LIST_MODE = Object.freeze({
  SELECT_MODE: "SELECT_MODE",
  MULTI_SELECT_MODE: "MULTI_SELECT_MODE",
})

const ChapterListItem = ({ 
  chapterTitle, currentManga, 
  publishedDate, finished, 
  onPress, onLongPress, 
  isListed, chapterData, 
  listMode, isSelected
 }) => {
  const [currentPage, setCurrentPage] = useState(0);
  // const [isSelected, setIsSelected] = useState(false)
  
  // Function to fetch current page and reading status •
  const getChapterCurrentPageList = useCallback(async () => {
    try {
      const savedMangaConfigData = await readMangaConfigData(currentManga.manga, currentManga.chapter, isListed);

      if (savedMangaConfigData?.chapter?.currentPage) { 
        const retrievedCurrentPage = savedMangaConfigData.chapter.currentPage;
        setCurrentPage(retrievedCurrentPage);
      }

    } catch (error) {
      console.error('Error fetching chapter current page list:', error);
    }
  }, [currentManga]);

  // Refresh data on focus
  useFocusEffect(
    useCallback(() => {
      // Reset states to default before fetching
      getChapterCurrentPageList();

    }, [getChapterCurrentPageList, finished])
  );

  const additionalInfo = (currentPage > 0 && !finished) 
    ? publishedDate + ` • Page ${currentPage + 1}` 
    : (finished ? publishedDate + ` • √` : publishedDate)

  const handlePress = useCallback(() => {    
    onPress(chapterData)
  }, [chapterData])

  const handleLongPress = useCallback(() => {
    onLongPress(chapterData)
  }, [chapterData])

  return (
    <TouchableOpacity
      className={`bg-secondary p-2 rounded-md my-1 ${ finished && 'opacity-50'} ${isSelected && 'border border-accent'}`}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <Text numberOfLines={1} className="font-pregular text-white">
        {chapterTitle || 'Loading'}{' '}
      </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{additionalInfo}</Text>
    </TouchableOpacity>
  );
};

export default ChapterListItem;
