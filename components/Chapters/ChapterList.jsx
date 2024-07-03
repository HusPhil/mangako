import { View, Text, ActivityIndicator, Alert, RefreshControl, Button, TouchableOpacity } from 'react-native';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import colors from '../../constants/colors';
import ChapterListItem from './ChapterListItem';
import { MaterialIcons } from '@expo/vector-icons';

const ChapterList = ({ mangaUrl, chaptersData, headerComponent, listStyles, onRefresh }) => {
  const [showBtnToBottom, setShowBtnToBottom] = useState(false)
  const [showBtnToTop, setShowBtnToTop] = useState(false)

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
        layoutMeasurement: { height: visibleHeight }
      }
    } = event;
  
    const isScrollingDown = previousScrollY.current < y;
    const isScrollingUp = previousScrollY.current > y;
  
    const upwardThreshold = contentHeight * 0.95;
    const downwardThreshold = contentHeight * 0.05;
    const midPoint = contentHeight * 0.50;
  
    if (y === 0) {
      setShowBtnToTop(false);
    } else if (y + visibleHeight >= contentHeight) {
      setShowBtnToBottom(false);
    } else if (isScrollingDown) {
      setShowBtnToTop(false);
      setShowBtnToBottom(y > downwardThreshold && y < midPoint);
    } else if (isScrollingUp) {
      setShowBtnToBottom(false);
      setShowBtnToTop(y < upwardThreshold && y > midPoint);
    }
  
    previousScrollY.current = y;
  };

  return (
    <View className="flex-1">
      <View className="h-full relative">
        <FlashList
          ref={flashListref}
          data={chaptersData}
          renderItem={renderItem}
          estimatedItemSize={200}
          contentContainerStyle={listStyles}
          ListEmptyComponent={
            <View className="flex-1 w-full my-5 justify-center items-center">
              <MaterialIcons name="not-interested" size={50} color="white" />
              <Text className="text-white font-pregular mt-2">No available chapters..</Text>
              <Text className="text-white font-pregular mt-2 text-center">Pull down to refresh.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View>
              {headerComponent}
            </View>
          }
          onScroll={handleScroll}
        />
      </View>
      {showBtnToBottom && (
        <TouchableOpacity className="absolute bottom-5 p-3 bg-accent-100 rounded-xl self-center" onPress={handleScrollToEnd}>
          <Text className="font-pregular text-white">Scroll To Bottom</Text>
        </TouchableOpacity>
      )}
      {showBtnToTop && (
        <TouchableOpacity className="absolute bottom-5 p-3 bg-accent-100 rounded-xl self-center" onPress={handleScrollToTop}>
          <Text className="font-pregular text-white">Scroll To Top</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ChapterList;