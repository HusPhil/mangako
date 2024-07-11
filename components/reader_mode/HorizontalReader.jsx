import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, Button, Dimensions, ActivityIndicator } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import { Gallery } from 'react-native-zoom-toolkit';
import { useReducer } from 'react';

import * as FileSystem from 'expo-file-system'
import shorthash from 'shorthash';
import { getMangaDirectory } from '../../services/Global';
import { getImageDimensions, fetchPageData } from './_reader';

import { readerReducer, INITIAL_STATE } from '../../redux/readerScreen/readerReducer';
import { READER_ACTIONS } from '../../redux/readerScreen/readerActions';

const HorizontalReader = ({ currentManga, chapterPages, inverted, onTap, onPageChange, currentPage }) => {
  const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));
  const [state, dispatch] = useReducer(readerReducer, INITIAL_STATE)

  const controllerRef = useRef(null)
  const isMounted = useRef(true);
  const pagesRef = useRef([])
  const galleryRef = useRef(null)

  const AsyncEffect = useCallback(async () => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
  
    const pageDataPromises = chapterPages.map(async (pageUrl, index) => {
      try {
        const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
        if (fetchedImgSrc.error) {
            throw fetchedImgSrc.error
        };
  
        const imgSize = await getImageDimensions(fetchedImgSrc.data);

        if(pagesRef.current[index]) pagesRef.current[index].toggleRender({aspectRatio: imgSize.width/imgSize.height})
  
    } catch (error) {
        console.log("Error loading pages:", error);
    }
    });
    
    await Promise.allSettled(pageDataPromises)
  }, [])

  const loadPageImages = useCallback(async () => {
    const hashedPagePaths = await Promise.all(chapterPages.map(async (pageUrl) => {
      const pageFileName = shorthash.unique(pageUrl);
      const cachedChapterPageImagesDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName);
      const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageImagesDir.cachedFilePath)

      let imgSize = {width: 1, height: 1}

      if(fileInfo.exists) imgSize = await getImageDimensions(cachedChapterPageImagesDir.cachedFilePath)
      
      return {imgUri: cachedChapterPageImagesDir.cachedFilePath, fileExist: fileInfo.exists, imgSize, tryFunc: () => {
        return 1
      }};
    }));
  
    setPageImages(hashedPagePaths);
    // if(galleryRef.current) galleryRef.current.setIndex({animated: true, index: inverted ? chapterPages.length - 1 : 0})
  }, [])

  useEffect(() => {
      loadPageImages()
      AsyncEffect();
      return () => {
        controllerRef.current.abort();
      };
  }, [chapterPages, onTap]);

  const renderItem = useCallback((item, index) => {
    return (
      <View>
       <ChapterPage
            ref={(page) => { pagesRef.current[index] = page;}}
            currentManga={currentManga}
            imgSrc={item}
            pageUrl={chapterPages[index]}
            pageNum={index}
            onPageLoad={()=>{}}
            onRetry={()=>{}}
            horizontal
        />
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item, index) => {
    return ` ${item}-${index}`;
  }, []);

  return (
      <View className="h-full w-full">
        <View className="flex-1">
          {chapterPages && chapterPages.length > 0 ? (
            <Gallery
              ref={galleryRef}
              data={inverted ? [...pageImages].reverse() : pageImages}
              initialIndex={currentPage}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              onTap={onTap}
              onIndexChange={(currentPage) => {
                onPageChange(inverted ? chapterPages.length - 1 - currentPage : currentPage)
              }}
              maxScale={2.5}
          />
          ) : (
            <ActivityIndicator size='large' color='red'/>
          )}
        </View>
  
      </View>
  );
};

export default HorizontalReader;