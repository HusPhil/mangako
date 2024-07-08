import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, ActivityIndicator, Button, Text } from 'react-native';
import { Gallery } from 'react-native-zoom-toolkit';
import ChapterPage from '../chapters/ChapterPage';
import { Image } from 'expo-image';
import { fetchPageData, getImageDimensions } from './_reader';
import { getMangaDirectory } from '../../services/Global';
import shorthash from 'shorthash'

const HorizontalReader = ({ currentManga, chapterPages }) => {

  const catImages = [
    'file:///data/user/0/host.exp.exponent/cache/Z1Xof6q/2wSp3J/chapterPageImages/1XsbQI',
    'file:///data/user/0/host.exp.exponent/cache/Z1Xof6q/2wSp3J/chapterPageImages/Z18rAGB',
    'file:///data/user/0/host.exp.exponent/cache/Z1Xof6q/2wSp3J/chapterPageImages/Z1gmjIl',
    'file:///data/user/0/host.exp.exponent/cache/Z1Xof6q/2wSp3J/chapterPageImages/Z2rn4SK',
    'https://cataas.com/cat/says/HELLO wORLD?size=50',
  ]

  const [pageImages, setPageImages] = useState([])
  
  const renderItem = useCallback((item, index) => { 
    return  (
      <View>
        <ChapterPage
          currentManga={currentManga}
          imgSrc={item}
          pageUrl={chapterPages[index]}
          pageNum={index}
          onPageLoad={() => {}}
          onRetry={() => {}}
        />
        <Text className='text-white text-2xl'>
          Hello World
        </Text>
      </View>
    ) }, []);

  const keyExtractor = useCallback((item, index) => `${item}-${index}`, []);

  useEffect(() => {

    const AsyncEffect = async() => {
      
    }

    AsyncEffect()

      const pageImageKeys = []
    
      chapterPages.forEach(pageUrl => {
        const pageFileName = shorthash.unique(pageUrl)
        const cachedChapterPageImagesDir =  getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName)

        pageImageKeys.push(cachedChapterPageImagesDir.cachedFilePath)
        
      });
      setPageImages(pageImageKeys)
  }, [])

  return ( 
    <View className="h-full w-full">
      <View className="flex-1">
        {chapterPages && pageImages.length > 0 ? (
          <Gallery
            data={pageImages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        ) : (
          <ActivityIndicator size='large' color='white'/>
        )}
      </View>
    </View>
  );
};

export default HorizontalReader;
