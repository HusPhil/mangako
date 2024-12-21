import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

import { readMangaConfigData } from '../../services/Global';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const ChapterListItem = ({ 
  chapterTitle, currentPage, 
  publishedDate, finished, 
  onPress, onLongPress, 
  isListed, chapterData, 
  isDownloaded, isSelected
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

  const getAdditionalInfo = (currentPage, finished, publishedDate) => {
    if(currentPage > 0 && !finished) {
      return publishedDate + ` • Page ${currentPage + 1}`
    }

    if(finished) {
      return publishedDate + ` • √`
    }

    return publishedDate
  };

  const additionalInfo = getAdditionalInfo(currentPage, finished, publishedDate)

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
      <View className={`p-2 rounded-md bg-secondary ${ finished && 'opacity-50'} flex-row justify-between items-center`}>
        <View>
        <Text numberOfLines={1} className="font-pregular text-white">
          {chapterTitle || 'Loading'}{' '}
        </Text>
        <Text className="font-pregular text-[10px] text-white opacity-50">{additionalInfo}</Text>
        </View>
        <View className="pr-2">
          <MaterialIcons name={isDownloaded ? "file-download-done" : "file-download"} size={24} color="white" />
        </View>
        {/* { && (
        )} */}
      </View>
    </TouchableOpacity>
  );
};

export default ChapterListItem;
