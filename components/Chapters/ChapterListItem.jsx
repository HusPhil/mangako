import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { readMangaConfigData } from '../../services/Global';

const ChapterListItem = ({ chapterTitle, currentManga, publishedDate, finished, handlePress, isListed }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Function to fetch current page and reading status •
  const getChapterCurrentPageList = useCallback(async () => {
    try {
      const savedMangaConfigData = await readMangaConfigData(currentManga.manga, currentManga.chapter, isListed);

      if (savedMangaConfigData?.chapter?.currentPage) { 
        const retrievedCurrentPage = savedMangaConfigData.chapter.currentPage;
        console.log("retrievedCurrentPage", retrievedCurrentPage)
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

  return (
    <TouchableOpacity
      className={`bg-secondary p-2 rounded-md my-1 ${ finished ? 'opacity-50' : ''}`}
      onPress={handlePress}
    >
      <Text numberOfLines={1} className="font-pregular text-white">
        {chapterTitle || 'Loading'}{' '}
      </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{additionalInfo}</Text>
    </TouchableOpacity>
  );
};

export default ChapterListItem;
