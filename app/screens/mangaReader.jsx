import { View, Text, Image, ActivityIndicator, Alert, ScrollView, Dimensions, Button, TouchableWithoutFeedback } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChapterImage, getChapterImageUrls } from '../../utils/MangakakalotClient';
import HorizontalRule from '../../components/HorizontalRule';

const MangaReaderScreen = () => {
  const params = useLocalSearchParams();
  const { chNum, chapterUrl, chId } = params;
  const [chapterImages, setChapterImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const screenWidth = Dimensions.get('window').width;
  const cacheKey = shorthash.unique(chapterUrl)
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

        Image.getSize(imageUri, (width, height) => {
          const aspectRatio = width / height;
          setChapterImages(prevImages => [...prevImages, { uri: imageUri, aspectRatio }]);
        });
      }

    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {

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

      Alert.alert('Success', 'Cache cleared successfully');
    } catch (error) {
      Alert.alert('Failed to delete', "Cache already cleared");
      console.log(error);          
    }
    finally{
    }
  };

  return (
    <View>
      <View className="h-full w-full">
        {/* <Text>{chNum}</Text>
        <Text>{chapterUrl}</Text>
        <Text>{chId}</Text>
        <Button title='Clear cache' onPress={clearCache}/> */}

        {isLoading && chapterImages.length === 0 ? (
          <ActivityIndicator />
        ) : (
          <ScrollView>
            {chapterImages.map((imgData, index) => (
              <View>
              <TouchableWithoutFeedback onLongPress={() => {console.log("image pressed")}} key={index} className="self-center w-full">
                <Image 
                  style={{ width: screenWidth, height: screenWidth / imgData.aspectRatio }} 
                  source={{ uri: imgData.uri }} 
                />
              </TouchableWithoutFeedback>
              <HorizontalRule displayText="Page end" otherStyles={"mx-1"} />
              </View>
            ))}
            {isLoading && <ActivityIndicator />}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default MangaReaderScreen;
