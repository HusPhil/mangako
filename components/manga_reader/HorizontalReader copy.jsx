import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, Button, Dimensions, ActivityIndicator } from 'react-native';
import ChapterPage from '../chapters/ChapterPage';
import { Gallery } from 'react-native-zoom-toolkit';
import Toast from 'react-native-simple-toast';
import { useReducer } from 'react';

import * as FileSystem from 'expo-file-system'
import shorthash from 'shorthash';
import { getMangaDirectory } from '../../services/Global';
import { getImageDimensions, fetchPageData } from './_reader';

const HorizontalReader = ({ currentManga, chapterPages, inverted, onTap, onPageChange, currentPage }) => {
  const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));

  const controllerRef = useRef(null)
  const isMounted = useRef(true);
  const pagesRef = useRef([])
  const galleryRef = useRef(null)
  const currentReaderIndexRef = useRef(0)

  const AsyncEffect = useCallback(async () => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
  
    for (let pageNum = 0; pageNum < chapterPages.length; pageNum++) {
      await loadPageImages(chapterPages[pageNum], pageNum, signal);
    }
    
  }, [])

  const loadPageImages = useCallback(async (pageUrl, pageNum, abortSignal) => {
    try {
      console.log("HELLO WORLD NATAWAG ANG LOAD")

      const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, abortSignal);
      if (fetchedImgSrc.error) {
        console.log("error on hor reader loading the pages")
        const imgSize = {width: 1, height: 1}
        setPageImages(prev => {
          newPages = [...prev];
          newPages[pageNum] = {imgUri: null, error: fetchedImgSrc.error, imgSize};
          return newPages;
        })
        throw fetchedImgSrc.error
      };

      
      const imgSize = await getImageDimensions(fetchedImgSrc.data);
      
      if(pagesRef.current[pageNum]) pagesRef.current[pageNum].toggleRender({aspectRatio: imgSize.width/imgSize.height})
      // console.log("loaded page:", pageNum)

    } catch (error) {
        console.log("Error loading pages:", error);
        throw error
    }
  } , [])

  const getHashedPagePaths = useCallback(async () => {
    const hashedPagePaths = await Promise.all(chapterPages.map(async (pageUrl) => {
      const pageFileName = shorthash.unique(pageUrl);
      const cachedChapterPageImagesDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName);
      const fileInfo = await FileSystem.getInfoAsync(cachedChapterPageImagesDir.cachedFilePath)

      let imgSize = {width: 1, height: 1}

      if(fileInfo.exists) imgSize = await getImageDimensions(cachedChapterPageImagesDir.cachedFilePath)
      
      return {imgUri: cachedChapterPageImagesDir.cachedFilePath, imgSize};
    }));
  
    setPageImages(hashedPagePaths);
    // if(galleryRef.current) galleryRef.current.setIndex({animated: true, index: inverted ? chapterPages.length - 1 : 0})
  }, [])

  const handleRetry = useCallback(async (pageNum) => {
    console.log("retry page:", pageNum)
    controllerRef.current =  new AbortController()
    const signal = controllerRef.current.signal
    
    try {
      const imgSize = {width: 1, height: 1}
      console.log("RETRY MODE WAS CALLED")
      const pageFileName = shorthash.unique(chapterPages[pageNum]);
      const cachedChapterPageImagesDir = getMangaDirectory(currentManga.manga, currentManga.chapter, "chapterPageImages", pageFileName);
      setPageImages(prev => {
        newPages = [...prev] 
        newPages[pageNum] = {imgUri: cachedChapterPageImagesDir.cachedFilePath, imgSize, error: null}
        return newPages
      })
      await loadPageImages(chapterPages[pageNum],  pageNum, signal)


    } catch (error) {
      Toast.show(
        `An error occured: ${error}`,
        Toast.LONG,
      );
    }

    console.log("retry page done")

  }, [])

  useEffect(() => {
      getHashedPagePaths()
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
        <View className="flex-1"
          
        >
          {chapterPages && chapterPages.length > 0 ? (
            <Gallery
              ref={galleryRef}
              onResponderStart={(e) => {
                console.log(e)
              }}
              data={inverted ? [...pageImages].reverse() : pageImages}
              initialIndex={currentPage}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              onTap={() => {
                onTap(pageImages)
              }}

              onSwipe={async (swipeDirection) => {
                if(swipeDirection === 1) {
                  await handleRetry(currentReaderIndexRef.current)
                }
              }}
              onIndexChange={(currentPage) => {
                currentReaderIndexRef.current = currentPage
                console.log("the page:", pagesRef.current[currentPage].getPageSrc())

                if(currentPage === chapterPages.length - 1) {
                  onPageChange(inverted ? chapterPages.length - 1 - currentPage : currentPage, {finished: true})
                }

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