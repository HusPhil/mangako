import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Dimensions, Text, StyleSheet } from 'react-native';
import { stackTransition, Gallery, GalleryType } from 'react-native-zoom-toolkit';
import ChapterPage from '../ChapterPage';
import * as NavigationBar from 'expo-navigation-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HorizontalReaderMode = forwardRef(({ chapterUrls, inverted, onTap, onPageChange, currentPageNum, onReaderLoadPage}, ref) => {
  const pagesRef = useRef([]);
  const galleryRef = useRef(null);
  const [invertedMode, setInvertedMode] = useState(inverted);
  const invertedModeRef = useRef(inverted); // Ref to hold the latest value of invertedMode

  useImperativeHandle(ref, () => ({
    retryFetch: () => {
      // console.log(pagesRef.current[currentPageNum].getPageUrl(), "theindex:", currentPageNum);
      pagesRef.current[inverted ? (chapterUrls.length - 1) - currentPageNum : currentPageNum].fetchData();
    },
    onReadmodeChange: () => {
      // Handle read mode change
    }
  }));



  useEffect(() => {

    setInvertedMode(inverted);
    galleryRef.current.setIndex(inverted ? (chapterUrls.length - 1) - currentPageNum : currentPageNum )

  }, [inverted]);

  // Update the ref value whenever the state changes
  useEffect(() => {
    invertedModeRef.current = invertedMode;
  }, [invertedMode]);

  const renderItem = useCallback((item, index) => {
    return (
      <View>
        <ChapterPage ref={(page) => { pagesRef.current[index] = page; }} pageUrl={item} pageNum={index}/>
      </View>
    );
  }, [inverted]);

  const keyExtractor = useCallback((item, index) => {
    return `${item}-${index}`;
  }, [inverted]);

  const transition = useCallback(stackTransition, []);

  return (
    <View className="h-full w-full">
      <Gallery
        ref={galleryRef}
        initialIndex={currentPageNum}
        data={inverted ? [...chapterUrls].reverse() : chapterUrls}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onTap={onTap}
        customTransition={transition}
        onIndexChange={(index) => {
          console.log("not inverted reader:", invertedModeRef.current);
          onPageChange(invertedModeRef.current ? chapterUrls.length - 1 - index : index)
        }}
      />
    </View> 
  );
});

export default HorizontalReaderMode;
