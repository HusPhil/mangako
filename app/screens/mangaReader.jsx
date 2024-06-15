import { View, Text, ActivityIndicator, Alert, Dimensions, Button, TouchableWithoutFeedback, StatusBar, ScrollView } from 'react-native';
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import ModalPopup from '../../components/ModalPopup';
import ChapterPage from '../../components/ChapterPage';
import colors from '../../constants/colors';
import { getChapterImageUrls } from '../../utils/MangakakalotClient';
import {VerticalReaderMode, HorizontalReaderMode} from '../../components/readerModes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const MangaReaderScreen = () => {
  const { chapterUrl, chData } = useLocalSearchParams();
  const chapterData = JSON.parse(chData).map(chapter => chapter.chapterUrl);

  const [isLoading, setIsLoading] = useState(true);
  const [chapterUrls, setChapterUrls] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [cachedImageUris, setCachedImageUris] = useState([]);
  const [currentChapterUrl, setCurrentChapterUrl] = useState(chapterUrl);

  const isMounted = useRef(true);
  const scrollViewRef = useRef(null);

  const fetchData = useCallback(async (url) => {
    try {
      const cacheKey = shorthash.unique(url);
      const cachedChapterPageUris = `${FileSystem.cacheDirectory}${cacheKey}`;
      let pageUrls = [];

      const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageUris);

      if (fileInfo.exists) {
        const cachedPageData = await FileSystem.readAsStringAsync(cachedChapterPageUris);
        pageUrls = JSON.parse(cachedPageData);
      } else {
        const requestedPageData = await getChapterImageUrls(url);
        pageUrls = requestedPageData;
        await FileSystem.writeAsStringAsync(cachedChapterPageUris, JSON.stringify(pageUrls));
      }

      if (isMounted.current) {
        setChapterUrls(pageUrls);
        setCachedImageUris(pageUrls);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);
    setChapterUrls([]);
    setCachedImageUris([]);
    fetchData(currentChapterUrl);

    return () => {
      isMounted.current = false;
    };
  }, [currentChapterUrl, fetchData]);

  const clearCache = useCallback(async () => {
    try {
      const cacheKey = shorthash.unique(currentChapterUrl);
      const cachedImageUrlsFileUri = `${FileSystem.cacheDirectory}${cacheKey}`;
      const fileInfo = await FileSystem.getInfoAsync(cachedImageUrlsFileUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(cachedImageUrlsFileUri);
      }

      for (const uri of cachedImageUris) {
        const fileInfo = await FileSystem.getInfoAsync(uri);

        if (fileInfo.exists) {
          await FileSystem.deleteAsync(uri);
        }
      }

      setChapterUrls([]);
      setCachedImageUris([]);
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      Alert.alert('Failed to delete', 'Cache already cleared');
      console.log(error);
    }
  }, [cachedImageUris, currentChapterUrl]);

  const handleShowModal = useCallback(() => {
    if (!showModal) {
      StatusBar.setBackgroundColor(colors.secondary.DEFAULT);
    } else {
      StatusBar.setBackgroundColor('transparent');
    }
    setShowModal(!showModal);
  }, [showModal]);

  const handlePrevChap = useCallback(() => {
    const currentChapterIndex = chapterData.indexOf(currentChapterUrl);
    if (currentChapterIndex < chapterData.length - 1) {
      const prevChapterUrl = chapterData[currentChapterIndex + 1];
      setCurrentChapterUrl(prevChapterUrl);
    }
  }, [currentChapterUrl, chapterData]);

  const handleNextChap = useCallback(() => {
    const currentChapterIndex = chapterData.indexOf(currentChapterUrl);
    if (currentChapterIndex > 0) {
      const nextChapterUrl = chapterData[currentChapterIndex - 1];
      setCurrentChapterUrl(nextChapterUrl);
    }
  }, [currentChapterUrl, chapterData]);

  const renderItem = (item) => (
    <View key={item} className="w-full self-center">
      <TouchableWithoutFeedback onLongPress={handleShowModal}>
        {/* <View style={{ width: screenWidth, height: screenHeight }}> */}
          <ChapterPage pageUrl={item} />
        {/* </View> */}
      </TouchableWithoutFeedback>
    </View>
  );


  return (
    <View className="flex-1 bg-primary">
      <ModalPopup visible={showModal} onClose={handleShowModal}>
        <Text>Hello world</Text>
        <Button title='Clear cache' onPress={clearCache} />
        <Button title='Close' onPress={handleShowModal} />
      </ModalPopup>
      <View className="flex-1">
        {isLoading && chapterUrls.length === 0 ? (
          <ActivityIndicator />
        ) : (
          <View className="h-full w-full">
            <HorizontalReaderMode chapterUrls={chapterUrls} onLongPress={handleShowModal} itemSize={{}} />
            {/* <VerticalReaderMode chapterUrls={chapterUrls} renderItem={renderItem} /> */}
          </View>
        )}
            {isLoading && (
              <View className="flex-1 justify-center items-center">
                <Text className="text-white"><ActivityIndicator /> Loading images</Text>
              </View>
            )}
            <View className="flex-row justify-around">
              <Button title='Prev' onPress={handlePrevChap} />
              <Button title='Next' onPress={handleNextChap} />
            </View>
      </View>
    </View>
  );
};

export default MangaReaderScreen;
