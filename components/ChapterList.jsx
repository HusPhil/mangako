import { View, Text, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useCallback, useEffect } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../constants/colors';
import ChapterListItem from './ChapterListItem';
import { getChapterList } from '../utils/MangakakalotClient';
import shorthash from 'shorthash';

const ChapterList = ({ mangaLink }) => {
  const [chaptersData, setChaptersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const cacheKey = shorthash.unique(mangaLink+"[chapterList]")
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

  const handleChapterPress = useCallback((item) => {
    router.navigate({
      pathname: "screens/mangaReader",
      params: {
        chId: item.chapId,
        chapterUrl: item.chapterUrl,
        chNum: item.chNum,
      }
    });
  }, []);

  const renderItem = useCallback(({ item }) => (
    <View className="w-full px-2">
      <ChapterListItem chNum={item.chNum} publishedDate={item.publishDate} handlePress={() => handleChapterPress(item)} />
    </View>
  ), [handleChapterPress]);

  return (
    <View className="flex-1">
      {isLoading ? (
        <ActivityIndicator color={colors.accent[100]} />
      ) : (
        <FlashList
          data={chaptersData}
          renderItem={renderItem}
          estimatedItemSize={60}
          initialNumToRender={20} // Increase this value to render more items initially
          onEndReachedThreshold={0.1}
          ListEmptyComponent={<Text>No available chapters..</Text>}
        />
      )}
    </View>
  );
  
};

export default ChapterList;
