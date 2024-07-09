import React, { useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, Button, Dimensions, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import useLoadPageImages from './useLoadPageImages'; // Adjust the path as needed
import ChapterPage from '../chapters/ChapterPage';
import { Gallery } from 'react-native-zoom-toolkit';


import { fetchPageData, getImageDimensions } from "./_reader";

const HorizontalReader = ({ currentManga, chapterPages }) => {
  const [pageImages, setPageImages] = useState(Array(chapterPages.length).fill(undefined));
  const [visibleRange, setVisibleRange] = useState(3)

  const controllerRef = useRef(null)
  const isMounted = useRef(true);

  const AsyncEffect = async () => {
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    const pageDataPromises = chapterPages.map(async (pageUrl, index) => {
      await loadPageImages(index, pageUrl, signal)
  });
  
  await Promise.allSettled(pageDataPromises)
  }

  useEffect(() => {

      AsyncEffect();

      return () => {
        controllerRef.current.abort();
      };
  }, [currentManga]);

  const loadPageImages = async (pageNum, pageUrl, signal) => {
    try {
        const fetchedImgSrc = await fetchPageData(currentManga.manga, currentManga.chapter, pageUrl, signal);
        if (fetchedImgSrc.error) {
            setPageImages(prev => {
                const newPageImages = [...prev];
                newPageImages[pageNum] = { imgUri: undefined, imgSize, error: fetchedImgSrc.error };
                return newPageImages;
            });
            throw fetchedImgSrc.error
        };

        const imgSize = await getImageDimensions(fetchedImgSrc.data);
        if (isMounted.current) {
            setPageImages(prev => {
                const newPageImages = [...prev];
                newPageImages[pageNum] = { imgUri: fetchedImgSrc.data, imgSize };
                return newPageImages;
            });
        }
    } catch (error) {
        console.log("Error loading pages:", error);
    }
}

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
            onIndexChange={(currentIndex) => {
              if(currentIndex === visibleRange - 1) {
                // console.log(currentIndex, visibleRange)
                setVisibleRange(prev => prev + 3)
              }
              console.log(currentIndex, visibleRange)

            }}
          />
          ) : (
            <ActivityIndicator/>
          )}
        </View>
  
      </View>
  );
};

export default HorizontalReader;