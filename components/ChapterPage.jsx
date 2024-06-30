import React, { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle  } from 'react';
import { View, Dimensions, ActivityIndicator, Image, Button, Text } from 'react-native';
import * as FileSystem from 'expo-file-system';
import shorthash from 'shorthash';

import ExpoImage from './ExpoImage';
import { getChapterImage } from '../utils/MangakakalotClient';
import { useImageResolution } from 'react-native-zoom-toolkit';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ChapterPage = forwardRef(({ pageUrl, pageNum, onLoad, currentManga }, ref) => {
  const [isLoading, setIsLoading] = useState(true);
  const [pageImgSource, setPageImgSource] = useState(null);
  const [errorData, setErrorData] = useState(null);

  
  

  useImperativeHandle(ref, () => ({
    fetchData,
    getPageUrl: () =>  pageUrl,
    getPageNum: () =>  pageNum,
  }));

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
      if (pageNum === currentManga.chapterUrls.length - 1) {
        pushNotif({pageNum})
      }
    }
  }, [pageUrl, getImageSize]);

  useEffect(() => {
    fetchData();
    
    
  }, [fetchData, ]);

  

  const retryButton = useMemo(() => (
    <Button onPress={fetchData} title="Retry" />
  ), [fetchData]);

  return (
    <View>
      {isLoading ? (
        <View style={{ width: screenWidth, height: screenHeight/2 }} className="justify-center items-center">
          <ActivityIndicator size={35} />
        </View>
      ) : errorData ? (
        <View className="justify-center items-center">
          <Text>An error occurred: {errorData.message}</Text>
          {retryButton}
        </View>
      ) : (
        pageImgSource && (
          <View className="" onLayout={()=>{
          }}>
            <ExpoImage 
              imgSrc={pageImgSource.uri} 
              imgSize={{width:screenWidth, height: pageImgSource.height, aspectRatio: pageImgSource.aspectRatio}} 
              onLoad={onLoad}
            />
          </View>
        )
      )}
    </View>
  );
});

export default React.memo(ChapterPage);