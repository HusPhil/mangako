import { View, Text, Image, ActivityIndicator, Alert, ScrollView, Dimensions, Button, TouchableWithoutFeedback, StatusBar } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChapterImage, getChapterImageUrls } from '../../utils/MangakakalotClient';
import HorizontalRule from '../../components/HorizontalRule';
import ModalPopup from '../../components/ModalPopup';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';

const MangaReaderScreen = () => {
  const params = useLocalSearchParams();
  const { chapterUrl, chData } = params;
  const chapterData = JSON.parse(chData).map(chapter => chapter.chapterUrl);
  const screenWidth = Dimensions.get('window').width;

  const [chapterImages, setChapterImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cachedImageUris, setCachedImageUris] = useState([]);
  const [currentChapterUrl, setCurrentChapterUrl] = useState(chapterUrl);

  const isMounted = useRef(true);

  const fetchData = async (url) => {
    const MAX_RETRIES = 3;
    
    const getImageSizeWithRetry = (imageUri, retryCount = 0) => {
      return new Promise((resolve, reject) => {
        Image.getSize(
          imageUri,
          (width, height) => {
            resolve({ width, height });
          },
          async (error) => {
            if (retryCount < MAX_RETRIES) {
              console.warn(`Retrying to get size for image: ${imageUri}, attempt ${retryCount + 1}`);
              resolve(await getImageSizeWithRetry(imageUri, retryCount + 1));
            } else {
              reject(`Failed to get size for image: ${imageUri} after ${MAX_RETRIES} attempts`);
            }
          }
        );
      });
    };

    try {
      const cacheKey = shorthash.unique(url);
      const cachedImageUrlsFileUri = `${FileSystem.cacheDirectory}${cacheKey}`;
      let imageUrls = [];
  
      const fileInfo = await FileSystem.getInfoAsync(cachedImageUrlsFileUri);
      if (fileInfo.exists) {
        const cachedData = await FileSystem.readAsStringAsync(cachedImageUrlsFileUri);
        imageUrls = JSON.parse(cachedData);
      } else {
        imageUrls = await getChapterImageUrls(url);
        await FileSystem.writeAsStringAsync(cachedImageUrlsFileUri, JSON.stringify(imageUrls));
      }
  
      const uris = [];
      for (const imageUrl of imageUrls) {
        const fileName = shorthash.unique(imageUrl);
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
  
        let imageUri;
  
        if (fileInfo.exists) {
          imageUri = fileUri;
        } else {
          const imgData = await getChapterImage(imageUrl);
          await FileSystem.writeAsStringAsync(fileUri, imgData, { encoding: FileSystem.EncodingType.Base64 });
          imageUri = fileUri;
        }
  
        uris.push(imageUri);
  
        try {
          const { width, height } = await getImageSizeWithRetry(imageUri);
          const aspectRatio = width / height;
          if (isMounted.current) {
            setChapterImages(prevImages => [...prevImages, { uri: imageUri, aspectRatio }]);
          }
        } catch (error) {
          console.error(error);
          // Handle the error or fallback here if necessary
        }
      }
      if (isMounted.current) {
        setCachedImageUris(uris);
      }
    } catch (error) {
      if (isMounted.current) {
        Alert.alert("Error", error.message);
      }
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
          <ScrollView>
            <ReactNativeZoomableView
              maxZoom={5}
              minZoom={1}
              zoomStep={0.5}
              initialZoom={1}
              bindToBorders={true}
              onZoomAfter={this.logOutZoomState}
              movementSensibility={0.5}
              disablePanOnInitialZoom
            >
              {chapterImages.map((imgData, index) => (
                <View key={index} className="w-full self-center">
                  <TouchableWithoutFeedback onLongPress={handleShowModal}>
                    <Image
                      style={{ width: screenWidth, height: screenWidth / imgData.aspectRatio }}
                      source={{ uri: imgData.uri }}
                      
                      />
                  </TouchableWithoutFeedback>
                  <HorizontalRule displayText="Page end" otherStyles={"mx-1"} />
                </View>
              ))}
            </ReactNativeZoomableView>
            {isLoading && (
              <View className="flex-1 justify-center items-center">
                <Text className="text-white"><ActivityIndicator/> Loading images</Text>
              </View>
            )}
            <View className="flex-row justify-around">
              <Button title='Prev' onPress={handlePrevChap} />
              <Button title='Next' onPress={handleNextChap} />
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default MangaReaderScreen;
