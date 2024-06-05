import { View, Text, Image, ActivityIndicator, Alert, ScrollView, Dimensions, Button, TouchableWithoutFeedback } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChapterImage, getChapterImageUrls } from '../../utils/MangakakalotClient';
import HorizontalRule from '../../components/HorizontalRule';
import ModalPopup from '../../components/ModalPopup';


const MangaReaderScreen = () => {
  const params = useLocalSearchParams();
  const { chNum, chapterUrl, chIndex, chData } = params;
  const chapterData = JSON.parse(chData);
  const [chapterImages, setChapterImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [cachedImageUris, setCachedImageUris] = useState([]);
  const [currentChapterUrl, setCurrentChapterUrl] = useState()

  const screenWidth = Dimensions.get('window').width;
  const cacheKey = shorthash.unique(chapterUrl);
  const cachedImageUrlsFileUri = `${FileSystem.cacheDirectory}${cacheKey}`;

  const fetchData = async () => {
    try {
      let imageUrls = [];
      const fileInfo = await FileSystem.getInfoAsync(cachedImageUrlsFileUri);

      if (fileInfo.exists) {
        const cachedData = await FileSystem.readAsStringAsync(cachedImageUrlsFileUri);
        imageUrls = JSON.parse(cachedData);
      } else {
        imageUrls = await getChapterImageUrls(chapterUrl);
        await FileSystem.writeAsStringAsync(cachedImageUrlsFileUri, JSON.stringify(imageUrls));
      }
      
      const uris = [];
      for (const url of imageUrls) {
        const fileName = shorthash.unique(url);
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        let imageUri;
        
        if (fileInfo.exists) {
          imageUri = fileUri;
        } else {
          const imgData = await getChapterImage(url);
          await FileSystem.writeAsStringAsync(fileUri, imgData, { encoding: FileSystem.EncodingType.Base64 });
          imageUri = fileUri;
        }

        uris.push(fileUri);

        Image.getSize(imageUri, (width, height) => {
          const aspectRatio = width / height;
          setChapterImages(prevImages => [...prevImages, { uri: imageUri, aspectRatio }]);
        });
      }
      setCachedImageUris(uris);
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentChapterUrl(chapterUrl)
    fetchData();
  }, [chapterUrl]);

  const clearCache = async () => {
    try {
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

  return (
    <View className="flex-1">
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
            {isLoading && <ActivityIndicator />}
      <View className="flex-row justify-around">
        <Button title='Prev' />
        <Button title='Next'/>
      </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
  
};

export default MangaReaderScreen;
