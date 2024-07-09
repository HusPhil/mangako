import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, Button, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import useLoadPageImages from './useLoadPageImages'; // Adjust the path as needed
import ChapterPage from '../chapters/ChapterPage';
import { Gallery } from 'react-native-zoom-toolkit';

import * as FileSystem from 'expo-file-system'
import shorthash from 'shorthash';
import { getMangaDirectory } from '../../services/Global';
import { fetchData } from '../chapters/_chapters';
import { fetchPageData, getImageDimensions } from './_reader';

const HorizontalReader = ({ currentManga, chapterPages }) => {
  const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));
  const [visibleRange, setVisibleRange] = useState(3)

  const controllerRef = useRef(null)
  const isMounted = useRef(true);

  const AsyncEffect = async () => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
  
    const hashedPagePaths = await Promise.all(chapterPages.map(async (pageUrl) => {
      const pageFileName = shorthash.unique(pageUrl);
      const cachedChapterPageImagesDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName);
      const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageImagesDir.cachedFilePath)

      let imgSize = {width: 1, height: 1}

      if(fileInfo.exists) imgSize = await getImageDimensions(cachedChapterPageImagesDir.cachedFilePath)
      
      return {imgUri: cachedChapterPageImagesDir.cachedFilePath, fileExist: fileInfo.exists, imgSize};
    }));
  
    setPageImages(hashedPagePaths);
  };
  useEffect(() => {

      AsyncEffect();

      return () => {
        controllerRef.current.abort();
      };
  }, [currentManga]);

  const renderItem = useCallback((item, index) => {
    return (
      <View>
       <ChapterPage
            // ref={(page) => { pagesRef.current[index] = page;}}
            currentManga={currentManga}
            imgSrc={item}
            pageUrl={chapterPages[index]}
            pageNum={index}
            onPageLoad={()=>{}}
            onRetry={()=>{}}
        />
      </View>
    );
  }, [visibleRange]);
  const keyExtractor = useCallback((item, index) => {
    return ` ${item}-${index}`;
  }, []);

  return (
      <View className="h-full w-full">
        <View className="flex-1">
          {chapterPages && chapterPages.length > 0 ? (
            <Gallery
            data={pageImages}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            onTap={()=>{console.log("gallery pressed")}}
          />
          ) : (
            <ActivityIndicator/>
          )}
        </View>
  
      </View>
  );
};

export default HorizontalReader;