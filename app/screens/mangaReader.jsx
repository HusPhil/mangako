import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import shorthash from 'shorthash';
import * as FileSystem from 'expo-file-system';
import { getChapterImage, getChapterImageUrls } from '../../utils/MangakakalotClient';
import ImageRenderer from '../../components/ImageRenderer';

const MangaReaderScreen = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [imgSlice, setImgSlice] = useState([]);
  const screenWidth = Dimensions.get('window').width;
  const isMounted = useRef(true);

  useEffect(() => {
    const fetchData = async () => {
      const imgSliceArr = [];
      const imageUrls = [
        'https://v7.mkklcdnv6tempv3.com/img/tab_27/02/91/17/dr980474/chapter_200/2-o.jpg',
        'https://v7.mkklcdnv6tempv3.com/img/tab_27/02/91/17/dr980474/chapter_200/3-o.jpg'
      ];
      
      for (const imageUrl of imageUrls) {
        const imgSlice = await getChapterImage(imageUrl);
        imgSliceArr.push(imgSlice);
      }
      
      setImgSlice(imgSliceArr);
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
        <FlatList
          data={imgSlice}
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
