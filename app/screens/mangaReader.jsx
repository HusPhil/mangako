import { View, Text, Image, ActivityIndicator, Alert, Dimensions, Button, TouchableWithoutFeedback, StatusBar } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { getChapterImage, getChapterImageUrls } from '../../utils/MangakakalotClient';
import ModalPopup from '../../components/ModalPopup';
import ExpoImage from '../../components/ExpoImage';
import { FlashList } from '@shopify/flash-list';
import ChapterPage from '../../components/ChapterPage';

const MangaReaderScreen = () => {
  const { chapterUrl, chData } = useLocalSearchParams();
  const chapterData = JSON.parse(chData).map(chapter => chapter.chapterUrl);

  const [chapterImages, setChapterImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cachedImageUris, setCachedImageUris] = useState([]);
  const [currentChapterUrl, setCurrentChapterUrl] = useState(chapterUrl);

  const screenWidth = Dimensions.get('window').width;
  const isMounted = useRef(true);

  const fetchData = async (url) => {
    const getImageSize = (imageUri) => {
      return new Promise((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => {
            resolve({ width, height });
          },
          (error) => {
            reject(error);
          }
        );
      });
    };

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

      const pageUris = [];
      const newChapterImages = [];

      for (const pageUrl of pageUrls) {
        const pageCacheKey = shorthash.unique(pageUrl);
        const pageUri = `${FileSystem.cacheDirectory}${pageCacheKey}`;
        let pageInfo;
        let imageUri;

        if (pageUri) {
          pageInfo = await FileSystem.getInfoAsync(pageUri);
        }

        if (pageInfo.exists) {
          imageUri = pageUri;
        } else {
          const pageImageData = await getChapterImage(pageUrl);
          await FileSystem.writeAsStringAsync(pageUri, pageImageData, { encoding: FileSystem.EncodingType.Base64 });
          imageUri = pageUri;
        }
        pageUris.push(imageUri);

        try {
          const pageSize = await getImageSize(imageUri);
          const pageAR = pageSize.width / pageSize.height;
          const calculatedHeight = screenWidth / pageAR;

          setChapterImages(prevChapterImages => [...prevChapterImages, { uri: imageUri, width: screenWidth, height: pageSize.height, aspectRatio: pageAR, url: pageUrl }]);
        } catch (error) {
          console.error(error);
        }
      }

      if (isMounted.current) {
        // setChapterImages(newChapterImages);
        setCachedImageUris(pageUris);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);
    setChapterImages([]);
    setCachedImageUris([]);
    fetchData(currentChapterUrl);

    return () => {
      isMounted.current = false;
    };
  }, [currentChapterUrl]);

  const clearCache = async () => {
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

      setChapterImages([]);
      setCachedImageUris([]);
      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      Alert.alert('Failed to delete', 'Cache already cleared');
      console.log(error);
    }
  };

  const handleShowModal = () => {
    setShowModal(!showModal);
  };

  const handlePrevChap = () => {
    const currentChapterIndex = chapterData.indexOf(currentChapterUrl);
    if (currentChapterIndex < chapterData.length - 1) {
      const prevChapterUrl = chapterData[currentChapterIndex + 1];
      setCurrentChapterUrl(prevChapterUrl);
    }
  };

  const handleNextChap = () => {
    const currentChapterIndex = chapterData.indexOf(currentChapterUrl);
    if (currentChapterIndex > 0) {
      const nextChapterUrl = chapterData[currentChapterIndex - 1];
      setCurrentChapterUrl(nextChapterUrl);
    }
  };

  const renderItem = ({ item }) => (
    <View className="w-full self-center">
      <TouchableWithoutFeedback onLongPress={handleShowModal}>
        <View>
          {/* <ExpoImage imgSrc={ item.url } imgWidth={item.width} imgAR={item.aspectRatio} /> */}
          <ChapterPage/>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );

  return (
    <View className="flex-1 bg-primary">
      <StatusBar translucent />
      <ModalPopup visible={showModal} onClose={handleShowModal}>
        <Text>Hello world</Text>
        <Button title='Clear cache' onPress={clearCache} />
        <Button title='Close' onPress={handleShowModal} />
      </ModalPopup>
      <View className="flex-1">
        {isLoading && chapterImages.length === 0 ? (
          <ActivityIndicator />
        ) : (
          <FlashList
            data={chapterImages}
            renderItem={renderItem}
            estimatedItemSize={100}
            onEndReached={() => { console.log('finished!'); }}
            onEndReachedThreshold={2}
            ListEmptyComponent={<Text>No available pages..</Text>}
            ListFooterComponent={
              <View>
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
            }
          />
        )}
      </View>
    </View>
  );
};

export default MangaReaderScreen;
