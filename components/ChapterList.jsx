import { View, Text, ActivityIndicator, Alert, RefreshControl, Button } from 'react-native';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';
import colors from '../constants/colors';
import ChapterListItem from './ChapterListItem';
import { getChapterList } from '../utils/MangakakalotClient';
import HorizontalRule from './HorizontalRule';

const ChapterList = ({ mangaLink, headerComponent }) => {
  const [chaptersData, setChaptersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false)
  const flashListref = useRef(null)

  const fetchData = async () => {
    try {
      const parentKey = shorthash.unique(mangaLink)
      const cachedChapterListPath = `${FileSystem.cacheDirectory}${parentKey}`
      const cachedChapterListFile = "chapterList.json"
      let chapterListData;

      console.log(parentKey)

      try {
        const dirInfo = await FileSystem.getInfoAsync(cachedChapterListPath);
        if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cachedChapterListPath, { intermediates: true });
        }
      } catch (error) {
          console.error(`Error creating directory ${cachedChapterListPath}:`, error);
          throw error;
      }

      const fileInfo = await FileSystem.getInfoAsync(cachedChapterListPath + cachedChapterListFile);

      if (fileInfo.exists) {
        const cachedChapterListData = await FileSystem.readAsStringAsync(cachedChapterListPath + cachedChapterListFile);
        chapterListData = JSON.parse(cachedChapterListData);
        } else {
        const requestedPageData = await getChapterList(mangaLink);
        chapterListData = requestedPageData;
        await FileSystem.writeAsStringAsync(cachedChapterListPath + cachedChapterListFile, JSON.stringify(chapterListData));
      }

      console.log(chapterListData[chapterListData.length - 1])
      setChaptersData(chapterListData);

    } catch (error) {
      setChaptersData([]);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [mangaLink]);

  const handleChapterPress = useCallback((item, index) => {
    router.push({
      pathname: "screens/mangaReader",
      params: {
        currentChapterData: JSON.stringify(item),
        mangaLink
      }
    });
  }, [chaptersData]);

  const renderItem = useCallback(({ item, index }) => (
    <View className="w-full px-2">
      <ChapterListItem
        currentManga={{manga: mangaLink, chapter: item.chapterUrl}}
        chTitle={item.chTitle}
        publishedDate={item.publishDate}
        handlePress={() => handleChapterPress(item, index)}
      />
    </View>
  ), [handleChapterPress]);

  const handleEndReached = () => {
    console.log("reached the end")
  } 

  const handleChapterRefresh = async () => {
    console.log("refresh chapters");
    try {
      setRefreshing(true);
      fetchData()
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setRefreshing(false);
    }
  };

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


  return (
    <View className="flex-1 h-[200px]">
      {isLoading ? (
        <ActivityIndicator color={colors.accent[100]} />
      ) : (
        <FlashList
          ref={flashListref}
          data={chaptersData}
          renderItem={renderItem}
          estimatedItemSize={100}
          onEndReached={handleEndReached}
          onEndReachedThreshold={2}
          ListEmptyComponent={<Text>No available chapters..</Text>}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleChapterRefresh} />
            }
            ListHeaderComponent={
              <View>
                {headerComponent}
                <Button title='scroll to bottom' onPress={handleScrollToEnd} />
              </View>
            }
            ListFooterComponent={<Button title='to top' onPress={handleScrollToTop} />}
          
        />
      )}
    </View>
  );
};

export default ChapterList;
