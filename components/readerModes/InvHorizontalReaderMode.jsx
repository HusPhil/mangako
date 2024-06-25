import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { View, Dimensions, Text, StyleSheet } from 'react-native';
import { stackTransition, Gallery, GalleryType } from 'react-native-zoom-toolkit';
import ChapterPage from '../ChapterPage';
import * as NavigationBar from 'expo-navigation-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const InvHorizontalReaderMode = forwardRef(({chapterUrls, inverted, onTap, onPageChange, currentPageNum, }, ref) => {
  const pagesRef = useRef([]);
  const galleryRef = useRef(null)

  useImperativeHandle(ref, () => ({
    retryFetch: () => {
      console.log(pagesRef.current[currentPageNum].getPageUrl(), "theindex:", currentPageNum)
      pagesRef.current[currentPageNum].fetchData()
    },
    onReadmodeChange: () => {

    }
  }));

  useEffect(()=> {
    console.log("inverted:", inverted)
    console.log("currentPageNum:", currentPageNum, "::", "invertedNum:" , (chapterUrls.length - 1) - currentPageNum)
    galleryRef.current.setIndex(inverted ? (chapterUrls.length - 1) - currentPageNum : currentPageNum )

  }, [])

  const onChangeIndex = useCallback((index)=>{          
    console.log("chaneg index", index)
    // onPageChange(inverted ? index : chapterUrls.length - 1 - index)
    // onPageChange(index)
    console.log("i am not inverted:")
    NavigationBar.setVisibilityAsync('hidden')
  }, [inverted])
  
  const onChangeIndexInv = useCallback((index)=>{          
    console.log("chaneg index", index)

    // onPageChange(inverted ? index : chapterUrls.length - 1 - index)
    // onPageChange(index)
    console.log("inverted:", inverted)
    NavigationBar.setVisibilityAsync('hidden')
  }, [inverted])

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
        data={[...chapterUrls].reverse()}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onTap={onTap}
        customTransition={transition}
        onIndexChange={() => {
          console.log("inverted reader")
        }}
      />
    </View>
  );
});

export default InvHorizontalReaderMode;
