import { View, Text, TouchableOpacity } from 'react-native'
import React, {useState, useCallback} from 'react'
import { router, useFocusEffect } from 'expo-router';

import { readMangaConfigData, CONFIG_READ_WRITE_MODE } from '../../services/Global';


const ChapterListItem = ({chapterTitle, chapterUrl, publishedDate, finished, handlePress}) => {
  const [currentPage, setCurrentPage] = useState(0)
  const [readingStatus, setReadingStatus] = useState(finished)


  return (
    <TouchableOpacity className={`bg-secondary p-2 rounded-md my-1 ${readingStatus && "opacity-50"}`} onPress={handlePress}>
      <Text numberOfLines={1} style={{ch: 5}} className="font-pregular text-white">{chapterTitle ? chapterTitle : "Loading"} </Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{publishedDate}</Text>
      <Text className="font-pregular text-[10px] text-white opacity-50">{currentPage > 0 && currentPage + 1}</Text>
    </TouchableOpacity>
  )
}

// const getChapterCurrentPageList = useCallback(async () => {
//   try {
//     const savedMangaConfigData = await readMangaConfigData(mangaUrl, CONFIG_READ_WRITE_MODE.MANGA_ONLY);

//     let retrievedReadingStatusList = {};

//     if (savedMangaConfigData?.manga?.readingStats) {
//       retrievedReadingStatusList = savedMangaConfigData.manga.readingStats;
//     }

//     console.log("retrievedReadingStatusList in ChapterList:", retrievedReadingStatusList);
//   } catch (error) {
//     console.error("Error fetching chapter current page list:", error);
//   }
// }, []);


export default ChapterListItem