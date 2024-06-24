import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Dimensions, Text, StyleSheet } from 'react-native';
import { stackTransition, Gallery, GalleryType } from 'react-native-zoom-toolkit';
import ChapterPage from '../ChapterPage';
import * as NavigationBar from 'expo-navigation-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HorizontalReaderMode = forwardRef(({chapterUrls, inverted, onTap}, ref) => {
  const pagesRef = useRef([]);
  const galleryRef = useRef(null)
  const [ currentPage, setCurrentPage ] = useState(0) 

  useImperativeHandle(ref, () => ({
    retryFetch: () => {
      console.log(pagesRef.current[currentPage].getPageUrl(), "theindex:", currentPage)
      pagesRef.current[currentPage].fetchData()
    },
    onReadmodeChange: () => {
      console.log("Hello world")
      galleryRef.current.setIndex((chapterUrls.length - 1) - currentPage)
    }
  }));

  const renderItem = useCallback((item, index) => {
    return (
      <View >
        <ChapterPage ref={(page) => { pagesRef.current[index] = page }} pageUrl={item} />
      </View>
    );
  }, []);

  const keyExtractor = useCallback((item, index) => {
    return `${item}-${index}`;
  }, []);

  const transition = useCallback(stackTransition, []);

  return (
    <View className="h-full w-full">
      <Gallery
        ref={galleryRef}
        initialIndex={inverted ? chapterUrls.length - 1 : 0}
        data={inverted ? [...chapterUrls].reverse() : chapterUrls}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onTap={onTap}
        customTransition={transition}
        onIndexChange={(index)=>{          
          setCurrentPage(index)
          NavigationBar.setVisibilityAsync('hidden')
        }}
      />
    </View>
  );
});

export default HorizontalReaderMode;
