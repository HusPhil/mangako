import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { readMangaConfigData } from '../../services/Global';

const ChapterListItem = ({ chapterTitle, currentManga, publishedDate, finished, handlePress }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [readingStatus, setReadingStatus] = useState(finished);

  // Function to fetch current page and reading status
  const getChapterCurrentPageList = useCallback(async () => {
    try {
      const savedMangaConfigData = await readMangaConfigData(currentManga.manga, currentManga.chapter);

      if (savedMangaConfigData?.manga?.readingStats) {
        const retrievedReadingStatusList = savedMangaConfigData.manga.readingStats;
        const retrievedReadingStatus = retrievedReadingStatusList[currentManga.chapter]
          ? retrievedReadingStatusList[currentManga.chapter].finished
          : false;
        setReadingStatus(retrievedReadingStatus);
      }

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
      setCurrentPage(0);
      setReadingStatus(finished);

      getChapterCurrentPageList();
    }, [getChapterCurrentPageList, finished])
  );

  return (
    <TouchableOpacity
      className={`bg-secondary p-2 rounded-md my-1 ${readingStatus ? 'opacity-50' : ''}`}
      onPress={handlePress}
    >
      <Text numberOfLines={1} className="font-pregular text-white">
        {chapterTitle || 'Loading'}{' '}
      </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{publishedDate}</Text>
      {currentPage > 0 && (
        <Text className="font-pregular text-[10px] text-white opacity-50">{currentPage + 1}</Text>
      )}
    </TouchableOpacity>
  );
};

export default ChapterListItem;
