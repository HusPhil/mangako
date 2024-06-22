import { View, Text, ActivityIndicator, Alert, RefreshControl, Button } from 'react-native';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
      const cacheKey = shorthash.unique(mangaLink + "[chapterList]");
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData !== null) {
        setChaptersData(JSON.parse(cachedData));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const chData = await getChapterList(mangaLink);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(chData));
      setChaptersData(chData);
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
        chId: item.chapId,
        chapterUrl: item.chapterUrl,
        chTitle: item.chTitle,
      }
    });
  }, [chaptersData]);

  const renderItem = useCallback(({ item, index }) => (
    <View className="w-full px-2">
      <ChapterListItem
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
      const cacheKey = shorthash.unique(mangaLink + "[chapterList]");
      await AsyncStorage.removeItem(cacheKey);

      const chData = await getChapterList(mangaLink);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(chData));
      setChaptersData(chData);
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
