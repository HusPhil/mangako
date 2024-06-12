import { View, Text, Image, ActivityIndicator, Alert, ScrollView, 
  Dimensions, Button, TouchableWithoutFeedback, StatusBar,
 } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { getChapterImage, getChapterImageUrls, splitLongImage } from '../../utils/MangakakalotClient';
import ModalPopup from '../../components/ModalPopup';
import ImageWebView from "../../components/ImageWebView"
import ImageRenderer from '../../components/ImageRenderer';

const MangaReaderScreen = () => {
  const params = useLocalSearchParams();
  const { chapterUrl, chData } = params;
  const chapterData = JSON.parse(chData).map(chapter => chapter.chapterUrl);
  const [chapterImages, setChapterImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cachedImageUris, setCachedImageUris] = useState([]);
  const [currentChapterUrl, setCurrentChapterUrl] = useState(chapterUrl);
  const [imgSlice, setImgSlice] = useState([])
  const [pageUrls, setPageUrls] = useState([])

  const isMounted = useRef(true);

  

  const fetchData = async (url) => {
    const imgSlice = await FileSystem.readAsStringAsync('file:///data/user/0/host.exp.exponent/cache/Z1Erv4L', { encoding: 'base64' });
    setImgSlice(imgSlice)
    
    try {
      //check cache - checking the cache for chaptserPagesUrl
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

      setPageUrls(pageUrls)
      
    } catch (error) {
      alert(error.message)
    } finally {
      setIsLoading(false)
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
      Alert.alert('Failed to delete', "Cache already cleared");
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

  return (
    <View className="flex-1 bg-primary">
      <StatusBar translucent />
      <ModalPopup
        visible={showModal}
        onClose={handleShowModal}
      >
        <Text>Hello world</Text>
        <Button title='Clear cache' onPress={clearCache} />
        <Button title='Close' onPress={handleShowModal} />
      </ModalPopup>
      <View className="flex-1">
        {isLoading && chapterImages.length === 0 ? (
          <ActivityIndicator />
        ) : (
          <ImageWebView pageUrls={pageUrls}/>          
        )}
      </View>
    </View>
  );
};

export default MangaReaderScreen;