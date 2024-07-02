import { View, Text, ActivityIndicator, Alert, RefreshControl, Button } from 'react-native';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import colors from '../../constants/colors';
import ChapterListItem from './ChapterListItem';
import { MaterialIcons } from '@expo/vector-icons';

const ChapterList = ({ mangaUrl, chaptersData, headerComponent }) => {

  const flashListref = useRef(null)
  const previousScrollY = useRef(0);

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

  const handleChapterPress = useCallback((item, index) => {
    router.push({
      pathname: "screens/mangaReader",
      params: {
        currentChapterData: JSON.stringify(item),
        mangaUrl
      }
    });
  }, [chaptersData]);
  
  const renderItem = useCallback(({ item, index }) => (
    <View className="w-full px-2">
      <ChapterListItem
        currentManga={{manga: mangaUrl, chapter: item.chapterUrl}}
        chTitle={item.chTitle}
        publishedDate={item.publishDate}
        handlePress={() => handleChapterPress(item, index)}
      />
    </View>
  ), [handleChapterPress]);

  const handleScroll = (event) => {
    const {
      nativeEvent: {
        contentOffset: { y },
        contentSize: { height: contentHeight },
      },
    } = event;

    const upwardThreshold = contentHeight * 0.90;
    const downwardThreshold = contentHeight * 0.10;

    if (previousScrollY.current < y && y >= downwardThreshold) {
      console.log('Scrolled downwards and reached 85% of the content height!');
    }

    if (previousScrollY.current > y && y <= upwardThreshold) {
      console.log('Scrolled upwards and reached 15% of the content height from the top!');
    }

    previousScrollY.current = y;
  };

  return (
    <View className="flex-1 h-[200px]">
       <FlashList
          ref={flashListref}
          data={chaptersData}
          renderItem={renderItem}
          estimatedItemSize={200}
          ListEmptyComponent={
            <View className="flex-1 w-full my-5 justify-center items-center">
              <MaterialIcons name="not-interested" size={50} color="white" />
              <Text className="text-white font-pregular mt-2">No available chapters..</Text>
              <Text className="text-white font-pregular mt-2 text-center">Pull down to refresh.</Text>
            </View>
        }
          // refreshControl={
          //   <RefreshControl refreshing={} onRefresh={()=>{}} />
          // }
          ListHeaderComponent={
            <View>
              {headerComponent}
              <Button title='scroll to bottom' onPress={handleScrollToEnd} />
            </View>
          }
          ListFooterComponent={<Button title='to top' onPress={handleScrollToTop} />}
          onScroll={handleScroll}
        />
    </View>
  );
};

export default ChapterList;