import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, Dimensions } from 'react-native';
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
  const { chapterUrl, chData } = useLocalSearchParams();;

  useEffect(() => {
    const fetchData = async () => {
      url = chapterUrl

      const cacheKey = shorthash.unique(url)
      const cachedChapterPageUris = `${FileSystem.cacheDirectory}${cacheKey}`
      let pageUrls = []
      
      const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageUris)
  
      //if cache exist get that data if not request the data then cache the req data
      if(fileInfo.exists) {
        const cachedPageData = await FileSystem.readAsStringAsync(cachedChapterPageUris)
        pageUrls = JSON.parse(cachedPageData)
      }
      else {
        const requestedPageData = await getChapterImageUrls(url)
        pageUrls = requestedPageData
        await FileSystem.writeAsStringAsync(cachedChapterPageUris, JSON.stringify(pageUrls))
      }

      // console.log(pageUrls)
      const imgSliceArr = [];
      // const imageUrls = [
      //   'https://v7.mkklcdnv6tempv3.com/img/tab_27/02/91/17/dr980474/chapter_200/2-o.jpg',
      //   'https://v7.mkklcdnv6tempv3.com/img/tab_27/02/91/17/dr980474/chapter_200/3-o.jpg'
      // ];
      
      for (const pageUrl of pageUrls) {
        const pageCacheKey = shorthash.unique(pageUrl)
        const pageUri = `${FileSystem.cacheDirectory}${pageCacheKey}`
        let pageInfo;
        let imageUri;
        let imageFileData;
        
        if(pageUri) {
          pageInfo = await FileSystem.getInfoAsync(pageUri)
          }
        if (pageInfo.exists) {
          imageFileData = await FileSystem.readAsStringAsync(pageUri, { encoding: 'base64' });
        } else {
          imageFileData = await getChapterImage(pageUrl);
          await FileSystem.writeAsStringAsync(pageUri, imageFileData, { encoding: FileSystem.EncodingType.Base64 });
        }
        try {          
          setImgSlice(prevImages => [...prevImages, imageFileData]);
        } catch (error) {
          console.error(error)
        }
        // const imgSlice = await getChapterImage(imageUrl);
        // imgSliceArr.push(imgSlice);
      }
      
      // setImgSlice(imgSliceArr);
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
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <FlashList
          data={imgSlice}
          estimatedItemSize={100}
          renderItem={({ item }) => <ImageRenderer imageData={item} screenWidth={screenWidth} />}
          keyExtractor={(item, index) => index.toString()}
          // horizontal
          // pagingEnabled
        />
      )}
    </View>
  );
};

export default MangaReaderScreen;
