import React, { useCallback, useRef } from 'react';
import { View, Dimensions, TouchableWithoutFeedback, FlatList, Image } from 'react-native';
import ChapterPage from '../ChapterPage';
import ImageZoom from 'react-native-image-pan-zoom';
// import { Image } from 'expo-image';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const HorizontalReaderMode = ({ chapterUrls, onLongPress }) => {



  const renderItem = useCallback(({ item, index }) => (
    <View className="m-0 p-0" >
        <ChapterPage pageUrl={item} handleSwipe={
          (swipeRight) => {
            if(swipeRight) {
              swipeToItem(index + 1)
            }
            else {
              swipeToItem(index - 1)
            }
        }
        }/>
    </View>
  ), [onLongPress]);


  const flRef = useRef(null)

  const swipeToItem = (index) => {
    if (flRef.current) {
      flRef.current.scrollToIndex({ index });
    }
  };

  return (
    <FlatList
      ref={flRef}
      data={chapterUrls}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item}-${index}`}
      horizontal
      pagingEnabled
      inverted
    />
  );
};

export default HorizontalReaderMode;