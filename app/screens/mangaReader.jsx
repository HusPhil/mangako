import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, Dimensions } from 'react-native';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { getChapterImage, getChapterImageUrls } from '../../utils/MangakakalotClient';
import ImageRenderer from '../../components/ImageRenderer';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams } from 'expo-router';

const MangaReaderScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSlice, setImgSlice] = useState([]);
  const screenWidth = Dimensions.get('window').width;
  const isMounted = useRef(true);
  const { chapterUrl, chData } = useLocalSearchParams();

  useEffect(() => {
    const fetchData = async () => {
      const url = chapterUrl;
      const cacheKey = shorthash.unique(url);
      const cachedChapterPageUris = `${FileSystem.cacheDirectory}${cacheKey}`;
      let pageUrls = [];

      const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageUris);

      // If cache exists get that data, if not request the data then cache the req data
      if (fileInfo.exists) {
        const cachedPageData = await FileSystem.readAsStringAsync(cachedChapterPageUris);
        pageUrls = JSON.parse(cachedPageData);
      } else {
        const requestedPageData = await getChapterImageUrls(url);
        pageUrls = requestedPageData;
        await FileSystem.writeAsStringAsync(cachedChapterPageUris, JSON.stringify(pageUrls));
      }

      // Fetch each image and update state as soon as the image is retrieved
      for (const pageUrl of pageUrls) {
        const pageCacheKey = shorthash.unique(pageUrl);
        const pageUri = `${FileSystem.cacheDirectory}${pageCacheKey}`;
        let imageFileData;

        try {
          const pageInfo = await FileSystem.getInfoAsync(pageUri);

          if (pageInfo.exists) {
            imageFileData = await FileSystem.readAsStringAsync(pageUri, { encoding: 'base64' });
          } else {
            imageFileData = await getChapterImage(pageUrl);
            await FileSystem.writeAsStringAsync(pageUri, imageFileData, { encoding: FileSystem.EncodingType.Base64 });
          }

          if (isMounted.current) {
            setImgSlice(prevImages => [...prevImages, imageFileData]);
          }
        } catch (error) {
          console.error(error);
        }
      }

      setIsLoading(false);
    };

    fetchData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePrevChap = () => {
    // Handle previous chapter logic
  };

  const handleNextChap = () => {
    // Handle next chapter logic
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'primary' }}>
      {isLoading && imgSlice.length === 0 ? (
        <ActivityIndicator />
      ) : (
        <FlashList
          data={imgSlice}
          estimatedItemSize={100}
          renderItem={({ item }) => <ImageRenderer imageData={item} screenWidth={screenWidth} />}
          keyExtractor={(item, index) => index.toString()}
          initialNumToRender={30}
          maxToRenderPerBatch={20}
          windowSize={10}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

export default MangaReaderScreen;
