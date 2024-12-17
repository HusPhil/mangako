import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { readMangaConfigData } from '../../services/Global';

const ChapterListItem = ({ 
  chapterTitle, currentPage, 
  publishedDate, finished, 
  onPress, onLongPress, 
  isListed, chapterData, 
  listMode, isSelected
 }) => {
  // const [currentPage, setCurrentPage] = useState(0);
    
  // // Function to fetch current page and reading status •
 

  // // Refresh data on focus
  // useFocusEffect(
  //   useCallback(() => {
  //     // Reset states to default before fetching
  //     getChapterCurrentPageList();

  //   }, [getChapterCurrentPageList, finished])
  // );

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
      className={`rounded-md my-1 ${isSelected && 'border border-accent'}`}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <View className={`p-2 rounded-md bg-secondary ${ finished && 'opacity-50'}`}>
        <Text numberOfLines={1} className="font-pregular text-white">
          {chapterTitle || 'Loading'}{' '}
        </Text>
        <Text className="font-pregular text-[10px] text-white opacity-50">{additionalInfo}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default ChapterListItem;
