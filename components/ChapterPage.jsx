import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Dimensions, ActivityIndicator, Image, Button, Text } from 'react-native';
import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';

import ExpoImage from './ExpoImage';
import { getChapterImage } from '../utils/MangakakalotClient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChapterPage = ({ pageUrl, handleSwipe, maxPanFunc }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [pageImgSource, setPageImgSource] = useState(null);
  const [errorData, setErrorData] = useState(null);

  const getImageSize = useCallback((imageUri) => {
    return new Promise((resolve, reject) => {
      Image.getSize(
        imageUri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });
  }, []);

  const fetchData = useCallback(async () => {
    const pageCacheKey = shorthash.unique(pageUrl);
    const pageUri = `${FileSystem.cacheDirectory}${pageCacheKey}`;

    setIsLoading(true);
    setErrorData(null);

    try {
      const pageInfo = await FileSystem.getInfoAsync(pageUri);
      let imageUri = pageInfo.exists ? pageUri : null;

      if (!imageUri) {
        const pageImageData = await getChapterImage(pageUrl);
        await FileSystem.writeAsStringAsync(pageUri, pageImageData, { encoding: FileSystem.EncodingType.Base64 });
        imageUri = pageUri;
      }

      const pageSize = await getImageSize(imageUri);
      const aspectRatio = pageSize.width / pageSize.height;

      setPageImgSource({ uri: imageUri, aspectRatio, height: pageSize.height});
    } catch (error) {
      setErrorData(error);
    } finally {
      setIsLoading(false);
    }
  }, [pageUrl, getImageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retryButton = useMemo(() => (
    <Button onPress={fetchData} title="Retry" />
  ), [fetchData]);

  return (
    <View className="h-full p-0 m-0">
      {isLoading ? (
        <View style={{ width: screenWidth, height: screenHeight }} className="justify-center items-center">
          <ActivityIndicator size={35} />
        </View>
      ) : errorData ? (
        <View className="justify-center items-center">
          <Text>An error occurred: {errorData.message}</Text>
          {retryButton}
        </View>
      ) : (
        pageImgSource && (
          <View className="h-full m-0 p-0">
            <ExpoImage imgSrc={pageImgSource.uri} imgWidth={screenWidth} imgHeight={pageImgSource.height} imgAR={pageImgSource.aspectRatio}
              handleSwipe={handleSwipe}
              maxPanFunc={maxPanFunc}
            />
          </View>
        )
      )}
    </View>
  );
};

export default React.memo(ChapterPage);